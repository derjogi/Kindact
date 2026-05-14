# Kindact on Holochain — Architectural Exploration

> **Status**: Exploration document. Captures findings from a multi-turn design conversation comparing the current EVM L2 + AT Protocol architecture against a hybrid EVM + Holochain alternative.
> **Date**: 2026-05-12
> **Purpose**: Source material for a *separate* project that will produce a complete set of alternative specs. Not a commitment to build.
> **Scope**: All architectural questions touched on in the exploration — currency, reserve, Hypercerts, lenses, cells, validators, governance, cross-cutting design items, and open questions still requiring decisions.

---

## 0. Reading Guide

This document is structured so that someone (you, an AI, a collaborator) can:

1. Skim §1 to understand the proposed hybrid architecture at a glance.
2. Read §2–§7 to absorb the layer-by-layer findings.
3. Use §8 as a checklist of decisions to make before drafting any alternative specs.
4. Use §9 to map the current spec set onto the alternative architecture (which specs change, which stay, which are new).
5. Treat §10–§11 as concrete starting points for the next phase.

**Comparison anchor**: this document refers throughout to the current spec set under [implementation/specs](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/) and the strategy documents [extensibility-strategy.md](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md) and [THREAD-FINDINGS.md](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/THREAD-FINDINGS.md). Read those first if you have not.

---

## 1. The Proposed Hybrid Architecture

The exploration converged on a three-layer hybrid, not a wholesale Holochain port.

```diagram
╭────────────────────────────────────────────────────────────────╮
│ HOLOCHAIN COORDINATION LAYER                                    │
│   • Deliberation (comments, arguments, summaries)               │
│   • Work claims & peer validation                               │
│   • Lens / cell membership & subscription                       │
│   • Local mutual-credit accounting (per-cell)                   │
│   • Free, peer-validated social actions                         │
│                                                                 │
│   Composition:                                                  │
│   - Base DNA (always-on core rules; included by every cell)     │
│   - Global Registry DNA (cell directory, anchors, promotion)    │
│   - Promoted public cells (Berlin, Housing, Green-Energy, ...)  │
│   - User-created cells (uncurated namespace, may be promoted)   │
╰─────────────────────────────────┬───────────────────────────────╯
                                  │
                                  │ Bridge events:
                                  │   • verified work → mint $CC + Hypercert
                                  │   • redemption requested → debit reserve
                                  │   • dispute confirmed → clawback
                                  │   • oracle data → committed to DHT snapshot
                                  ▼
╭────────────────────────────────────────────────────────────────╮
│ BRIDGE (System Agent multi-sig)                                  │
│   • Multi-sig DAO with EVM signing authority                    │
│   • Capability-token-controlled in Holochain                    │
│   • Idempotent retries + reconciliation worker                  │
│   • Critical security boundary (most-attacked surface in any   │
│     cross-substrate design — design accordingly)                │
╰─────────────────────────────────┬───────────────────────────────╯
                                  │
                                  ▼
╭────────────────────────────────────────────────────────────────╮
│ EVM L2 SETTLEMENT LAYER (Optimism / Base)                        │
│   • $CC ERC-20 token + global decay index                       │
│   • Reserve custody (USDC vault) + confidence curve             │
│   • Daily redemption caps                                       │
│   • Hypercerts as canonical recognized impact credentials       │
│   • Dispute clawbacks via Debt Ledger (global finality)         │
│   • Identity provider integrations (Gitcoin Passport, BrightID, │
│     Proof of Humanity, Anon Aadhaar, World ID)                  │
│   • Oracle networks (Chainlink, Pyth, RedStone, OB-PoR)         │
╰────────────────────────────────────────────────────────────────╯
```

**Why this shape**:

- **Holochain plays to its strengths**: agent-centric data, peer validation, free social actions, local-first UX, multi-cell lens model.
- **EVM plays to its strengths**: global finality, mature ecosystem (Hypercerts, oracles, identity, stablecoin custody), recognized impact credentials.
- **The bridge is the single point where trust and complexity concentrate**, deliberately.
- **Substrate independence on the social side**: the EVM choice can swap (Base → Optimism → Solana → next thing) without rewriting the coordination layer.

This is materially different from the current architecture:

| Layer | Current | Hybrid |
|---|---|---|
| Settlement | EVM L2 | EVM L2 (unchanged) |
| Coordination data layer | AT Protocol PDS + AppView | Holochain DNAs + cells |
| Lens model | Filter overlays in shared substrate | Multi-cell with anchor-based discovery |
| Validation | AppView (centralized indexer) | Distributed peer validators per cell |
| End-user runtime | Web app → AppView API | Web app → local conductor (or Holo-hosted) |
| Bridge | Content anchoring (CID hashes on chain) | System Agent multi-sig with EVM signing key |

---

## 2. Currency: What Lives Where, Why

### 2.1 What works natively on Holochain

These were initially miscounted as Holochain-incompatible; on closer examination they map cleanly:

