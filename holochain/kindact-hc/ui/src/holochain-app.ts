import {
  ActionHash,
  AgentPubKey,
  AppClient,
  AppWebsocket,
  DnaHash,
  encodeHashToBase64,
} from "@holochain/client";
import { provide } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { clientContext } from "./contexts";
import { sharedStyles } from "./shared-styles";

// Types from our subfolders
import { CellEntry, AnchorLinkEntry, JurisdictionalClaimEntry } from "./global_registry/registry/types";
import { HousingIssue, BindingChallenge, IssueStatus } from "./housing/housing/types";
import { IssueEntry, CommentEntry } from "./manhattan_windturbine/wind_turbine/types";

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
    id: string; // Base64 representation of action hash
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
  @state() activeIssues: any[] = [];
  @state() expandedIssueId: string | null = null;
  @state() commentsMap: { [issueId: string]: CommentEntry[] } = {};

  // Form Modals
  @state() showCreateIssueModal = false;
  @state() newIssueTitle = "";
  @state() newIssueDesc = "";
  @state() newIssueLocation = "Manhattan";
  @state() newIssueHasEvidence = false;
  @state() newIssueTags = "#wind-power";

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
          this.agentPubKey = appInfo.agent_pub_key;
          this.agentB64 = encodeHashToBase64(appInfo.agent_pub_key);
          this.isMock = false;
          
          // Determine agent persona based on the injected launcher agent number or pubkey
          const agentNum = env.APP_INTERFACE_PORT % 10 || 1;
          if (agentNum === 1) {
            this.activeAgentName = "Elena";
            this.activeAgentRole = "Manhattan Resident";
            this.activeAgentHint = "New York, USA";
            this.walletBalance = 150.00;
            this.walletInitialBalance = 150.00;
          } else if (agentNum === 2) {
            this.activeAgentName = "Marcus";
            this.activeAgentRole = "NYC Resident";
            this.activeAgentHint = "Brooklyn, USA";
            this.walletBalance = 240.50;
            this.walletInitialBalance = 240.50;
            this.activeLenses = ["#general", "#housing"];
          } else {
            this.activeAgentName = "Amina";
            this.activeAgentRole = "Nairobi Engineer";
            this.activeAgentHint = "Nairobi, Kenya";
            this.walletBalance = 85.00;
            this.walletInitialBalance = 85.00;
            this.activeLenses = ["#general", "#wind-power"];
          }

          this.logActivity(this.activeAgentName, "connected", "Real Holochain Node WebSocket online.");
          await this.loadRealData();
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

  // Load Real Data from Holochain Cells
  private async loadRealData() {
    try {
      // A production hApp would execute Zome calls to gather issues in active cells.
      // Since this is the initial UI integration stage of the prototype, we populate the initial feed
      // from the cells or seed mock database if cell data is empty.
      this.updateActiveIssues();
    } catch (e) {
      this.error = "Error loading Zome data: " + (e as Error).message;
    }
  }

  // Refresh feed based on lenses, search query, and cell states
  private updateActiveIssues() {
    let sourceIssues = this.isMock ? this.mockDb.issues : this.mockDb.issues; // Fallback to mock issues if Zomes are empty

    // Apply Lens filtering (e.g. #wind-power, #housing)
    this.activeIssues = sourceIssues.filter(issue => {
      // 1. Search Query Filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        if (!issue.title.toLowerCase().includes(query) && !issue.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // 2. Lens Filter: Check if topic matches tags
      if (this.activeLenses.includes("#general")) return true;
      if (issue.title.toLowerCase().includes("wind") && this.activeLenses.includes("#wind-power")) return true;
      if (issue.title.toLowerCase().includes("housing") && this.activeLenses.includes("#housing")) return true;
      if (issue.location === "Berlin" && this.activeLenses.includes("Berlin")) return true;

      return false;
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

  // Toggle Lens subscription
  private toggleLens(lens: string) {
    if (this.activeLenses.includes(lens)) {
      this.activeLenses = this.activeLenses.filter(l => l !== lens);
      this.logActivity(this.activeAgentName, "muted lens", `Unsubscribed from ${lens}`);
    } else {
      this.activeLenses = [...this.activeLenses, lens];
      this.logActivity(this.activeAgentName, "followed lens", `Subscribed to ${lens}`);
    }
    this.updateActiveIssues();
  }

  // Switch persona manually (In Standalone Mock Preview only)
  private handleAgentSwitch(agent: string) {
    if (!this.isMock) return; // Only allow switching in mockup fallback mode
    
    this.activeAgentName = agent;
    this.walletStartTime = Date.now();
    
    if (agent === "Elena") {
      this.activeAgentRole = "Manhattan Resident";
      this.activeAgentHint = "New York, USA";
      this.walletInitialBalance = 100.00;
      this.activeLenses = ["#general", "#new-york"];
    } else if (agent === "Marcus") {
      this.activeAgentRole = "NYC Resident";
      this.activeAgentHint = "Brooklyn, USA";
      this.walletInitialBalance = 240.50;
      this.activeLenses = ["#general", "#housing"];
    } else if (agent === "Amina") {
      this.activeAgentRole = "Nairobi Engineer";
      this.activeAgentHint = "Nairobi, Kenya";
      this.walletInitialBalance = 85.00;
      this.activeLenses = ["#general", "#wind-power"];
    }
    
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

      if (!this.isMock) {
        // Execute Zome Call to local cells
        // e.g. create_issue or create_housing_issue
        if (this.newIssueLocation === "Berlin") {
          const housingCell = this.extractCellId("housing");
          await this.client.callZome({
            cell_id: housingCell,
            zome_name: "housing",
            fn_name: "create_housing_issue",
            payload: {
              title: this.newIssueTitle,
              location: this.newIssueLocation,
              status: "Deliberating",
              has_geotagged_evidence: this.newIssueHasEvidence
            }
          });
        } else {
          const turbineCell = this.extractCellId("manhattan_windturbine");
          await this.client.callZome({
            cell_id: turbineCell,
            zome_name: "wind_turbine",
            fn_name: "create_issue",
            payload: {
              title: this.newIssueTitle,
              description: this.newIssueDesc,
              status: "Deliberating"
            }
          });
        }
      }

      // Add to simulated database feed
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

      this.logActivity(this.activeAgentName, "created issue", `"${this.newIssueTitle}" in cell.`);
      this.addNotification("issue", `New issue created: "${this.newIssueTitle}"`);

      // Reset Form fields
      this.newIssueTitle = "";
      this.newIssueDesc = "";
      this.newIssueLocation = "Manhattan";
      this.newIssueHasEvidence = false;
      this.showCreateIssueModal = false;
      this.updateActiveIssues();
      
    } catch (e: any) {
      alert(e.message);
    } finally {
      this.loading = false;
    }
  }

  // Extract cell ID helper
  private extractCellId(roleName: string): any {
    const appInfo = (this as any).client.appInfo;
    const cellInfo = appInfo.cell_info[roleName][0];
    return "provisioned" in cellInfo ? cellInfo.provisioned.cell_id : cellInfo.cloned.cell_id;
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

    try {
      this.loading = true;

      if (!this.isMock) {
        const turbineCell = this.extractCellId("manhattan_windturbine");
        await this.client.callZome({
          cell_id: turbineCell,
          zome_name: "wind_turbine",
          fn_name: "post_comment",
          payload: {
            issue_id: null, // Stub or resolved hash
            author: this.agentPubKey,
            content: text
          }
        });
      }

      // Add to simulated local comments array
      const issueIndex = this.mockDb.issues.findIndex(issue => issue.id === issueId);
      if (issueIndex !== -1) {
        this.mockDb.issues[issueIndex].comments = [
          ...this.mockDb.issues[issueIndex].comments,
          {
            issue_id: null as any,
            author: null as any,
            content: text
          }
        ];
      }

      this.logActivity(this.activeAgentName, "comment posted", `Added contribution on issue.`);
      this.updateActiveIssues();

    } catch (e: any) {
      alert("Zome call failed: " + e.message);
    } finally {
      this.loading = false;
    }
  }

  // Submit Binding Challenge Dispute (Phase 2 Overlay observer)
  private handleTriggerDispute(issueId: string) {
    this.loading = true;
    
    setTimeout(() => {
      const issueIndex = this.mockDb.issues.findIndex(issue => issue.id === issueId);
      if (issueIndex !== -1) {
        this.mockDb.issues[issueIndex].status = "Challenged";
      }

      this.logActivity("Berlin Observer", "disputed binding", `Submitted BindingChallenge. Geographic scope mismatched canonical tier.`);
      this.addNotification("challenge", `ALERT: Berlin affordable unit conversion has been Challenged!`);
      this.updateActiveIssues();
      this.loading = false;
    }, 1000);
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
                  const housingIssue = this.mockDb.issues.find(i => i.location === "Berlin");
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
                      const matched = this.mockDb.issues.find(i => i.title === this.searchMatches[0].title);
                      if (matched) this.expandedIssueId = matched.id;
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
                  <article class="issue-card ${isExpanded ? "expanded" : ""}" @click=${() => !isExpanded && (this.expandedIssueId = issue.id)}>
                    <div class="issue-card-header">
                      <h3 class="issue-title">${issue.title}</h3>
                      <span class="phase-badge ${phaseBadgeClass}">${issue.status}</span>
                    </div>
                    
                    <p class="issue-description">${issue.description}</p>
                    
                    <div class="issue-meta-row">
                      <div class="issue-tags">
                        <span class="tag-pill">📍 ${issue.location}</span>
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
                        ${issue.comments.map((comment: any) => html`
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
                <option value="Berlin">Berlin</option>
              </select>
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
    `;
  }

  static styles = css`
    ${sharedStyles}
  `;
}
