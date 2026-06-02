import {
  ActionHash,
  AgentPubKey,
  AppClient,
  AppInfo,
  AppWebsocket,
  CellId,
  CellType,
  DnaHash,
  encodeHashToBase64,
} from "@holochain/client";
import { provide } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { clientContext } from "./contexts";
import { sharedStyles } from "./shared-styles";

// Types from our subfolders
import { CellEntry, AnchorLinkEntry, JurisdictionalClaimEntry, RegisterCellInput } from "./global_registry/registry/types";
import { HousingIssue, BindingChallenge, IssueStatus } from "./housing/housing/types";
import { IssueEntry, CommentEntry } from "./manhattan_windturbine/wind_turbine/types";

// Role names from happ.yaml (spec 050).
const ROLE_WIND_TURBINE = "manhattan_windturbine";
const ROLE_HOUSING = "housing";
const ROLE_REGISTRY = "global_registry";

// Unified UI representation of an issue, regardless of which cell it lives in.
interface UIIssue {
  id: string; // base64(actionHash) in live mode, mock placeholder in mock mode
  actionHash?: ActionHash;
  cell: "manhattan" | "housing";
  title: string;
  description: string;
  location: string;
  status: IssueStatus;
  hasGeotaggedEvidence: boolean;
  creator: string;
  comments: CommentEntry[]; // legacy; only used in mock mode
  capSecret?: string;
  challengeCount?: number; // populated from DHT for live housing issues
  // Origin cell — populated for live wind_turbine issues so the UI can
  // route comment writes to the correct clone (spec 050).
  cellDnaB64?: string;
  cellName?: string;
}

/// One joined wind_turbine-role cell in the local conductor (provisioned or
/// cloned). Built from `cell_info` on every appInfo refresh.
interface JoinedCell {
  cellId: CellId;
  dnaB64: string;
  role: string;
  name: string;
  isProvisioned: boolean;
}

/// Registry entry as seen by the UI (action hash + decoded `CellEntry`).
interface DiscoverableCell {
  actionHash: ActionHash;
  actionHashB64: string;
  name: string;
  roleName: string;
  networkSeed: string;
  dnaHash: DnaHash;
  dnaB64: string;
  creator: AgentPubKey;
  creatorB64: string;
}

interface UINotification {
  id: string;
  type: "issue" | "challenge" | "comment" | "access";
  message: string;
  time: string;
  unread: boolean;
}

interface ActivityLog {
  agent: string;
  action: string;
  details: string;
  time: string;
}

interface DBState {
  issues: Array<{
    id: string; // Base64 representation of action hash (or mock placeholder)
    actionHash?: ActionHash; // Real on-chain hash when created via zome call
    cell: "manhattan" | "housing";
    title: string;
    description: string;
    location: string;
    status: IssueStatus;
    hasGeotaggedEvidence: boolean;
    creator: string;
    comments: CommentEntry[];
    capSecret?: string;
  }>;
  claims: JurisdictionalClaimEntry[];
  anchorLinks: AnchorLinkEntry[];
}

@customElement("holochain-app")
export class HolochainApp extends LitElement {
  @state() loading = false;
  @state() error: string | undefined;

  @provide({ context: clientContext })
  @property({ type: Object })
  client!: AppClient;

  // Connection State
  @state() isMock = false;
  @state() agentPubKey: AgentPubKey | undefined;
  @state() agentB64 = "";
  // Cached AppInfo so we don't re-await on every zome call and so extractCellId works synchronously.
  private cachedAppInfo: AppInfo | undefined;
  
  // Agent Persona (For Live Mode, determined by agent index/pubkey. For Mock, toggled manually)
  @state() activeAgentName = "Elena";
  @state() activeAgentRole = "Manhattan Resident";
  @state() activeAgentHint = "New York, USA";
  
  // Wallet state with Demurrage Ticker
  @state() walletBalance = 100.00;
  @state() walletInitialBalance = 100.00;
  @state() walletStartTime = Date.now();
  private walletTickerInterval: any;
  private demurrageRate = 0.05 / (30 * 24 * 3600); // 5% decay per month in seconds

  // Feed and discovery state
  @state() searchQuery = "";
  @state() searchMatches: Array<{ title: string; matchScore: number; cell: string }> = [];
  @state() activeLenses: string[] = ["#general", "#new-york"];
  @state() activeIssues: UIIssue[] = [];
  @state() expandedIssueId: string | null = null;
  @state() commentsMap: { [issueId: string]: CommentEntry[] } = {};

  // Live DHT-derived issues. Populated by refreshFromDht() in live mode.
  // Distinct from mockDb.issues, which only seeds the standalone preview.
  @state() liveIssues: UIIssue[] = [];
  private dhtPollInterval: any;

  // Persona picker (live mode only). hc-spin gives each window a random
  // APP_INTERFACE_PORT and no stable agent index, and it also rebuilds
  // `userData` under a fresh tmp dir on every run — so neither port-modulo
  // nor localStorage can deterministically pick "which persona is this
  // window". We just ask the operator in each window.
  @state() personaPickerVisible = false;
  private readonly personaOptions: Array<{
    name: string;
    role: string;
    hint: string;
    wallet: number;
    lenses: string[];
  }> = [
    { name: "Elena",  role: "Manhattan Resident", hint: "New York, USA", wallet: 150.00, lenses: ["#general", "#new-york"] },
    { name: "Marcus", role: "NYC Resident",       hint: "Brooklyn, USA", wallet: 240.50, lenses: ["#general", "#housing"] },
    { name: "Amina",  role: "Nairobi Engineer",   hint: "Nairobi, Kenya", wallet:  85.00, lenses: ["#general", "#wind-power"] },
  ];

  // Form Modals
  @state() showCreateIssueModal = false;
  @state() newIssueTitle = "";
  @state() newIssueDesc = "";
  @state() newIssueLocation = "Manhattan";
  @state() newIssueHasEvidence = false;
  @state() newIssueTags = "#wind-power";
  // Target cell for a new wind_turbine-role issue. `"housing"` is a
  // sentinel that routes to the (single, provisioned) housing cell instead.
  @state() newIssueTargetDnaB64 = "";

  // Communities (spec 050)
  @state() registeredCells: DiscoverableCell[] = [];
  @state() joinedCells: JoinedCell[] = [];
  @state() showCreateCellModal = false;
  @state() newCellName = "";
  @state() creatingCell = false;
  @state() joiningCellDnaB64: string | null = null;

  // CAP Token Handshake State
  @state() activeCapSecrets: { [issueId: string]: string } = {};

  // Notifications and Activity Logs
  @state() notifications: UINotification[] = [
    { id: "1", type: "access", message: "Humanity verification check passed successfully.", time: "Just now", unread: true },
  ];
  @state() activities: ActivityLog[] = [
    { agent: "System", action: "initialized", details: "Kindact Substrate connection established.", time: "5m ago" }
  ];

  // Simulated Database for Standalone Mock Mode
  private mockDb: DBState = {
    issues: [
      {
        id: "uhCkkY2p3Q1dBb1d2...wind1",
        cell: "manhattan",
        title: "Manhattan Wind Turbine grid leakage",
        description: "Substation 4B in the Manhattan Offshore Wind Grid is reporting minor energy leakage. We need local engineers to audit the transformer bindings.",
        location: "Manhattan",
        status: "Deliberating",
        hasGeotaggedEvidence: true,
        creator: "uhCAgElenaPubKey...",
        comments: [
          { issue_id: null as any, author: null as any, content: "Transformer binds look intact, checking coil configuration." }
        ]
      },
      {
        id: "uhCkkY5p3Q2dBb2d5...housing1",
        cell: "housing",
        title: "Berlin affordable unit conversion proposal",
        description: "Converting former office buildings in Friedrichshain into low-demurrage community-managed housing cooperatives.",
        location: "Berlin",
        status: "Implementing",
        hasGeotaggedEvidence: true,
        creator: "uhCAgElenaPubKey...",
        comments: []
      }
    ],
    claims: [
      {
        claim_id: "jc:berlin-housing-rules-v1",
        scope_geographic: ["Berlin"],
        topic_tags: ["#housing"],
        decision_engine: "consensus_neighbor_agreement",
        verification_tier: "geotagged_evidence_required"
      }
    ],
    anchorLinks: []
  };