- **Demurrage as a validation rule.** Decay function `Balance_t = Balance_initial · e^{-rt}` evaluated by validating peers at spend-time. Structurally equivalent to Kindact's `effectiveBalance = rawBalance * (currentDecayIndex / balanceDecayIndex)` in [spec 003](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/003-cc-token-core/README.md). No global state machine required.
- **Conditional issuance via "System Agent" countersigning.** Standard HoloFuel pattern: a designated agent (multi-sig DAO) "goes into debt" to credit verified workers. Maps to the verify-then-mint loop in [spec 008](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/008-work-verification-rewards/README.md).
- **No gas on social actions.** Comments, votes, deliberation entries are free in Holochain. Genuine UX advantage over EVM.
- **Mutual-credit zero-sum property.** Sum of all balances is always zero. Demurrage pulls both positive and negative balances toward zero — discourages hoarding, encourages debt repayment. Aligns with Kindact's anti-extractive economic stance.
- **Multi-flavor / contextual tokens.** Different "kinds" of $CC for different issue categories can run on one network without ecosystem fragmentation.

### 2.2 What does NOT work natively, and stays on EVM

- **Fiat reserve custody.** Whether held in a real bank account or a stablecoin vault (USDC), the reserve lives somewhere off-Holochain. EVM is the better choice because USDC in a contract is publicly inspectable; a bank account requires trusting a custodian.
- **Hypercerts as recognized impact credentials.** External Impact Buyers (corporates, ESG funds, governments) require Hypercerts on a recognized registry. Hypercerts ecosystem (RetroPGF, Gitcoin, Hypercerts Foundation marketplace, on-chain retirement) is EVM/AT-Proto native. A "DHT entry we call a hypercert" is not interoperable. Hypercerts stay on EVM.
- **Confidence curve & daily redemption caps.** Require global aggregates (total supply, total reserve, today's redemptions) at the moment of transaction. Holochain DHTs are eventually consistent. For reserve-touching operations specifically, this requires countersigned redemption queues — workable, but adds latency. EVM atomic state is the cleaner home.
- **Dispute clawbacks via Debt Ledger.** Need global finality. EVM-side.
- **Identity provider integrations.** Gitcoin Passport, BrightID, PoH, Anon Aadhaar, World ID all attest to EVM addresses or DIDs anchored to one. EVM-side, with bridge translation to Holochain agent keys.

### 2.3 Open question: closed-loop vs. fiat-bridged community currency

The exploration surfaced — but did not resolve — a fundamental product question:

> **Is Kindact a closed-loop community currency for verified care work, or an open economy where outside fiat buys into community-verified impact?**

The current PRD answers this as the second one. Holochain alone makes a more elegant version of the first. The hybrid architecture is the way to keep the second answer while gaining Holochain's benefits on the coordination side.

If the answer flipped to "closed-loop only," the architecture would simplify dramatically — no reserve, no Hypercert fiat sales, no oracle, no bridge. That is a different product than the current PRD describes.

---

## 3. The Bridge

The bridge is the load-bearing component of the hybrid. Treat it as a first-class spec.

### 3.1 Architecture sketch

```diagram
╭──────────────────────────╮     ╭────────────────────────╮     ╭──────────────────╮
│ Holochain                 │     │ Bridge / System Agent  │     │ EVM L2           │
│  • Verified work entry    │────▶│  • Multi-sig (5-of-7)  │────▶│  • Hypercert     │
│  • Quorum signatures      │     │  • Verify quorum sigs  │     │    minted        │
│  • Anchored to global     │     │  • Submit EVM tx       │     │  • $CC minted    │
│    registry               │     │  • Wait for finality   │     │  • Anchor CID    │
│                           │◀────│  • Anchor receipt back │◀────│    on chain      │
╰──────────────────────────╯     ╰────────────────────────╯     ╰──────────────────╯
```

### 3.2 Critical properties

- **Idempotent retries.** Cross-substrate operations can fail mid-flight. Both sides need to handle "tried once, unsure if it landed" gracefully.
- **Reconciliation worker.** Periodic job that scans for Holochain events without EVM receipts (and vice versa) and replays/resolves them.
- **No cross-substrate atomicity.** A Holochain "verified" record can exist with no EVM mint, or vice versa. Failure modes need explicit design — usually a "pending" state that resolves to "complete" or "rolled back" after reconciliation.
- **Multi-sig bias toward 5-of-7 with rotation.** Smaller multi-sigs are too centralized; larger ones are too slow. Members are community leaders, rotated via meta-governance.
- **Capability-token-controlled on Holochain side.** The community grants the System Agent the *exclusive* right to commit "currency-to-fiat" exchange entries, "global Hypercert anchor" entries, and "clawback" entries.
- **Bridge-attack threat model**. Bridges are the most-attacked surface in crypto historically. For Kindact's threat profile (no speculative capital being bridged, slow-moving redemption, multi-sig human checkpoint) the risk is more manageable than for general DeFi, but the bridge needs an explicit security spec, ideally an audit, and ideally a bug-bounty.

### 3.3 What flows across the bridge

| Trigger (Holochain event) | EVM action |
|---|---|
| Work claim verified by quorum | Mint $CC to worker, mint Hypercert |
| Reserve deposit detected (oracle relay) | Update reserve balance in confidence-curve contract |
| Redemption requested + approved by queue | Debit reserve, transfer USDC to redeemer |
| Dispute confirmed | Clawback $CC, write to Debt Ledger |
| Oracle data update | Snapshot oracle state into DHT entry for validators |
| Meta-governance parameter change | Update on-chain parameter registry |

---

## 4. Holochain Coordination Layer

### 4.1 DNA composition

The base unit is a **Base DNA** included by every Kindact-conformant cell. It enforces the always-on core from [extensibility-strategy §2 Layer A](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md#L74-L93).

**Base DNA enforces**:
- Identity must be humanity-verified (link to bridged EVM identity from spec 002 equivalent)
- Issues follow lifecycle states from spec 005 equivalent
- Net-impact gate evaluated before VoteReady
- Approval voting always available as fallback
- Jurisdictional claims (see §6.1) honored
- Dispute and meta-governance hooks honored
- Module manifest validation (slot, multiplicity, dependencies)

**Cell-specific DNA** layers on top of Base:
- Stricter verification policies
- Custom decision engines (consensus, ranked-choice, score, quadratic)
- Community-specific metrics packs
- Local language defaults
- UI theme defaults

**EU-style analogy**: Base DNA is the directive, cell DNAs are member-state implementations. Cells that don't include Base aren't visible in the global Kindact ecosystem (analogous to losing single-market access).

**Tooling caveat**: Holochain doesn't have formal DNA inheritance. Composition is via shared zomes (validation libraries) imported at build time. Two cells claiming to "include Base v3" can be verified by checking that their DNA hashes match an expected build of `Base v3 + their additions`. Mechanical but needs build pipeline tooling. The Holochain Foundation is moving toward a "zomes-as-libraries" model that helps.

### 4.2 Cell taxonomy

| Cell type | Examples | Creation | Membrane |
|---|---|---|---|
| **Global Registry "We"** | Single canonical instance | Genesis | Read-public, write-via-meta-governance |
| **Promoted public cells** | Berlin, Housing, Green-Energy, Climate | Meta-governance proposal | Read-public, opt-in-write with scope verification |
| **User-created cells** | "Manhattan Wind Turbine Q3 2026", custom interest groups | Anyone with humanity-verified ID | Configurable by creator |
| **Project / ephemeral cells** | Per-issue working groups | Issue authors at scope assignment | Default open, dissolved after completion |

### 4.3 Anchors as discovery primitive

**Cells are bounded; anchors are global.**

- Anchors live in the Global Registry DNA.
- Issues, when created in any cell, publish references to all relevant anchors (`#wind-power`, `#new-york`, `#green-energy`, `#housing`).
- Users subscribe to anchors *without* joining the underlying cells. Subscription is cheap (just a watch on the anchor).
- When a subscriber sees an anchored issue they want to engage with, *then* they join the cell that owns it (with whatever membrane proof that cell requires).

**Subscription vs. membership distinction**:
- **Subscription** (anchor watch) — read-only, low-cost, freely scalable to hundreds of subscriptions
- **Membership** (cell join) — full read/write, validator participation, has gossip/storage cost

This separation is what keeps a user with broad interests from drowning in conductor load. See §4.4.

### 4.4 Cell load on devices — what helps, where the limits are

**Holochain primitives that mitigate load**:
- **DHT sharding**: Each peer stores ~√N of cell data, not all of it.
- **Read-only / observer membership**: Subscribe to gossip without validating.
- **Anchor-driven query**: Pull only entries linked to specific anchors, on demand.
- **Holo hosting**: Rent always-on remote conductor; thin client locally. Reintroduces hosting trust assumption.
- **Selective gossip**: Advertise interest in specific anchors only.

**Real-world limits**:
- Production hApps today: thousands to low tens of thousands of users per cell.
- "Green Energy with half the world" is NOT a single-cell scenario in Holochain. It's a **discovery anchor pointing to many smaller per-region, per-project cells.**
- Mobile users should aim for **dozens of anchor subscriptions, single-digit to low-double-digit active cell memberships.**

**Design rule for cell sizing**: prefer many small cells linked by global anchors over few large cells. The fractal architecture is partly motivated by this hardware reality.

### 4.5 Validation

- **Distributed by default**. Every cell member is potentially a validator for entries in their DHT shard. Sample-based validation for large cells.
- **Base DNA validation rules apply universally**. Cell-specific rules layer on top.
- **Cross-cell trust**: the Global Registry only accepts anchored entries from cells whose DNA hash includes the current Base DNA. Cells that fork off the Base lose global visibility.

The user's revised view: distribution via Holochain matches Kindact's anti-centralization stance better than the current AppView model. The original model's single-AppView assumption was a substrate constraint, not a design preference.

---

## 5. Lens Model: Why Multi-Cell Fits Better

### 5.1 The "tacked on" intuition

The current lens model in [extensibility-strategy](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md) tries to do two contradictory things:

1. **"Lenses are not entities"** — filters, loose, overlapping, anti-territorial ([§1](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md#L33-L70))
2. **"Lenses configure modules and have governance"** — entities with config, owners, governance rules ([§8](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md#L429-L443))

These pull in opposite directions. Multi-cell collapses the contradiction by making lenses *be* entities (cells), with the anti-territorial property preserved by:
- Cells can overlap freely (a user joins many)
- Global anchors provide cross-cell discovery without joining
- Subscription is decoupled from membership

### 5.2 Cells vs. lenses — what's gained, what's lost

**Gains**:
- Local-first UX is native, not bolted on
- No central indexer to politically own
- Cell-level validation = community-scaled trust
- Subscription/anchor pattern elegant for interest-based filtering
- Cross-community participation is "join the cell" rather than "filter the global view"
- Performance scales by community, not platform-wide

**Losses to be aware of**:
- **Cross-lens overlay combination is harder**. In the current model, an issue tagged `housing + climate + Berlin` matches three lenses and combines overlays via precedence. In multi-cell, the issue lives in one home cell; combining overlays from three sources requires explicit design (see §6.1).
- **Read access shifts from "always available" to "join the cell"**. Mitigated by public-read defaults, but the design needs explicit attention.
- **Cell governance becomes load-bearing**. Lenses-as-config-rows in the current model are cheap. Cells require explicit creation, naming, governance, lifecycle.
- **Auto-enrollment by location risks territoriality**. The current strategy is explicit that auto-enrollment is "discovery default, not territorial authority." Multi-cell can drift toward territorial unless designed against.

### 5.3 The Manhattan Wind Turbine cross-pollination scenario

```diagram
╭──────────────────────────────────────────────────────────────╮
│ Manhattan-WindTurbine cell (home cell of the issue)            │
│   • Full issue data, deliberation, work claims                 │
│   • Local validators (Manhattan members)                       │
│   • Cell-specific verification rules                           │
╰─────────────────┬────────────────────────────────────────────╯
                  │ publishes anchors
                  ▼
╭──────────────────────────────────────────────────────────────╮
│ Global Registry DNA                                            │
│   • Anchor #wind-power → [Manhattan-WindTurbine, ...]         │
│   • Anchor #new-york → [Manhattan-WindTurbine, ...]           │
│   • Anchor #green-energy → [Manhattan-WindTurbine, ...]       │
│   • Issue header (title, scope vector, protocol binding hash) │
╰─────────────────┬────────────────────────────────────────────╯
                  │ visible via subscription
                  ▼
   Manhattan      NYC          Global engineer
   neighbor       resident     (Nairobi)
   (in cell)      (anchor      (anchor sub
                   sub)         on #wind)
       │             │             │
       └── direct ───┘─── via ─────┴── via bridge-into-cell
           access        anchor        when ready to contribute
```

This works. It's the "easy half" of the cross-cell story.

### 5.4 The harder half — overlay combination across lenses

The exploration acknowledged this remains an open design item. See §6.1 for the deeper analysis.

The user's position (which I think is reasonable): **let the issue + its configuration live wherever it was created**. Single home cell. The cross-jurisdictional case is solved separately via "jurisdictional claims" (§6.1), not via cross-cell overlay merging.

---

## 6. Cross-Cutting Design Items (Required Regardless of Substrate)

### 6.1 Jurisdictional claims

**The Berlin housing problem**: Berlin government specifies housing projects must use consensus + neighbor agreement. An outsider in the Housing cell creates an issue physically located in Berlin. How is Berlin's rule enforced?

**Current Kindact model partially handles this** via scope-vector resolution in [extensibility-strategy §4](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md#L218-L249). Resolution is by scope vector (location refs + topic tags), not by creator's lens. The geographic-specificity-wins precedence rule means Berlin's overlay applies if the issue is correctly tagged.

**The genuine gap, in either substrate**: nothing forces the creator to declare an accurate scope vector. A bad-faith creator could tag `location: global` and slip past Berlin's overlay.

**Proposed addition to the lens model: jurisdictional claims**

A lens can declare overlays as either:
- **Default overlay**: applies if the lens's selector matches
- **Jurisdictional claim**: applies *unconditionally* to any issue whose physical scope falls within the lens's geographic authority, regardless of how the issue is tagged

Three components needed for this to work:

1. **Canonical scope taxonomy** — already on the roadmap as the canonical-geography lock for [spec 030](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/030-extensibility-foundation/README.md). H3/S2 hierarchical location commitments.
2. **Verifiable scope claims** — for issues claiming a physical location, signal beyond self-declaration: geotagged evidence at creation, oracle attestation for high-stakes, dispute mechanism for false claims.
3. **Jurisdictional overlay registry** — consulted by the binding resolver at issue creation.

**Substrate comparison**:

| | Current model | Multi-cell Holochain |
|---|---|---|
| Registry location | AppView database / on-chain config | Global Jurisdictional Claims DNA |
| Enforcement at creation | AppView's binding resolver | Validators in home cell |
| Challenge after | [Spec 012](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/012-dispute-resolution/README.md) Dispute Resolution | Same — disputes target the binding |
| Risk of being ignored | AppView could ignore claims | Home cell's validators could ignore claims |
| Mitigation | Open AppView code + multiple AppViews | Cross-cell challenge: any peer aware of the claim can flag binding-invalid |

**Holochain has a slight edge**: distributed enforcement means an oblivious home cell can't ignore a claim that another cell's validators are watching. The current AppView is a single point of failure for this.

**Action**: this is a real spec gap regardless of which substrate you commit to. Add "jurisdictional claims" as a first-class concept in [extensibility-strategy §4](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md#L218-L249) before either spec set.

### 6.2 Verifiable scope vectors

Coupled to §6.1. Without verifiable location claims, jurisdictional enforcement is gameable.

Tiered verification proposal:
- **Low-stakes issues** (small reward, small impact): self-declared scope, dispute-corrected
- **Medium-stakes issues**: geotagged evidence required at creation
- **High-stakes issues** (large reward, regulated domain): oracle attestation or third-party verification of location

Should be a configurable parameter via meta-governance.

### 6.3 Module composition / DNA inheritance tooling

Holochain doesn't have formal DNA inheritance. Composition is via shared zomes imported at build time. For the "Base DNA + cell-specific extensions" pattern to work cleanly, you need:

- Build pipeline tooling that produces verifiable cell DNAs from `Base v3 + extensions`
- Registry of "Kindact-conformant" DNA hashes computed from current Base versions
- Migration tooling for Base DNA updates

The Holochain Foundation's `hdk` extensions are moving toward this. Worth tracking maturity before commitment.

### 6.4 Cross-cell write semantics

When a Nairobi engineer joins the Manhattan-WindTurbine cell to contribute:

- Their entry is validated by Manhattan's validators ✓
- Do they count as a Manhattan member for governance? (Probably not — engagement on one issue, not citizenship.)
- Voting rights? (Depends on cell's rules — likely "scope-relevant only" filter.)
- If they leave, contribution stays? (Yes — source chains are immutable.)

Designable, but needs an explicit "guest contributor vs. full member" distinction in the cell membership model.

### 6.5 Oracle data on Holochain

Pattern A (relay agent): trusted (or multi-sig) relay reads EVM oracle state, commits as signed entry to DHT. Multiple independent relays for cross-validation. Standard solution.

Pattern B (light client / inclusion proofs): Holochain validator verifies Merkle proof of EVM block inclusion. Stronger, much more work, no off-the-shelf solution.

**Recommendation for v1**: Pattern A with 3-of-N independent relays. Oracle data isn't sub-second-critical for Kindact's use cases.

**Subtle requirement**: when validators check transactions that depend on oracle data, they need to see the *same* snapshot as the transaction author. Standard fix: inline the oracle reading into the transaction (transaction commits both "I am redeeming" and "rate I used was X, witnessed by relays A/B/C"); validators check witnesses are valid relays and rate is within tolerance.

### 6.6 Eventual consistency and reserve operations

For social actions (comments, votes, deliberation), eventual consistency is fine.

For reserve-touching operations (redemption, demurrage applied to reserve calculations), eventual consistency creates exploit windows:

- Daily redemption cap of 1% of reserve, 50 actors race redemptions in 10-second window before DHT propagation → cap can be blown
- Bank-run scenario: thousands of simultaneous redemption attempts → coherent view impossible

**Required design pattern**: countersigned redemption queue. Redemptions don't execute immediately; queued and a quorum of System Agent members must countersign each against a shared, agreed-on-at-signing-time view of the cap state. Adds latency (seconds to minutes), enforces correctness.

**Asymmetric trade-off**: free + instant for social actions, queued + countersigned for reserve-touching. UX users will accept "redemption processes within 5 minutes" but not "your comment appears in 5 minutes."

---

## 7. Cell Creation, Governance, Lifecycle

### 7.1 Reference architectures

- **HoloFuel** — single global cell. Doesn't apply.
- **Acorn** (project organization) — anyone clones a template DNA to create a project. Discovery via invitation. Good pattern for project / ephemeral cells.
- **Volla / Relaymesh** (messaging) — users create rooms freely. Discovery via shared room codes.
- **Neighbourhoods** — *most relevant*. Recursive "We" pattern: a "We" group has its own coordination cell that decides which sub-applets/sub-cells to install. Cell creation is gated by group membership. Sub-groups are sub-cells with delegated authority.

**Strong recommendation**: study Neighbourhoods deeply before drafting alternative specs. Adapt their pattern, don't reinvent. The team (Lightningrod Labs) is approachable; their work is GPL-licensed and explicitly designed as substrate for community-governance hApps.

What to reuse from Neighbourhoods:
- The "We of Wes" recursive group pattern
- Applet-installation governance model
- Sensemaker (their assessment/scoring framework — interesting overlap with Kindact's metrics framework [spec 031](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/031-core-metrics-framework/README.md))

What needs adaptation:
- Their applet model assumes apps are added to a We; in Kindact you want modules added to issues within cells. Not a direct mapping.

### 7.2 Proposed cell creation rules

- **Anyone with a verified humanity ID** can clone the Base DNA and create a cell. Mechanical step.
- **Registration is free but namespaced**. New cells go into `uncurated/<creator-did>/<cell-name>` in the Global Registry. No naming collisions, no land grab.
- **Promotion to canonical** (e.g., `kindact:berlin`) requires meta-governance. Prevents squatting on community-relevant names.
- **Membrane proofs default to public-read, opt-in-write**. Anyone reads; writing requires demonstrating you're in the cell's selector scope (e.g., for Berlin: hold a verifiable location attestation, or be invited by N existing members).
- **Cell sunset**: cells with zero activity for N months flagged in the registry, final dispute window, then archived (entries remain readable, no new writes). Mirrors module sunset policy in [extensibility-strategy](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md#L417-L425).
- **Forking**: anyone can fork a cell (clone with a different governance ruleset). Fork lives in `uncurated` until promoted. Preserves exit rights while preventing canonical-namespace chaos.

### 7.3 Three-tier registry model

```diagram
╭─────────────────────────────────────────────────────────────────╮
│ Tier 1: Global Registry "We" (single canonical instance)         │
│   • Cell directory (name → DNA hash → selector predicate)        │
│   • Anchor index                                                 │
│   • Meta-governance approves base DNA versions                   │
│   • Promotion of cells to "canonical" namespace                  │
├─────────────────────────────────────────────────────────────────┤
│ Tier 2: Promoted public cells (curated)                          │
│   • Berlin, Housing, Green-Energy, Climate, Permaculture, ...    │
│   • Created via meta-governance proposal                         │
│   • Their cell governance is itself a sub-We                     │
│   • Carry jurisdictional claims if applicable                    │
├─────────────────────────────────────────────────────────────────┤
│ Tier 3: User-created cells (uncurated namespace)                 │
│   • Project cells, working groups, custom interest lenses        │
│   • Anyone can clone Base DNA + register                         │
│   • Visible in Global Registry under `uncurated/...`             │
│   • Promoted to canonical only via meta-governance               │
╰─────────────────────────────────────────────────────────────────╯
```

---

## 8. Open Decisions Required Before Drafting Alternative Specs

These are the questions that **must be answered** before a complete alternative spec set can be drafted. They are listed in priority order — earlier items determine later ones.

### 8.1 Product-shape decisions

1. **[Critical] Closed-loop or fiat-bridged?** Does Kindact remain "verified-impact-currency convertible to fiat via Hypercert sales" (current PRD), or shift to "closed-loop community currency for verified care work" (Holochain-native)? *The hybrid architecture in this document assumes the current PRD answer. Flipping the answer simplifies the architecture dramatically.*

2. **[Critical] Substrate commitment threshold.** What evidence would be sufficient to commit to the hybrid? Suggested: prototype the multi-cell + global-backbone pattern with one realistic cross-cell scenario (Berlin housing with jurisdictional claims, OR Manhattan Wind Turbine cross-pollination) end-to-end. If the prototype holds up, commit.

### 8.2 Architecture decisions

3. **Holochain vs. AT Protocol for the coordination layer.** Both are agent-signed, content-addressed, portable. Differences: Holochain has distributed peer validation; AT Proto has the mature lexicon ecosystem (Hypercerts v2 integration, Bluesky tooling). Decide which trade-off matches Kindact's threat model and engineering bandwidth.

4. **Single home cell vs. multi-overlay composition.** User's stated preference: single home cell, with jurisdictional claims handling cross-jurisdictional enforcement. This is the simpler design and probably correct, but worth confirming after prototyping.

5. **Bridge multi-sig composition.** Who sits on the System Agent multi-sig? How are members rotated? What's the threshold (5-of-7 suggested, but configurable)? How is emergency intervention authorized?

6. **End-user runtime.** Local conductor (better sovereignty, harder UX) vs. Holo hosting (better UX, hosting trust assumption) vs. hybrid (default Holo hosting, opt-out to local). Affects the entire frontend design.

### 8.3 Lens / cell model decisions

7. **Cell promotion governance.** Who decides which user-created cells get promoted to the canonical namespace? Threshold votes? Reputation-weighted? Curator role? Affects [spec 013 equivalent](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/013-meta-governance/README.md) scope.

8. **Cell membrane defaults.** Default to fully public (read + write)? Or read-public + scope-verified-write? Or invite-only? Affects discoverability vs. spam trade-off.

9. **Guest contributor model.** When a non-member joins a cell to contribute to one issue, what's their status? Voting rights, governance participation, validation duties? Suggested: "guest contributor" tier separate from "member."

10. **Cell sunset trigger.** What counts as "no activity"? Threshold months, what kinds of writes count, who can challenge sunset?

### 8.4 Cross-cutting decisions (apply to either substrate)

11. **Jurisdictional claims model.** Adopt the §6.1 proposal? With what verification tier for scope claims (§6.2)? Who can declare jurisdictional authority? Affects current [extensibility-strategy](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md) regardless of substrate.

12. **Verifiable scope vectors.** Implement the tiered verification model (§6.2)? Self-declared, geotagged, oracle-attested? Per-issue-stake configurable?

13. **Reserve operation latency.** Accept the countersigned-queue latency (§6.6) for reserve operations? Or add complexity to keep redemption synchronous?

14. **Oracle relay set.** Who runs the oracle relays (§6.5)? Permissionless? Permissioned via meta-governance? N-of-M threshold?

### 8.5 Engineering / operational decisions

15. **Bandwidth for two stacks.** The hybrid maintains EVM + Holochain + bridge. Estimated 1.5–2× engineering load vs. current EVM + AT Proto + content-anchoring. Is the bandwidth available?

16. **Migration path from current spec set.** If hybrid is chosen later, how do current AT Proto records migrate to Holochain entries? Or is the alternative architecture a clean start?

17. **Bridge audit & bug bounty.** When/how is the bridge security validated? Pre-launch audit? Public bug bounty? Insurance fund?

---

## 9. Mapping to Current Spec Set

How each current spec would change, stay, or be replaced under the hybrid architecture.

### 9.1 Specs that stay essentially unchanged

| Current spec | Why unchanged |
|---|---|
| [001 — Diamond Module Registry](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/001-diamond-module-registry/README.md) | EVM-side facet management; bridge needs it |
| [003 — $CC Token Core](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/003-cc-token-core/README.md) | EVM-side token + demurrage + Debt Ledger; canonical $CC stays here |
| [010 — Reserve Exchange](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/010-reserve-exchange/README.md) | EVM-side reserve, confidence curve, oracle integration |
| [011 — Hypercerts Bridge](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/011-hypercerts-bridge/README.md) | EVM-side Hypercerts settlement; trigger source changes (from AppView events to bridge events) |
| [012 — Dispute Resolution](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/012-dispute-resolution/README.md) | EVM-side clawback finality |
| [013 — Meta-Governance](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/013-meta-governance/README.md) | EVM-side parameter registry; scope expands to govern Holochain Base DNA versions and cell promotion |

### 9.2 Specs that change substantially

| Current spec | What changes |
|---|---|
| [002 — Identity Primitive](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/002-identity-primitive/README.md) | EVM identity registry stays; add Holochain agent-key bridging. AT Proto DID linkage may become Holochain agent-key linkage instead. |
| [004 — Content Anchoring](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/004-content-anchoring/README.md) | AT Proto AppView-anchoring → Holochain DHT-anchoring. Same role (CID hashes on chain), different upstream. |
| [005 — Issue Lifecycle](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/005-issue-lifecycle/README.md) | Issue object lives in home cell; on-chain anchor records `protocolBindingHash` + `cellHash`. Lifecycle states unchanged. |
| [006 — Deliberation Service](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/006-deliberation-service/README.md) | AT Proto AppView pattern → Holochain cell with deliberation zomes. Data models (Comment, ArgumentNode, AISummary) port directly to DHT entries. |
| [007 — Voting Engine](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/007-voting-engine/README.md) | Tally logic stays on-chain for finality; vote casting moves to Holochain (free, peer-validated); tally finalization triggers bridge event to EVM. |
| [008 — Work Verification & Rewards](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/008-work-verification-rewards/README.md) | Work reports as DHT entries (was AT Proto records); peer validation in cell; verified work triggers bridge mint of $CC + Hypercert. |
| [014 — Off-Chain Backend](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/014-off-chain-backend/README.md) | Largest change. AppView pattern → Holochain conductor + Holo hosting + bridge service. May be split into multiple specs. |
| [015 — Frontend](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/015-frontend/README.md) | Talks to local conductor (or Holo-hosted conductor) via WebSocket instead of AppView REST. Component design stays. |
| [016 — Impact Metrics](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/016-impact-metrics/README.md) | Metrics bundles as DHT entries; AI estimation as signed entries from AI service's agent key; on-chain anchor of bundle hash unchanged. |
| [030 — Extensibility Foundation](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/030-extensibility-foundation/README.md) | Lenses-as-config → cells. Canonical-geography lock becomes a hard prerequisite. Module slot model stays conceptually but binds to Holochain zomes/cells. |

### 9.3 Specs that are replaced or merged

| Current spec | Replacement |
|---|---|
| Lens model in [030](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/030-extensibility-foundation/README.md) | "Cell architecture" spec — multi-cell + Global Registry + anchor subscription |
| Module catalog in [extensibility-strategy](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md) | "DNA composition catalog" — Base DNA + approved zome libraries + cell DNAs |

### 9.4 New specs needed under the hybrid

1. **Substrate Architecture Decision Record** — captures the EVM/Holochain/bridge split and the rationale.
2. **Bridge Specification** — System Agent multi-sig, capability tokens, idempotent retry, reconciliation, threat model, audit plan.
3. **Base DNA Specification** — always-on validation rules, composition mechanism, version migration.
4. **Cell Architecture & Registry** — three-tier model, creation, promotion, sunset, fork, naming.
5. **Anchor & Subscription Model** — global discovery primitives, subscription cost, anchor governance.
6. **Jurisdictional Claims** — overlay category, verification tiers for scope vectors, dispute integration.
7. **Cross-Cell Validation & Trust** — Base DNA inclusion verification, cross-cell challenge mechanism.
8. **Oracle Relay Network** — relay set governance, snapshot pattern, validator integration.
9. **Reserve Operation Queue** — countersigned redemption queue, latency UX, exception handling.
10. **Holo Hosting Strategy** — when/whether to use Holo hosting, trust assumptions, fallback to local conductor.

### 9.5 Cross-cutting changes (regardless of substrate)

These are improvements that should be made to the current spec set *too*, since the hybrid surfaced gaps that exist in both architectures:

- **Jurisdictional claims** as first-class addition to [extensibility-strategy §4](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md#L218-L249).
- **Verifiable scope vectors** with tiered verification in [030](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/030-extensibility-foundation/README.md).
- **Distinction between mandatory and default overlays** in lens declarations.

---

## 10. Reference Architectures to Study

In order of relevance:

1. **[Neighbourhoods (NH)](https://neighbourhoods.network/)** — recursive We pattern, applet governance, sensemaker. Closest existing analog.
2. **[Acorn](https://acorn.software/)** — multi-cell project organization, conductor-as-aggregator UX in production.
3. **[HoloFuel](https://holo.host/holofuel/)** — System Agent + countersigned redemption pattern, mutual credit at scale.
4. **[Holochain Foundation `hdk` extensions](https://github.com/holochain/holochain/tree/develop/crates/hdk)** — current state of "zomes-as-libraries" tooling for DNA composition.
5. **[AT Protocol](https://atproto.com/) federation model** — for comparison; the current Kindact coordination layer.
6. **[Hypercerts protocol v2](https://hypercerts.org/)** — the AT-Proto-anchored evolution; understand how it bridges to EVM settlement, since the hybrid architecture must integrate with this.

For the bridge specifically:

7. **[Safe (Gnosis Safe)](https://safe.global/)** — production multi-sig pattern; bridge multi-sig should likely use Safe rather than reinvent.
8. **Cross-chain bridge security post-mortems** — Wormhole, Ronin, Nomad, Multichain. Required reading before drafting the bridge spec.

For oracle integration:

9. **[Chainlink Functions](https://chain.link/functions)**, **[Pyth pull oracles](https://pyth.network/)**, **[RedStone](https://redstone.finance/)** — current state of EVM oracles. Bridge needs to surface these to Holochain.

---

## 11. Recommended Next Steps

1. **Decide the closed-loop vs. fiat-bridged question (§8.1.1)** — this is the gating product decision. All architecture decisions follow from it.

2. **If hybrid is the direction**: spend 1–2 weeks studying Neighbourhoods, Acorn, and HoloFuel hands-on. Read source, run a local hApp, understand the conductor model. The concepts are simple; the implementation reality has texture that text descriptions miss.

3. **Prototype one realistic cross-cell scenario before committing**:
   - Berlin housing with jurisdictional claims, OR
   - Manhattan Wind Turbine cross-pollination
   
   End-to-end. Conductor UI, two cells, Global Registry, anchor subscription, cross-cell write. This is the cheapest way to validate (or invalidate) the architecture before spec work.

4. **Spin up a separate project** (per the user's stated intent) to draft the alternative spec set. Use this document as the source. Use the §9 mapping as a starting outline.

5. **Cross-cutting fixes to current specs** — even without committing to the hybrid, add the jurisdictional claims and verifiable scope vector concepts to the current [extensibility-strategy](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/extensibility-strategy.md) and [spec 030](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/specs/030-extensibility-foundation/README.md). These are gaps in the current design that the exploration surfaced.

6. **Simmer**. The user has explicitly said they want to sit with this longer before committing. Don't rush. The current spec set is implementation-ready; nothing is blocked by the alternative-architecture decision.

---

## 12. Disclaimer & Honest Caveats

This document was produced from a multi-turn architectural conversation, not from hands-on implementation experience with Holochain. Specific risks:

- **No code has been written**. Performance claims (cell load, conductor scalability, sharding behavior) are based on documented Holochain patterns and existing hApp deployments, not on Kindact-specific testing.
- **Holochain ecosystem maturity**: smaller than EVM, fewer production deployments at the scale Kindact targets. Some patterns described here (Base DNA composition, cross-cell challenge) are documented but not battle-tested.
- **Bridge security is hard**. The §3 sketch is a starting point, not a complete design. A real bridge spec needs threat modeling, formal multi-sig analysis, and an audit budget.
- **The "Neighbourhoods adapts to Kindact" claim needs validation**. Their model assumes apps-added-to-groups; Kindact wants modules-added-to-issues-within-cells. The adaptation may be lossy.
- **The user's preference for "single home cell"** (§5.4) is the simpler design but constrains some of the lens-overlay-combination richness in the current model. Whether that constraint is acceptable is itself an open product question.

The hybrid architecture is **defensible and coherent**, not **proven and implementation-ready**. Treat this document as a structured starting point for the alternative spec project, not as a design specification.

---

## Appendix A: Substrate Comparison Table (Final State)

| Dimension | Current (EVM + AT Proto) | Hybrid (EVM + Holochain) |
|---|---|---|
| **Reserve custody** | USDC in audited contract, publicly inspectable | USDC in audited contract, publicly inspectable (unchanged) |
| **$CC canonical supply** | EVM ERC-20 + decay index | EVM ERC-20 + decay index (unchanged) |
| **Hypercert credentials** | EVM/AT-Proto canonical | EVM/AT-Proto canonical (unchanged) |
| **Identity providers** | EVM-anchored | EVM-anchored, bridged to Holochain agent keys |
| **Oracle networks** | Direct EVM consumption | EVM consumption + relay to Holochain DHT |
| **Deliberation data** | AT Proto PDS + AppView | Holochain cell + DHT |
| **Validation** | Centralized AppView | Distributed peer validators per cell |
| **Lens model** | Filter overlays in shared substrate | Multi-cell with anchor-based discovery |
| **Cross-community access** | Shared substrate, filter view | Anchor subscription + cell join |
| **End-user runtime** | Web app → AppView API | Web app → conductor (local or Holo-hosted) |
| **Free social actions** | No (AppView capacity costs) | Yes (peer-validated, no gas) |
| **Cross-substrate atomicity** | N/A (single coordination layer) | Bridge required; not atomic |
| **Engineering surface** | EVM + AT Proto + content anchoring | EVM + Holochain + bridge (~1.5–2× larger) |
| **Ecosystem maturity** | Both mature | EVM mature, Holochain smaller |
| **Coordination-layer political ownership** | Whoever runs canonical AppView | Distributed across cell validators |
| **Mobile UX** | Standard HTTP/WebSocket | Conductor required (Holo hosting mitigates) |

---

## Appendix B: Conversation Summary

This document distills a five-turn exchange exploring whether Holochain could replace or augment the current Kindact substrate. The arc:

1. **Initial framing**: Holochain dismissed too quickly as incompatible with Kindact's reserve-backed currency model.
2. **Currency mechanics correction**: Holochain mutual credit + System Agent pattern handles demurrage and conditional issuance natively. Initial dismissal was wrong on this point.
3. **Reserve & Hypercerts re-examination**: even with Holochain handling currency mechanics, the fiat reserve and Hypercert ecosystem integration force EVM dependency for those layers. The hybrid emerges as the natural answer.
4. **Lens model fit**: multi-cell DNA architecture is a meaningfully better fit for Kindact's lens use case than the current "filter overlays on shared substrate" model. The "tacked on" feeling in the current strategy is partly a substrate constraint.
5. **Open design items surfaced**: jurisdictional claims, verifiable scope vectors, cell governance, cell load on devices. Most are required regardless of substrate; some have cleaner answers in Holochain.

The hybrid architecture in §1 is the synthesis. The §8 decision list is what remains for the user to resolve before committing to drafting an alternative spec set.

---

*End of document. Ready to be moved to a separate project for alternative spec drafting.*