  async firstUpdated() {
    this.loading = true;
    this.startWalletTicker();

    try {
      // 1. Try connecting to the real Holochain conductor
      const env = (window as any).__HC_LAUNCHER_ENV__;
      if (env) {
        this.client = await AppWebsocket.connect({
          url: new URL(`ws://localhost:${env.APP_INTERFACE_PORT}`),
          token: env.APP_INTERFACE_TOKEN,
        });
        
        const appInfo = await this.client.appInfo();
        if (appInfo) {
          this.cachedAppInfo = appInfo;
          this.agentPubKey = appInfo.agent_pub_key;
          this.agentB64 = encodeHashToBase64(appInfo.agent_pub_key);
          this.isMock = false;

          // Defer persona setup + DHT load until the operator picks a
          // persona in this window. See `applyPersona` / `selectPersona`.
          this.personaPickerVisible = true;
        } else {
          throw new Error("Could not fetch app info.");
        }
      } else {
        throw new Error("No Launcher environment found. Falling back to Standalone Preview.");
      }
    } catch (e) {
      console.warn("Holochain connection omitted, enabling standalone preview: ", e);
      this.isMock = true;
      this.agentB64 = "uhCAgElenaFakePubKey1234567890abcdefg";
      this.walletBalance = 100.00;
      this.walletInitialBalance = 100.00;
      this.logActivity("Elena", "connected", "Standalone mock preview mode.");
      this.updateActiveIssues();
    } finally {
      this.loading = false;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.walletTickerInterval) clearInterval(this.walletTickerInterval);
    if (this.dhtPollInterval) clearInterval(this.dhtPollInterval);
  }

  // Wallet Demurrage countdown ticker
  private startWalletTicker() {
    this.walletTickerInterval = setInterval(() => {
      const elapsedSeconds = (Date.now() - this.walletStartTime) / 1000;
      this.walletBalance = this.walletInitialBalance * Math.exp(-this.demurrageRate * elapsedSeconds);
      this.requestUpdate();
    }, 1000);
  }

  // Helper to log user action in activity stream
  private logActivity(agent: string, action: string, details: string) {
    this.activities = [
      { agent, action, details, time: "Just now" },
      ...this.activities.slice(0, 12)
    ];
  }

  // Helper to add notification
  private addNotification(type: "issue" | "challenge" | "comment" | "access", message: string) {
    const id = Date.now().toString();
    this.notifications = [
      { id, type, message, time: "Just now", unread: true },
      ...this.notifications
    ];
  }

  // Apply the persona-config block (display name, role, wallet, default
  // lenses). Pure state mutation — does not touch the DHT.
  private applyPersona(name: string) {
    const persona = this.personaOptions.find((p) => p.name === name);
    if (!persona) return;
    this.activeAgentName = persona.name;
    this.activeAgentRole = persona.role;
    this.activeAgentHint = persona.hint;
    this.walletBalance = persona.wallet;
    this.walletInitialBalance = persona.wallet;
    this.walletStartTime = Date.now();
    this.activeLenses = [...persona.lenses];
  }

  // Live-mode picker handler: pick → apply → load DHT data.
  private async selectPersona(name: string) {
    this.applyPersona(name);
    this.personaPickerVisible = false;
    this.logActivity(this.activeAgentName, "connected", "Real Holochain Node WebSocket online.");
    this.loading = true;
    try {
      await this.loadRealData();
    } finally {
      this.loading = false;
    }
  }

  // Load Real Data from Holochain Cells
  private async loadRealData() {
    try {
      // Seed the joined-cell list before anything else — every other path
      // looks up cells by DNA hash via `joinedCells`.
      await this.refreshAppInfoAndJoinedCells();

      // Reconcile the agent's default lens set with what's actually on chain
      // — any lens in `activeLenses` that isn't an active subscription gets
      // written; nothing on chain gets deleted here (the user owns that).
      await this.reconcileSubscriptionsFromLenses();

      // Default the create-issue target to the provisioned wind_turbine cell.
      const provisioned = this.windTurbineCells().find((c) => c.isProvisioned);
      if (provisioned) {
        this.newIssueTargetDnaB64 = provisioned.dnaB64;
      }

      // Pull initial registry snapshot.
      await this.fetchRegisteredCells();

      // Pull a first issue snapshot, then start the 3s poll.
      await this.refreshFromDht();
      this.dhtPollInterval = setInterval(() => {
        this.refreshFromDht().catch((e) =>
          console.warn("refreshFromDht poll failed:", e)
        );
      }, 3000);
      this.updateActiveIssues();
    } catch (e) {
      this.error = "Error loading Zome data: " + (e as Error).message;
    }
  }

  // ---------------------------------------------------------------------------
  // Registry: subscriptions
  // ---------------------------------------------------------------------------

  /** All registry-recorded subscription anchors for the current agent. */
  private async fetchSubscriptions(): Promise<string[]> {
    if (this.isMock || !this.client) return [];
    const registryCell = this.extractCellId("global_registry");
    return await this.client.callZome({
      cell_id: registryCell,
      zome_name: "registry",
      fn_name: "get_subscriptions",
      payload: null,
    });
  }

  /** Idempotent on-chain subscribe. */
  private async subscribeToAnchor(anchor: string): Promise<void> {
    if (this.isMock || !this.client) return;
    const registryCell = this.extractCellId("global_registry");
    await this.client.callZome({
      cell_id: registryCell,
      zome_name: "registry",
      fn_name: "subscribe",
      payload: anchor,
    });
  }

  /** Delete every matching SubscriptionEntry on the current agent's chain. */
  private async unsubscribeFromAnchor(anchor: string): Promise<void> {
    if (this.isMock || !this.client) return;
    const registryCell = this.extractCellId("global_registry");
    await this.client.callZome({
      cell_id: registryCell,
      zome_name: "registry",
      fn_name: "unsubscribe",
      payload: anchor,
    });
  }

  /**
   * On first connect, make sure every non-#general lens the agent has in
   * memory is also recorded on the source chain. We never auto-unsubscribe
   * from anchors that exist on chain but aren't in `activeLenses`; that
   * would silently revert the user's prior choices on every reload.
   */
  private async reconcileSubscriptionsFromLenses(): Promise<void> {
    if (this.isMock || !this.client) return;
    let onChain: string[] = [];
    try {
      onChain = await this.fetchSubscriptions();
    } catch (e) {
      console.warn("fetchSubscriptions failed during reconcile:", e);
      return;
    }
    for (const lens of this.activeLenses) {
      if (lens === "#general") continue;
      if (!onChain.includes(lens)) {
        try {
          await this.subscribeToAnchor(lens);
        } catch (e) {
          console.warn(`subscribe(${lens}) failed during reconcile:`, e);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Communities (spec 050): registry directory + clone-cell management
  // ---------------------------------------------------------------------------

  /// Refresh the cached `AppInfo` and rebuild the `joinedCells` list from
  /// `cell_info`. Call this after any `createCloneCell` so the new clone
  /// becomes visible to dropdowns and the "Joined" badge.
  private async refreshAppInfoAndJoinedCells() {
    if (this.isMock || !this.client) return;
    const appInfo = await this.client.appInfo();
    if (!appInfo) return;
    this.cachedAppInfo = appInfo;

    const cells: JoinedCell[] = [];
    for (const [role, infos] of Object.entries(appInfo.cell_info)) {
      for (const info of infos) {
        if (info.type === CellType.Provisioned) {
          cells.push({
            cellId: info.value.cell_id,
            dnaB64: encodeHashToBase64(info.value.cell_id[0]),
            role,
            name: info.value.name || role,
            isProvisioned: true,
          });
        } else if (info.type === CellType.Cloned) {
          cells.push({
            cellId: info.value.cell_id,
            dnaB64: encodeHashToBase64(info.value.cell_id[0]),
            role,
            name: info.value.name || info.value.clone_id,
            isProvisioned: false,
          });
        }
      }
    }
    this.joinedCells = cells;
  }

  /// Read every cell in the registry directory.
  private async fetchRegisteredCells(): Promise<void> {
    if (this.isMock || !this.client) return;
    try {
      const registryCell = this.extractCellId(ROLE_REGISTRY);
      const entries: Array<[ActionHash, CellEntry]> = await this.client.callZome({
        cell_id: registryCell,
        zome_name: "registry",
        fn_name: "get_all_cells",
        payload: null,
      });
      this.registeredCells = entries.map(([actionHash, cell]) => ({
        actionHash,
        actionHashB64: encodeHashToBase64(actionHash),
        name: cell.name,
        roleName: cell.role_name,
        networkSeed: cell.network_seed,
        dnaHash: cell.dna_hash,
        dnaB64: encodeHashToBase64(cell.dna_hash),
        creator: cell.creator,
        creatorB64: encodeHashToBase64(cell.creator),
      }));
    } catch (e) {
      console.warn("get_all_cells failed:", e);
    }
  }

  /// Look up a joined cell by its DNA hash. Used to resolve `cell_dna_hash`
  /// routing keys from anchor links back to a local `CellId`.
  private joinedCellByDnaB64(dnaB64: string): JoinedCell | undefined {
    return this.joinedCells.find((c) => c.dnaB64 === dnaB64);
  }

  /// Create a brand-new community cell (clone of the wind_turbine role) and
  /// register it in the global directory so other agents can discover it.
  private async createCommunityCell() {
    const name = this.newCellName.trim();
    if (!name || this.isMock || !this.client) return;
    this.creatingCell = true;
    try {
      const networkSeed = "kindact-community-" + crypto.randomUUID();
      const cloned = await this.client.createCloneCell({
        role_name: ROLE_WIND_TURBINE,
        modifiers: { network_seed: networkSeed },
        name,
      });

      const dnaHash = cloned.cell_id[0];
      const registryCell = this.extractCellId(ROLE_REGISTRY);
      const input: RegisterCellInput = {
        name,
        role_name: ROLE_WIND_TURBINE,
        network_seed: networkSeed,
        dna_hash: dnaHash,
      };
      await this.client.callZome({
        cell_id: registryCell,
        zome_name: "registry",
        fn_name: "register_cell",
        payload: input,
      });

      await this.refreshAppInfoAndJoinedCells();
      await this.fetchRegisteredCells();
      this.logActivity(this.activeAgentName, "created community", `"${name}" cell published to registry.`);
      this.addNotification("issue", `Created community cell "${name}".`);
      this.newCellName = "";
      this.showCreateCellModal = false;
      // Pull through any issues already gossiped from the new cell (none yet,
      // but keeps state in sync).
      await this.refreshFromDht();
    } catch (e: any) {
      alert("Create community failed: " + e.message);
    } finally {
      this.creatingCell = false;
    }
  }

  /// Join an already-registered community cell by cloning its DNA with the
  /// same network seed.
  private async joinCommunityCell(cell: DiscoverableCell) {
    if (this.isMock || !this.client) return;
    this.joiningCellDnaB64 = cell.dnaB64;
    try {
      const cloned = await this.client.createCloneCell({
        role_name: cell.roleName,
        modifiers: { network_seed: cell.networkSeed },
        name: cell.name,
      });
      // Sanity check: same role + same seed must yield the registry's
      // declared DNA hash. A mismatch means the descriptor lied (different
      // base DNA, different modifier hint, etc.). Better to fail loudly
      // than silently end up on a different DHT.
      const clonedDnaB64 = encodeHashToBase64(cloned.cell_id[0]);
      if (clonedDnaB64 !== cell.dnaB64) {
        throw new Error(
          `Joined clone DNA hash mismatch — expected ${cell.dnaB64}, got ${clonedDnaB64}.`
        );
      }
      await this.refreshAppInfoAndJoinedCells();
      this.logActivity(this.activeAgentName, "joined community", `"${cell.name}".`);
      this.addNotification("access", `Joined community cell "${cell.name}".`);
      await this.refreshFromDht();
    } catch (e: any) {
      alert("Join failed: " + e.message);
    } finally {
      this.joiningCellDnaB64 = null;
    }
  }

  /// All joined wind_turbine-role cells (provisioned + clones). Used by the
  /// create-issue target-cell dropdown and the per-cell issue enumeration.
  private windTurbineCells(): JoinedCell[] {
    return this.joinedCells.filter((c) => c.role === ROLE_WIND_TURBINE);
  }

  // ---------------------------------------------------------------------------
  // Discovery
  // ---------------------------------------------------------------------------

  /**
   * Enumerate every issue currently visible in any joined cell. Used as a
   * decoder cache: anchor-driven discovery returns issue hashes and we look
   * the full entries up in this map.
   *
   * Iterates every wind_turbine-role cell (provisioned + clones) so issues
   * authored in community cells are reachable (spec 050).
   */
  private async fetchAllPerCell(): Promise<UIIssue[]> {
    const out: UIIssue[] = [];

    for (const cell of this.windTurbineCells()) {
      try {
        const windIssues: Array<[ActionHash, IssueEntry]> = await this.client.callZome({
          cell_id: cell.cellId,
          zome_name: "wind_turbine",
          fn_name: "get_all_issues",
          payload: null,
        });
        for (const [hash, entry] of windIssues) {
          out.push({
            id: encodeHashToBase64(hash),
            actionHash: hash,
            cell: "manhattan",
            title: entry.title,
            description: entry.description,
            location: cell.name,
            status: entry.status,
            hasGeotaggedEvidence: true,
            creator: "",
            comments: [],
            cellDnaB64: cell.dnaB64,
            cellName: cell.name,
          });
        }
      } catch (e) {
        console.warn(`get_all_issues failed for cell ${cell.name}:`, e);
      }
    }

    try {
      const housingCell = this.extractCellId(ROLE_HOUSING);
      const housingDnaB64 = encodeHashToBase64(housingCell[0]);
      const housingIssues: Array<[ActionHash, HousingIssue]> = await this.client.callZome({
        cell_id: housingCell,
        zome_name: "housing",
        fn_name: "get_all_housing_issues",
        payload: null,
      });
      for (const [hash, entry] of housingIssues) {
        let challengeCount = 0;
        try {
          const challenges: Array<[ActionHash, BindingChallenge]> = await this.client.callZome({
            cell_id: housingCell,
            zome_name: "housing",
            fn_name: "get_challenges_for_issue",
            payload: hash,
          });
          challengeCount = challenges.length;
        } catch (e) {
          console.warn("get_challenges_for_issue failed:", e);
        }
        out.push({
          id: encodeHashToBase64(hash),
          actionHash: hash,
          cell: "housing",
          title: entry.title,
          description: entry.title, // housing entries have no description field
          location: entry.location,
          status: challengeCount > 0 ? "Challenged" : entry.status,
          hasGeotaggedEvidence: entry.has_geotagged_evidence,
          creator: "",
          comments: [],
          challengeCount,
          cellDnaB64: housingDnaB64,
          cellName: "Housing",
        });
      }
    } catch (e) {
      console.warn("get_all_housing_issues failed:", e);
    }

    return out;
  }

  /**
   * Subscription-driven discovery: ask the registry which anchors this
   * agent follows, then for each anchor fetch the `AnchorLink`s. Returns
   * the discovered links so callers can route by `cell_dna_hash` (spec 050).
   */
  private async discoverViaSubscriptions(): Promise<AnchorLinkEntry[]> {
    const result: AnchorLinkEntry[] = [];
    if (this.isMock || !this.client) return result;

    let subs: string[] = [];
    try {
      subs = await this.fetchSubscriptions();
    } catch (e) {
      console.warn("fetchSubscriptions failed during discovery:", e);
      return result;
    }

    const registryCell = this.extractCellId(ROLE_REGISTRY);
    for (const anchor of subs) {
      try {
        const links: AnchorLinkEntry[] = await this.client.callZome({
          cell_id: registryCell,
          zome_name: "registry",
          fn_name: "get_anchor_links_for_anchor",
          payload: anchor,
        });
        for (const link of links) {
          result.push(link);
        }
      } catch (e) {
        console.warn(`get_anchor_links_for_anchor(${anchor}) failed:`, e);
      }
    }
    return result;
  }

  /**
   * Rebuild `liveIssues` from the DHT. Two paths:
   *
   * - If `#general` is in `activeLenses`, fall back to per-cell enumeration
   *   so the demo shows everything out of the box.
   * - Otherwise, drive discovery purely from registry subscriptions — the
   *   architecturally-honest path for [042]. Issues whose origin cell this
   *   agent has joined are dereferenced and rendered fully; issues from
   *   un-joined cells are surfaced as a "Join to view" placeholder so the
   *   user can discover the cell via the Communities panel.
   */
  private async refreshFromDht() {
    if (this.isMock || !this.client) return;

    // Refresh appInfo every tick so newly-joined clones become visible
    // without needing a manual reload. Cheap call on the local conductor.
    await this.refreshAppInfoAndJoinedCells();
    await this.fetchRegisteredCells();

    const allByCell = await this.fetchAllPerCell();
    const byId = new Map(allByCell.map((i) => [i.id, i]));

    let discovered: UIIssue[];
    if (this.activeLenses.includes("#general")) {
      discovered = allByCell;
    } else {
      const links = await this.discoverViaSubscriptions();
      const seen = new Set<string>();
      discovered = [];
      for (const link of links) {
        const id = encodeHashToBase64(link.issue_id);
        if (seen.has(id)) continue;
        seen.add(id);

        const full = byId.get(id);
        if (full) {
          discovered.push(full);
          continue;
        }
        // We don't have the issue locally — most likely the origin cell
        // hasn't been joined. Surface it as a placeholder so the user can
        // see what they'd unlock by joining.
        const dnaB64 = encodeHashToBase64(link.cell_dna_hash);
        const joined = this.joinedCellByDnaB64(dnaB64);
        const registered = this.registeredCells.find((c) => c.dnaB64 === dnaB64);
        const cellName = joined?.name ?? registered?.name ?? "Unknown cell";
        discovered.push({
          id,
          actionHash: link.issue_id,
          cell: link.cell_role === ROLE_HOUSING ? "housing" : "manhattan",
          title: `(issue from "${cellName}" — join to view)`,
          description: `Subscribed via #${link.anchor_name}. The origin cell isn't joined yet, so issue details aren't available locally.`,
          location: cellName,
          status: "Deliberating",
          hasGeotaggedEvidence: false,
          creator: "",
          comments: [],
          cellDnaB64: dnaB64,
          cellName,
        });
      }
    }

    this.liveIssues = discovered;
    this.updateActiveIssues();
  }

  // Refresh feed based on the current source of truth + search query.
  //
  // In LIVE mode, `liveIssues` already reflects subscription-driven discovery
  // (see `refreshFromDht`), so lens filtering happens upstream via the
  // registry. We only apply the search-query filter here.
  //
  // In MOCK mode, no registry exists, so we still keyword-match the lens set
  // against the seeded mockDb.
  private updateActiveIssues() {
    const sourceIssues: UIIssue[] = this.isMock
      ? (this.mockDb.issues as UIIssue[])
      : this.liveIssues;

    this.activeIssues = sourceIssues.filter(issue => {
      // 1. Search Query Filter (always applies)
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        if (!issue.title.toLowerCase().includes(query) && !issue.description.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Lens filter — mock mode only. Live mode has already filtered by
      //    subscription at the DHT layer.
      if (this.isMock) {
        if (this.activeLenses.includes("#general")) return true;
        if (issue.title.toLowerCase().includes("wind") && this.activeLenses.includes("#wind-power")) return true;
        if (issue.title.toLowerCase().includes("housing") && this.activeLenses.includes("#housing")) return true;
        if (issue.location === "Berlin" && this.activeLenses.includes("Berlin")) return true;
        return false;
      }

      return true;
    });
  }

  // Search input change & AI Duplicate Finder simulation
  private handleSearchInput(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    
    // Simulate AI Semantic Duplicate detection
    if (this.searchQuery.toLowerCase().includes("wind") || this.searchQuery.toLowerCase().includes("turb")) {
      this.searchMatches = [
        { title: "Manhattan Wind Turbine grid leakage", matchScore: 94, cell: "Manhattan Cell" }
      ];
    } else if (this.searchQuery.toLowerCase().includes("hous") || this.searchQuery.toLowerCase().includes("flat")) {
      this.searchMatches = [
        { title: "Berlin affordable unit conversion proposal", matchScore: 89, cell: "Housing Cell" }
      ];
    } else {
      this.searchMatches = [];
    }
    
    this.updateActiveIssues();
  }

  // Toggle Lens subscription. In live mode, writes/deletes a
  // `SubscriptionEntry` on the agent's `global_registry` source chain so the
  // discovery feed reshapes accordingly. `#general` is a client-side
  // "show-everything" flag and is intentionally NOT persisted on chain.
  private async toggleLens(lens: string) {
    const subscribing = !this.activeLenses.includes(lens);

    if (subscribing) {
      this.activeLenses = [...this.activeLenses, lens];
      this.logActivity(this.activeAgentName, "followed lens", `Subscribed to ${lens}`);
    } else {
      this.activeLenses = this.activeLenses.filter(l => l !== lens);
      this.logActivity(this.activeAgentName, "muted lens", `Unsubscribed from ${lens}`);
    }

    if (!this.isMock && lens !== "#general") {
      try {
        if (subscribing) {
          await this.subscribeToAnchor(lens);
        } else {
          await this.unsubscribeFromAnchor(lens);
        }
      } catch (e) {
        console.warn(`toggleLens: registry update for ${lens} failed:`, e);
      }
    }

    if (!this.isMock) {
      await this.refreshFromDht();
    } else {
      this.updateActiveIssues();
    }
  }

  // Switch persona manually (In Standalone Mock Preview only)
  private handleAgentSwitch(agent: string) {
    if (!this.isMock) return; // Only allow switching in mockup fallback mode
    this.applyPersona(agent);
    this.logActivity(this.activeAgentName, "perspective swapped", `Switched active dashboard view to ${agent}.`);
    this.updateActiveIssues();
  }

  // Create issue Zome Call
  private async createIssueSubmit() {
    if (!this.newIssueTitle.trim()) return;

    const issuePayload = {
      title: this.newIssueTitle,
      description: this.newIssueDesc,
      status: "Deliberating" as IssueStatus,
      location: this.newIssueLocation,
      has_geotagged_evidence: this.newIssueHasEvidence
    };

    try {
      this.loading = true;

      // Berlin jurisdictional rules verification (Phase 2)
      if (this.newIssueLocation === "Berlin" && !this.newIssueHasEvidence) {
        throw new Error("Geotagged evidence required for this jurisdiction (Berlin Housing Overlay Rule jc:berlin-housing-rules-v1).");
      }

      // Discovery tags. Anything the user typed wins; otherwise we seed
      // sensible per-cell defaults so the issue is actually discoverable.
      const userTags = this.newIssueTags
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const tags = userTags.length > 0
        ? userTags
        : this.newIssueLocation === "Berlin"
          ? ["#housing", this.newIssueLocation]
          : ["#wind-power", "#new-york"];

      let actionHash: ActionHash | undefined;
      if (!this.isMock) {
        // Execute Zome Call to local cells. Both cells take a wrapper input
        // { issue, tags } so the registry can publish anchor links.
        if (this.newIssueLocation === "Berlin") {
          const housingCell = this.extractCellId(ROLE_HOUSING);
          actionHash = await this.client.callZome({
            cell_id: housingCell,
            zome_name: "housing",
            fn_name: "create_housing_issue",
            payload: {
              issue: {
                title: this.newIssueTitle,
                location: this.newIssueLocation,
                status: "Deliberating",
                has_geotagged_evidence: this.newIssueHasEvidence
              },
              tags
            }
          });
        } else {
          // Resolve the user-selected target wind_turbine cell. Falls back
          // to the provisioned one if the dropdown has somehow drifted.
          let target = this.joinedCellByDnaB64(this.newIssueTargetDnaB64);
          if (!target || target.role !== ROLE_WIND_TURBINE) {
            target = this.windTurbineCells().find((c) => c.isProvisioned)
              ?? this.windTurbineCells()[0];
          }
          if (!target) {
            throw new Error("No joined wind_turbine cell available.");
          }
          actionHash = await this.client.callZome({
            cell_id: target.cellId,
            zome_name: "wind_turbine",
            fn_name: "create_issue",
            payload: {
              issue: {
                title: this.newIssueTitle,
                description: this.newIssueDesc,
                status: "Deliberating"
              },
              tags
            }
          });
        }
      }

      // In mock mode, seed the local feed manually since there is no DHT to
      // re-read from. In live mode, refreshFromDht() below pulls the real
      // entry back through `get_all_issues` / `get_all_housing_issues`.
      if (this.isMock) {
        const newId = "uhCkkY" + Math.random().toString(36).substring(2, 10);
        this.mockDb.issues = [
          {
            id: newId,
            cell: this.newIssueLocation === "Berlin" ? "housing" : "manhattan",
            title: this.newIssueTitle,
            description: this.newIssueDesc,
            location: this.newIssueLocation,
            status: "Deliberating",
            hasGeotaggedEvidence: this.newIssueHasEvidence,
            creator: this.agentB64,
            comments: []
          },
          ...this.mockDb.issues
        ];
      }

      this.logActivity(this.activeAgentName, "created issue", `"${this.newIssueTitle}" in cell.`);
      this.addNotification("issue", `New issue created: "${this.newIssueTitle}"`);

      // Reset Form fields
      this.newIssueTitle = "";
      this.newIssueDesc = "";
      this.newIssueLocation = "Manhattan";
      this.newIssueHasEvidence = false;
      this.newIssueTags = "#wind-power";
      this.showCreateIssueModal = false;
      // Pull the freshly-written issue (and any others gossiped in the meantime)
      // back from the DHT so this agent sees authoritative state immediately.
      if (!this.isMock) {
        await this.refreshFromDht();
      } else {
        this.updateActiveIssues();
      }
      
    } catch (e: any) {
      alert(e.message);
    } finally {
      this.loading = false;
    }
  }

  // Extract cell ID helper. Reads from the cached AppInfo populated in firstUpdated().
  private extractCellId(roleName: string): CellId {
    if (!this.cachedAppInfo) {
      throw new Error("AppInfo not loaded yet — cannot resolve cell for role " + roleName);
    }
    const cellsForRole = this.cachedAppInfo.cell_info[roleName];
    if (!cellsForRole || cellsForRole.length === 0) {
      throw new Error(`No cell found for role "${roleName}". Available roles: ${Object.keys(this.cachedAppInfo.cell_info).join(", ")}`);
    }
    const cellInfo = cellsForRole[0];
    // @holochain/client encodes CellInfo as a tagged union: { type: "provisioned" | "cloned" | "stem", value: ... }
    if (cellInfo.type === CellType.Provisioned) return cellInfo.value.cell_id;
    if (cellInfo.type === CellType.Cloned) return cellInfo.value.cell_id;
    throw new Error(`Cell for role "${roleName}" is a stem cell (no cell_id yet).`);
  }

  // CAP grant request for Guest write (Phase 1)
  private handleRequestGuestAccess(issueId: string) {
    this.loading = true;
    
    setTimeout(() => {
      const mockCapSecret = "cap_secret_" + Math.random().toString(36).substring(2, 9);
      this.activeCapSecrets = {
        ...this.activeCapSecrets,
        [issueId]: mockCapSecret
      };
      
      this.loading = false;
      this.logActivity(this.activeAgentName, "capability received", `Acquired Guest Write token for wind turbine cell.`);
      this.addNotification("access", `Guest write access token received for issue grid.`);
    }, 800);
  }

  // Add Comment Zome Call
  private async submitComment(issueId: string, text: string) {
    if (!text.trim()) return;

    // Look the issue up against whichever feed is the source of truth.
    const source: UIIssue[] = this.isMock
      ? (this.mockDb.issues as UIIssue[])
      : this.liveIssues;
    const issue = source.find((i) => i.id === issueId);
    if (!issue) return;

    try {
      this.loading = true;

      if (!this.isMock) {
        // Only the wind_turbine zome currently exposes post_comment; the housing zome
        // does not have a comment extern. Surface that clearly instead of guessing.
        if (issue.cell !== "manhattan") {
          throw new Error(`Commenting is not supported for the ${issue.cell} cell yet.`);
        }
        if (!issue.actionHash) {
          throw new Error("This issue has no on-chain action hash yet.");
        }
        if (!this.agentPubKey) {
          throw new Error("Agent public key not available.");
        }
        const targetCellId = this.cellIdForIssue(issue);
        if (!targetCellId) {
          throw new Error(
            `Cannot post — origin cell for this issue is not joined locally. Join it from the Communities panel.`
          );
        }
        await this.client.callZome({
          cell_id: targetCellId,
          zome_name: "wind_turbine",
          fn_name: "post_comment",
          payload: {
            issue_id: issue.actionHash,
            author: this.agentPubKey,
            content: text
          }
        });

        // Pull the freshly-linked comment back through get_comments_for_issue
        // so this agent sees authoritative DHT state immediately.
        await this.refreshCommentsForIssue(issue);
      } else {
        // Mock mode: maintain the local array as before.
        const idx = this.mockDb.issues.findIndex((i) => i.id === issueId);
        if (idx !== -1) {
          this.mockDb.issues[idx].comments = [
            ...this.mockDb.issues[idx].comments,
            {
              issue_id: (issue.actionHash ?? null) as any,
              author: (this.agentPubKey ?? null) as any,
              content: text,
            },
          ];
        }
        this.updateActiveIssues();
      }

      this.logActivity(this.activeAgentName, "comment posted", `Added contribution on issue.`);

    } catch (e: any) {
      alert("Zome call failed: " + e.message);
    } finally {
      this.loading = false;
    }
  }

  /// Resolve the local `CellId` for an issue, routing wind_turbine issues
  /// to their origin clone (spec 050). Returns undefined when the origin
  /// cell isn't joined yet.
  private cellIdForIssue(issue: UIIssue): CellId | undefined {
    if (issue.cell === "housing") {
      try {
        return this.extractCellId(ROLE_HOUSING);
      } catch {
        return undefined;
      }
    }
    if (issue.cellDnaB64) {
      return this.joinedCellByDnaB64(issue.cellDnaB64)?.cellId;
    }
    // Legacy: no origin tag (e.g. mock issues). Fall back to the
    // provisioned wind_turbine cell.
    try {
      return this.extractCellId(ROLE_WIND_TURBINE);
    } catch {
      return undefined;
    }
  }

  /**
   * Fetch and cache the on-chain comments for a wind-turbine issue.
   * Keyed by `UIIssue.id` so the expanded-card render can read them.
   */
  private async refreshCommentsForIssue(issue: UIIssue) {
    if (this.isMock || !issue.actionHash || issue.cell !== "manhattan") return;
    const targetCellId = this.cellIdForIssue(issue);
    if (!targetCellId) return;
    try {
      const comments: Array<[ActionHash, CommentEntry]> = await this.client.callZome({
        cell_id: targetCellId,
        zome_name: "wind_turbine",
        fn_name: "get_comments_for_issue",
        payload: issue.actionHash,
      });
      this.commentsMap = {
        ...this.commentsMap,
        [issue.id]: comments.map(([, c]) => c),
      };
    } catch (e) {
      console.warn("get_comments_for_issue failed:", e);
    }
  }

  // Expand an issue card and, in live mode, lazy-load its DHT comments.
  private async handleExpandIssue(issue: UIIssue) {
    this.expandedIssueId = issue.id;
    if (!this.isMock) {
      await this.refreshCommentsForIssue(issue);
    }
  }

  // Submit Binding Challenge Dispute (Phase 2 Overlay observer)
  private async handleTriggerDispute(issueId: string) {
    this.loading = true;

    try {
      if (!this.isMock) {
        const source = this.liveIssues;
        const issue = source.find((i) => i.id === issueId);
        if (!issue) {
          throw new Error("Issue not found in live feed.");
        }
        if (issue.cell !== "housing" || !issue.actionHash) {
          throw new Error("Binding challenges are only supported for housing-cell issues.");
        }
        const housingCell = this.extractCellId("housing");
        await this.client.callZome({
          cell_id: housingCell,
          zome_name: "housing",
          fn_name: "challenge_issue_binding",
          payload: {
            issue_hash: issue.actionHash,
            reason: "Observer dispute: jurisdictional scope mismatch.",
          },
        });
        await this.refreshFromDht();
      } else {
        const idx = this.mockDb.issues.findIndex((i) => i.id === issueId);
        if (idx !== -1) {
          this.mockDb.issues[idx].status = "Challenged";
        }
        this.updateActiveIssues();
      }

      this.logActivity(
        "Berlin Observer",
        "disputed binding",
        `Submitted BindingChallenge. Geographic scope mismatched canonical tier.`
      );
      this.addNotification(
        "challenge",
        `ALERT: Issue has been Challenged!`
      );
    } catch (e: any) {
      alert("Challenge failed: " + e.message);
    } finally {
      this.loading = false;
    }
  }

  // Render demurrage SVG curve dynamically
  private renderDemurrageCurve() {
    const totalDays = 30;
    const rate = 0.05; // 5% demurrage decay
    const points: string[] = [];
    
    // Generate exponential decay curve points
    for (let day = 0; day <= totalDays; day += 2) {
      const x = (day / totalDays) * 260 + 10;
      const y = 80 - (Math.exp(-rate * (day / totalDays)) * 60);
      points.push(`${x},${y}`);
    }

    // Active balance coordinate along the curve
    const currentPercent = (this.walletBalance / this.walletInitialBalance);
    const activeX = (1 - currentPercent) * 200 + 30; // Inverse mapped for visual decay countdown
    const activeY = 80 - (currentPercent * 60);

    return html`
      <svg width="100%" height="90" viewBox="0 0 280 90" style="background: transparent;">
        <!-- Area under curve gradient -->
        <defs>
          <linearGradient id="decayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--color-deliberating)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--color-deliberating)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        
        <!-- Gridlines -->
        <line x1="10" y1="20" x2="270" y2="20" stroke="var(--border-color)" stroke-dasharray="3,3" />
        <line x1="10" y1="50" x2="270" y2="50" stroke="var(--border-color)" stroke-dasharray="3,3" />
        <line x1="10" y1="80" x2="270" y2="80" stroke="var(--border-color)" />

        <!-- Area fill -->
        <path d="M 10 80 L ${points.join(" L ")} L 270 80 Z" fill="url(#decayGrad)" />
        
        <!-- Plot Line -->
        <path d="M 10 ${points[0].split(",")[1]} L ${points.join(" L ")}" fill="none" stroke="var(--color-deliberating)" stroke-width="2.5" />
        
        <!-- Glowing Pulse Active Coordinate Point -->
        <circle cx="${activeX}" cy="${activeY}" r="6" fill="var(--color-deliberating)" filter="drop-shadow(0 0 4px var(--color-deliberating))">
          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
        </circle>
        
        <!-- SVG Labels -->
        <text x="10" y="88" fill="var(--text-muted)" font-size="8">Day 0</text>
        <text x="240" y="88" fill="var(--text-muted)" font-size="8">Day 30</text>
      </svg>
    `;
  }

  render() {
    return html`
      <div class="app-container">
        
        <!-- Glassmorphic Header -->
        <header class="header">
          <div class="brand-section">
            <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="brand-name">Kindact Substrate</div>
          </div>
          
          <!-- Agent Persona Switcher (For standalone sandbox preview) -->
          <div class="agent-selector-bar">
            <button class="agent-btn ${this.activeAgentName === "Elena" ? "active" : ""}" @click=${() => this.handleAgentSwitch("Elena")}>Elena</button>
            <button class="agent-btn ${this.activeAgentName === "Marcus" ? "active" : ""}" @click=${() => this.handleAgentSwitch("Marcus")}>Marcus</button>
            <button class="agent-btn ${this.activeAgentName === "Amina" ? "active" : ""}" @click=${() => this.handleAgentSwitch("Amina")}>Amina</button>
          </div>

          <div class="network-status">
            <span class="status-dot ${this.isMock ? "mocked" : "connected"}"></span>
            <span>${this.isMock ? "Demo Preview Mode" : "Real Node Online"}</span>
          </div>
        </header>

        <div class="dashboard-grid">
          
          <!-- LEFT SIDEBAR: CC Wallet and Lens Manager -->
          <aside class="grid-col">
            
            <!-- Demurrage decay CC Wallet Widget -->
            <div class="glass-panel cc-wallet-widget">
              <div class="panel-title">
                <span>$CC Wallet</span>
                <span class="lens-badge active">5% Demurrage</span>
              </div>
              <div class="balance-amount">${this.walletBalance.toFixed(4)}</div>
              <div class="balance-ticker">$CC Balance Ticker</div>
              
              <div class="demurrage-chart-container">
                ${this.renderDemurrageCurve()}
              </div>
              
              <div class="demurrage-info">
                <span>Value decay over time</span>
                <span>Countdown: <strong>Day 1</strong></span>
              </div>
            </div>

            <!-- Lens Subscriptions Manager -->
            <div class="glass-panel">
              <div class="panel-title">Active Lenses</div>
              <div class="lens-list">
                <div class="lens-item ${this.activeLenses.includes("#general") ? "active" : ""}" @click=${() => this.toggleLens("#general")}>
                  <div class="lens-meta">
                    <span class="lens-badge ${this.activeLenses.includes("#general") ? "active" : ""}">#</span>
                    <span>general</span>
                  </div>
                  <button class="lens-btn">👁️</button>
                </div>
                
                <div class="lens-item ${this.activeLenses.includes("#wind-power") ? "active" : ""}" @click=${() => this.toggleLens("#wind-power")}>
                  <div class="lens-meta">
                    <span class="lens-badge ${this.activeLenses.includes("#wind-power") ? "active" : ""}">#</span>
                    <span>wind-power</span>
                  </div>
                  <button class="lens-btn">👁️</button>
                </div>

                <div class="lens-item ${this.activeLenses.includes("#housing") ? "active" : ""}" @click=${() => this.toggleLens("#housing")}>
                  <div class="lens-meta">
                    <span class="lens-badge ${this.activeLenses.includes("#housing") ? "active" : ""}">#</span>
                    <span>housing</span>
                  </div>
                  <button class="lens-btn">👁️</button>
                </div>

                <div class="suggestions-title">Location Hint suggests</div>
                <div class="suggested-lens">
                  <span>📍 Berlin, DE</span>
                  <span class="subscribe-link" @click=${() => this.toggleLens("Berlin")}>
                    ${this.activeLenses.includes("Berlin") ? "Unsubscribe" : "Subscribe"}
                  </span>
                </div>
              </div>
            </div>

            <!-- Communities (spec 050): dynamic cell create / join / discover -->
            <div class="glass-panel">
              <div class="panel-title">
                <span>Communities</span>
                <button class="lens-btn" title="Create a new community cell"
                  @click=${() => { this.showCreateCellModal = true; this.newCellName = ""; }}>
                  ＋
                </button>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0 0 10px; line-height: 1.4;">
                Every community is a real Holochain cell with its own DHT.
                Joining clones the DNA into your conductor.
              </p>
              ${this.isMock ? html`
                <div style="font-size: 0.78rem; color: var(--text-muted);">
                  Demo preview only — communities are a live-conductor feature.
                </div>
              ` : this.registeredCells.length === 0 ? html`
                <div style="font-size: 0.78rem; color: var(--text-muted);">
                  No communities registered yet. Be the first — click ＋ to create one.
                </div>
              ` : html`
                <div class="lens-list">
                  ${this.registeredCells.map((cell) => {
                    const joined = !!this.joinedCellByDnaB64(cell.dnaB64);
                    const joining = this.joiningCellDnaB64 === cell.dnaB64;
                    return html`
                      <div class="lens-item ${joined ? "active" : ""}">
                        <div class="lens-meta" style="flex-direction: column; align-items: flex-start; gap: 2px;">
                          <span>${cell.name}</span>
                          <span style="font-size: 0.68rem; color: var(--text-muted);">
                            ${joined ? "Joined" : "Not joined"} · ${cell.networkSeed.substring(0, 22)}…
                          </span>
                        </div>
                        ${joined ? html`
                          <span class="lens-badge active">✓</span>
                        ` : html`
                          <button class="secondary-btn" style="padding: 4px 10px; font-size: 0.75rem;"
                            ?disabled=${joining}
                            @click=${() => this.joinCommunityCell(cell)}>
                            ${joining ? "Joining…" : "Join"}
                          </button>
                        `}
                      </div>
                    `;
                  })}
                </div>
              `}
            </div>

            <!-- Simulation Observer triggers (Sandbox deck Phase 2 validation) -->
            <div class="glass-panel sandbox-deck-widget">
              <span class="sandbox-badge">Observer Deck</span>
              <div class="panel-title" style="margin-top: 10px;">Verification Sandbox</div>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.45;">
                Trigger simulated validation conflicts to test Phase 2 jurisdictional dispute observers.
              </p>
              <div class="sandbox-btn-grid">
                <button class="sandbox-btn" @click=${() => {
                  this.newIssueTitle = "Berlin Kreuzberg communal garden housing";
                  this.newIssueDesc = "Constructing a timber housing co-op. Bypassing evidence.";
                  this.newIssueLocation = "Berlin";
                  this.newIssueHasEvidence = false;
                  this.showCreateIssueModal = true;
                }}>
                  <span>Reject Non-Evidence Berlin Issue</span>
                  <span class="sandbox-btn-arrow">➔</span>
                </button>
                
                <button class="sandbox-btn" @click=${() => {
                  const source: UIIssue[] = this.isMock
                    ? (this.mockDb.issues as UIIssue[])
                    : this.liveIssues;
                  const housingIssue = source.find(i => i.location === "Berlin");
                  if (housingIssue) {
                    this.handleTriggerDispute(housingIssue.id);
                  } else {
                    alert("Create a Berlin issue first!");
                  }
                }}>
                  <span>Trigger Observer Binding Challenge</span>
                  <span class="sandbox-btn-arrow">➔</span>
                </button>
              </div>
            </div>

          </aside>

          <!-- CENTER COLUMN: Discovery feed, Search & Expanded detail -->
          <main class="grid-col">
            
            <!-- Global Search and Semantic Duplicate AI Scanner -->
            <div class="glass-panel" style="padding: 1rem 1.5rem;">
              <div class="search-container">
                <input class="search-input" placeholder="Search issues, topics, tags..." .value=${this.searchQuery} @input=${this.handleSearchInput} />
                <svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>

              <!-- AI Duplicate Warning Box -->
              ${this.searchMatches.length > 0 ? html`
                <div class="ai-duplicate-box">
                  <div class="ai-duplicate-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>AI Duplicate Match Detected (${this.searchMatches[0].matchScore}% Match)</span>
                  </div>
                  <div class="ai-duplicate-text">
                    An issue resembling your query is already open in the <strong>${this.searchMatches[0].cell}</strong>: 
                    <span class="ai-duplicate-link" @click=${() => {
                      const source: UIIssue[] = this.isMock
                        ? (this.mockDb.issues as UIIssue[])
                        : this.liveIssues;
                      const matched = source.find(i => i.title === this.searchMatches[0].title);
                      if (matched) this.handleExpandIssue(matched);
                    }}>"${this.searchMatches[0].title}"</span>. Please collaborate instead of creating duplicates.
                  </div>
                </div>
              ` : ""}
            </div>

            <!-- Feed header with Quick Action -->
            <div class="feed-header">
              <h2 class="feed-title">Personalized Discovery Feed</h2>
              <button class="primary-btn" @click=${() => this.showCreateIssueModal = true}>
                <span>+</span> New Issue
              </button>
            </div>

            <!-- Issue Discovery Feed -->
            <div class="feed-list">
              ${this.activeIssues.length === 0 ? html`
                <div class="glass-panel" style="text-align: center; color: var(--text-muted); padding: 3rem 1.5rem;">
                  No active issues resolved under subscribed lenses. Try adjusting your active lenses.
                </div>
              ` : this.activeIssues.map(issue => {
                const isExpanded = this.expandedIssueId === issue.id;
                const phaseBadgeClass = `badge-${issue.status.toLowerCase()}`;
                
                return html`
                  <article class="issue-card ${isExpanded ? "expanded" : ""}" @click=${() => !isExpanded && this.handleExpandIssue(issue)}>
                    <div class="issue-card-header">
                      <h3 class="issue-title">${issue.title}</h3>
                      <span class="phase-badge ${phaseBadgeClass}">${issue.status}</span>
                    </div>
                    
                    <p class="issue-description">${issue.description}</p>
                    
                    <div class="issue-meta-row">
                      <div class="issue-tags">
                        <span class="tag-pill">📍 ${issue.location}</span>
                        ${issue.cellName ? html`
                          <span class="tag-pill">🛰️ ${issue.cellName}</span>
                        ` : ""}
                        <span class="tag-pill">🏷️ ${issue.location === "Berlin" ? "#housing" : "#wind-power"}</span>
                      </div>
                      <span>Creator: ${issue.creator.substring(0, 10)}...</span>
                    </div>

                    <!-- Progressive Disclosure Expanded Detail Panel -->
                    ${isExpanded ? html`
                      <hr class="expanded-divider" />
                      <div class="panel-title">Deliberation & Comments</div>
                      
                      <!-- Capability token guest handshake (Phase 1) -->
                      ${this.activeAgentName === "Amina" && !this.activeCapSecrets[issue.id] ? html`
                        <div class="cap-grant-box">
                          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">
                            You are viewing a foreign cell issue (Manhattan DNA). Request a capability writer token to comment as a guest.
                          </p>
                          <button class="secondary-btn" @click=${() => this.handleRequestGuestAccess(issue.id)}>
                            🔑 Request Guest Write Access
                          </button>
                        </div>
                      ` : ""}

                      <div class="comments-section">
                        ${(this.isMock ? issue.comments : (this.commentsMap[issue.id] ?? [])).map((comment: any) => html`
                          <div class="comment-card">
                            <div class="comment-author-row">
                              <span class="comment-author-name">Contributor</span>
                              <span>Verified Humanity</span>
                            </div>
                            <p class="comment-text">${comment.content}</p>
                          </div>
                        `)}
                        
                        <!-- Comment Box (Enabled if local resident or guest cap token is active) -->
                        ${this.activeAgentName !== "Amina" || this.activeCapSecrets[issue.id] ? html`
                          <div class="comment-input-row">
                            <input class="comment-input" placeholder="Post a constructive deliberation comment..." @keyup=${(e: KeyboardEvent) => {
                              if (e.key === "Enter") {
                                const input = e.target as HTMLInputElement;
                                this.submitComment(issue.id, input.value);
                                input.value = "";
                              }
                            }} />
                          </div>
                        ` : ""}
                      </div>

                      <div class="modal-footer" style="margin-top: 1.5rem;">
                        <button class="secondary-btn" @click=${(e: Event) => {
                          e.stopPropagation();
                          this.expandedIssueId = null;
                        }}>Close Details</button>
                      </div>
                    ` : ""}
                  </article>
                `;
              })}
            </div>

          </main>

          <!-- RIGHT SIDEBAR: Notification Center and Activity Stream -->
          <aside class="grid-col">
            
            <!-- Notification Center -->
            <div class="glass-panel">
              <div class="panel-title">
                <span>Notifications</span>
                <div class="notification-bell">
                  <span>🔔</span>
                  <span class="notification-badge">${this.notifications.filter(n => n.unread).length}</span>
                </div>
              </div>
              
              <div class="notification-list">
                ${this.notifications.map(notif => html`
                  <div class="notification-card ${notif.unread ? "unread" : ""}">
                    <div>${notif.message}</div>
                    <div class="notification-time">${notif.time}</div>
                  </div>
                `)}
              </div>
            </div>

            <!-- Community Activity Stream -->
            <div class="glass-panel">
              <div class="panel-title">Activity Stream</div>
              <div class="activity-list">
                ${this.activities.map(act => html`
                  <div class="activity-item">
                    <div class="activity-dot-col">
                      <div class="activity-dot"></div>
                      <div class="activity-line"></div>
                    </div>
                    <div class="activity-content">
                      <strong>${act.agent}</strong> ${act.action} ${act.details}
                      <div class="notification-time">${act.time}</div>
                    </div>
                  </div>
                `)}
              </div>
            </div>

          </aside>

        </div>
      </div>

      <!-- Persona Picker Modal (live mode, before any DHT reads) -->
      ${this.personaPickerVisible ? html`
        <div class="form-backdrop">
          <div class="creator-modal">
            <div class="modal-header">
              <h2>Choose this window's persona</h2>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
              Each Holochain agent window needs a Kindact persona. <code>hc-spin</code> doesn't tell us which agent index this window is, so pick a different persona in each window to keep the demo coherent.
              <br/><br/>
              Your on-chain agent key:
              <code style="display: block; font-size: 0.7rem; word-break: break-all; margin-top: 4px; color: var(--text-muted);">${this.agentB64}</code>
            </p>
            <div class="sandbox-btn-grid">
              ${this.personaOptions.map((p) => html`
                <button class="sandbox-btn" @click=${() => this.selectPersona(p.name)}>
                  <span>
                    <strong>${p.name}</strong> — ${p.role}
                    <div style="font-size: 0.72rem; color: var(--text-muted);">
                      ${p.hint} · lenses: ${p.lenses.join(", ")}
                    </div>
                  </span>
                  <span class="sandbox-btn-arrow">➔</span>
                </button>
              `)}
            </div>
          </div>
        </div>
      ` : ""}

      <!-- Create Issue Glassmorphic Form Modal -->
      ${this.showCreateIssueModal ? html`
        <div class="form-backdrop">
          <div class="creator-modal">
            <div class="modal-header">
              <h2>Propose New Substrate Issue</h2>
              <button class="lens-btn" style="font-size: 1.25rem;" @click=${() => this.showCreateIssueModal = false}>✕</button>
            </div>
            
            <div class="form-group">
              <label class="form-label">Issue Title</label>
              <input class="form-input" placeholder="e.g. Kreuzberg district affordable co-op build" .value=${this.newIssueTitle} @input=${(e: Event) => this.newIssueTitle = (e.target as HTMLInputElement).value} />
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" placeholder="Detail the structural deliberation scope..." .value=${this.newIssueDesc} @input=${(e: Event) => this.newIssueDesc = (e.target as HTMLTextAreaElement).value}></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Location Jurisdiction</label>
              <select class="form-input" style="height: auto;" .value=${this.newIssueLocation} @change=${(e: Event) => this.newIssueLocation = (e.target as HTMLSelectElement).value}>
                <option value="Manhattan">Manhattan</option>
                <option value="Brooklyn">Brooklyn</option>
                <option value="Berlin">Berlin (housing cell)</option>
              </select>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                "Berlin" routes to the housing cell with jurisdictional rules.
                Any other choice posts into the selected community cell.
              </div>
            </div>

            ${this.newIssueLocation !== "Berlin" && !this.isMock ? html`
              <div class="form-group">
                <label class="form-label">Target Community Cell</label>
                <select class="form-input" style="height: auto;"
                  .value=${this.newIssueTargetDnaB64}
                  @change=${(e: Event) => this.newIssueTargetDnaB64 = (e.target as HTMLSelectElement).value}>
                  ${this.windTurbineCells().map((c) => html`
                    <option value=${c.dnaB64}>
                      ${c.name}${c.isProvisioned ? " (default)" : ""}
                    </option>
                  `)}
                </select>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                  Pick a community cell you've joined. Create or join more from the Communities panel.
                </div>
              </div>
            ` : ""}

            <div class="form-group">
              <label class="form-label">Discovery Tags (space or comma separated)</label>
              <input class="form-input" placeholder="#wind-power #new-york" .value=${this.newIssueTags} @input=${(e: Event) => this.newIssueTags = (e.target as HTMLInputElement).value} />
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                Each tag becomes an anchor in the Global Registry. Subscribers to any of these tags will discover this issue.
              </div>
            </div>

            <div class="form-group checkbox-row">
              <input type="checkbox" class="checkbox-input" .checked=${this.newIssueHasEvidence} @change=${(e: Event) => this.newIssueHasEvidence = (e.target as HTMLInputElement).checked} />
              <label class="form-label" style="margin-bottom: 0; cursor: pointer;">Provide Geotagged Scope Evidence Proof</label>
            </div>

            <div class="modal-footer">
              <button class="secondary-btn" @click=${() => this.showCreateIssueModal = false}>Cancel</button>
              <button class="primary-btn" @click=${this.createIssueSubmit}>Publish Issue</button>
            </div>
          </div>
        </div>
      ` : ""}

      <!-- Create Community Cell modal (spec 050) -->
      ${this.showCreateCellModal ? html`
        <div class="form-backdrop">
          <div class="creator-modal">
            <div class="modal-header">
              <h2>Create Community Cell</h2>
              <button class="lens-btn" style="font-size: 1.25rem;" @click=${() => this.showCreateCellModal = false}>✕</button>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
              Spawns a fresh Holochain DNA clone, gives it its own DHT,
              and registers it in the global directory so other agents
              can discover and join it.
            </p>
            <div class="form-group">
              <label class="form-label">Community Name</label>
              <input class="form-input"
                placeholder="e.g. Brooklyn Cyclists"
                .value=${this.newCellName}
                @input=${(e: Event) => this.newCellName = (e.target as HTMLInputElement).value} />
            </div>
            <div class="modal-footer">
              <button class="secondary-btn" @click=${() => this.showCreateCellModal = false}>Cancel</button>
              <button class="primary-btn"
                ?disabled=${this.creatingCell || !this.newCellName.trim()}
                @click=${() => this.createCommunityCell()}>
                ${this.creatingCell ? "Creating…" : "Create & Register"}
              </button>
            </div>
          </div>
        </div>
      ` : ""}
    `;
  }

  static styles = css`
    ${sharedStyles}
  `;
}
