# Kindact Extensibility Strategy

> **Status**: Draft proposal — awaiting review and correction  
> **Date**: 2026-04-04  
> **Scope**: How communities customize their experience on a single global platform while preserving cross-operability of all data

---

## The Core Tension

Kindact is one global platform with one deployment, one shared data layer, and one set of smart contracts. All issues, votes, tokens, and impact data live in a globally shared, interoperable data layer. Raw data should be auditable and exportable across the platform, but not every detail needs to be prominently visible in every UI or to every viewer by default. Different communities — a housing co-op in Berlin, a climate action group in Nairobi, a neighborhood in São Paulo — still need different tools for their different contexts.

The design challenge: **customizable experience without fragmenting the shared data layer.**

---

## 1. What Is a "Community"?

Communities are **lenses**, not entities. They are loose, emergent, overlapping views on the shared global data.

### Definition

A lens is:

| Component | Description |
|-----------|-------------|
| **Selector** | A filter predicate: canonical location refs, topic tags, scope level, interest keywords |
| **Subscription defaults** | How issues surface by default: optional location-based auto-subscribe, opt-in by interest/follow, or hybrid |
| **Configuration overlay** | Which optional modules are enabled, with what parameters |
| **Governance rule** | How that lens's configuration can be changed (lightweight — using the platform's own issue/vote mechanisms) |

### Examples

- **"Berlin"** — geo-selector covering Berlin, auto-subscribed for users who choose to share a Berlin location hint, opt-in for others interested in Berlin issues
- **"Kreuzberg housing"** — narrower geo + topic tag `housing`, auto-subscribed for users who choose to share a Kreuzberg location hint, configures a consensus deliberation module
- **"Global climate"** — topic tag `climate` + scope `global`, opt-in only, enables prediction markets and extended impact metrics

### Nesting and Overlap

Lenses are not formally hierarchical, but they have implicit specificity through their selectors. "Kreuzberg housing" is more specific than "Berlin" because its selector is narrower. A user can belong to many overlapping lenses simultaneously.

### Auto-enrollment

Auto-enrollment should be understood as a **discovery default**, not as territorial authority. If a user chooses to share a coarse location hint — for example via profile settings, current IP location, or another voluntary signal — Kindact can auto-subscribe them to nearby lenses so relevant issues appear on their dashboard without extra setup.

Users can opt in to any additional lenses and mute or leave location-based subscriptions at any time. Location signals should improve relevance and discovery, not create obligations or silently determine governance rights.

### Shared Geographic Taxonomy

Issues, user profiles, and lenses should reference the same canonical geographic taxonomy. In practice, that means the "Berlin" attached to a user profile, the "Berlin" attached to an issue, and the "Berlin" used in a lens selector should all resolve to the same location identifier rather than free-form strings. This keeps filtering, specificity, and eligibility logic consistent.

---

## 2. Module Taxonomy

### Layer A: Always-On Core (the "protocol")

These define the shared data model and are never disableable. They're what makes cross-operability possible.

| Module | Why it's core |
|--------|--------------|
| **Identity & sybil resistance** (002) | One-person-one-vote is constitutional |
| **Issue object & lifecycle states** (005) | The fundamental unit of the platform |
| **Content anchoring** (004) | Tamper evidence for all content |
| **Basic timeline/comments** | Minimum viable deliberation — every issue must be discussable |
| **Core metrics framework & gating** | Every issue carries baseline metrics and cannot bypass net-impact checks |
| **Approval voting** (007) | The default decision method; always available as fallback |
| **$CC token & demurrage** (003) | Single shared economy |
| **Implementation reports & basic verification** (008) | The reward loop requires verification |
| **Dispute resolution** (012) | Safety mechanism |
| **Meta-governance** (013) | Platform governs itself |
| **Reserve & exchange** (010) | Economic infrastructure |
| **Moderation & audit log** | Platform integrity |
| **Search, notifications, subscriptions** | Basic usability |

### Layer B: Optional Issue Modules

These change how an issue is discussed, decided, verified, or analyzed. Communities enable them.

**Deliberation modules** — mostly additive (can stack multiple):
- Structured pro/con argument graph (Kialo-style)
- Opinion clustering (Pol.is-style)
- Consensus iteration / objection rounds
- Collaborative proposal wiki / structured redrafting
- Randomized ranking algorithms (alternative sorting strategies)

**Decision modules** — one binding engine per decision checkpoint:
- Ranked-choice voting
- Score voting
- Consensus decision mode (iterative until objections addressed; falls back to approval if unresolved)
- Quadratic voting (for resource allocation, not yes/no decisions)

Note: approval voting is always-on core and serves as the universal fallback. These are alternatives a community can adopt for their issues.

**Decision continuity modules** — how fluid decisions persist, stabilize, or become harder to reverse over time:
- Conviction accumulation / reversal thresholds
- Reconsideration windows
- Other future continuity rules that shape reversibility without changing the underlying tally engine

These can begin as optional modules and later be promoted to core through platform governance if they become fundamental to Kindact's operating model.

**Participation modifiers** — additive if compatible:
- Delegation / liquid democracy (per-topic)
- Enhanced competence quiz / informed participation gate
- Stakeholder relevance checks
- Cooling-off / challenge windows

**Signal modules** — additive, non-binding inputs alongside the decision:
- Prediction markets on issue outcomes
- Expert review panels
- Forecast aggregation
- Sentiment snapshots

**Verification modules** — composable as a policy bundle:
- Photo/video evidence with geotag/timestamp verification
- Third-party attestation (professional auditors)
- Peer confirmation (N-of-M community members)
- On-chain proof (smart contract interactions as evidence)
- ValueFlows structured resource-flow reports
- Automated consistency checks

Communities configure a **verification policy** (e.g., "peer confirmation + photo evidence" or "third-party audit required for rewards > X $CC") rather than choosing a single method.

**Metrics & impact dimension packs** — additive, extending a core baseline:
- Core axes (always present and binding): social, planetary, economic cost, time, uncertainty
- Community packs: biodiversity, soil health, housing quality, public health, accessibility, AI safety, education outcomes, etc.

Important: dimension packs extend the shared taxonomy, they don't replace it. Every issue should support adding and adjusting metrics, but it must still preserve the baseline categories and remain bound by them. A farming community adds `soil_health` as a sub-dimension under `planetary`, not as an unrelated top-level metric. This keeps impact data comparable across communities while still allowing domain-specific nuance.

### Layer C: Assistive Modules

Advisory tools that never silently change binding outcomes:
- AI summarization during deliberation
- AI duplicate detection for new issues
- AI drafting assistance / issue improvement suggestions
- Translation services
- AI moderation assistance (flagging, not deciding)
- Topic extraction / clustering

### Layer D: Presentation Modules

Affect how data is displayed, not what exists. User-level or lens-level defaults:
- UI themes / community branding
- Dashboard layout presets
- Ranking/sorting defaults for issue lists
- Data visualization alternatives (charts, maps, timelines)
- Accessibility options

---

## 3. Module Composition: Slots and Multiplicity

Each module declares:

```
Module {
  key                  // unique identifier
  slot                 // where it fits in the issue lifecycle
  multiplicity         // "single" (exclusive) or "multi" (stackable)
  depends_on           // other modules it requires
  incompatible_with    // modules it can't coexist with
  produces             // data types it creates (for fallback rendering)
  read_fallback        // how to display its data to users without the module
  maturity             // experimental | beta | stable | core
}
```

### Slot model

| Slot | Multiplicity | Examples |
|------|-------------|----------|
| `deliberation.surface` | multi | threaded, pro/con graph, pol.is, consensus rounds |
| `decision.engine` | **single** | approval (default), ranked-choice, score, consensus |
| `decision.continuity` | **single** | none (default), conviction accumulation |
| `decision.modifier` | multi | delegation, competence gate, cooling-off |
| `signal.input` | multi | prediction markets, expert panels |
| `verification.evidence` | multi | photo, peer, third-party, on-chain |
| `verification.policy` | **single** | "2-of-3 evidence types" or "auto + random audit" |
| `metrics.dimension_pack` | multi | biodiversity, soil health, public health |
| `assistive.ai` | multi | summarization, duplicates, translation |
| `ui.theme` | single (user-overridable) | community branding |
| `ui.ranking_default` | single (user-overridable) | sorting algorithm |

**Rule**: additive where data can coexist, exclusive where a binding result must be singular.

- ✅ Threaded comments + pro/con graph + consensus rounds (all deliberation surfaces)
- ✅ Approval voting + conviction accumulation + delegation (`decision.engine` + `decision.continuity` + `decision.modifier`)
- ❌ Conviction accumulation + a conflicting continuity policy for the same issue phase (both single in `decision.continuity`)
- ✅ Photo evidence + peer confirmation + automated checks (all verification evidence types)

---

## 4. Module Resolution: Issue-Centric, Not View-Centric

This is the key architectural decision. **The issue carries its resolved module configuration, not the viewer's lens.**

### How it works

When an issue is created, the platform:

1. Reads the issue's scope vector (location refs, topic tags, scope level)
2. Finds all lenses whose selectors match
3. Gathers all configuration overlays from matching lenses
4. Resolves the active module set using precedence rules
5. Stores the resolved configuration as the issue's **protocol binding**

From that point, every user viewing that issue — regardless of which lens they're viewing through — sees and interacts with the same active modules.

### Precedence rules (deterministic, boring)

For conflicting settings in `single` slots:

1. **Issue explicit override** (rare; set by issue creator or governance vote on that specific issue)
2. **Most specific combined overlay** (e.g., "Kreuzberg" + "housing" — both geo AND topic match)
3. **Most specific geographic overlay** (smaller area wins)
4. **Most specific topic/interest overlay** (narrower topic wins)
5. **Platform default**

For `multi` slots: union all compatible modules from all matching lenses.

If two overlays at equal specificity conflict in a `single` slot: fall back to platform default rather than inventing a tiebreaker. Communities can resolve this by creating a more specific combined lens.

### Example

The "Kreuzberg housing" lens enables consensus decision mode. A housing issue scoped to Kreuzberg gets `decision.engine = consensus`. When a user in the broader "Berlin" lens (which uses default approval voting) views this issue, they still see the consensus interface — because the issue's protocol binding says consensus, not because of their lens.

Conversely, a Berlin-wide transportation issue doesn't get consensus just because some suburb lens has it enabled — the suburb's selector doesn't match this issue's scope.

### Procedural snapshots at phase boundaries

To prevent governance gaming (changing the rules mid-process), the issue takes a **procedural snapshot** of the binding rules for that phase. This freezes the procedure, not necessarily the outcome: votes, delegations, and later reversals can still evolve according to the issue's active decision and continuity rules.

| Phase boundary | What gets frozen |
|----------------|-----------------|
| Decision opens | `decision.engine`, `decision.continuity`, `decision.modifier`, eligibility rules |
| Implementation begins | `verification.policy`, `verification.evidence`, reward parameters |
| Dispute opens | dispute resolution rules |

Deliberation surfaces and assistive modules remain flexible throughout — changing how people discuss is less dangerous than changing how decisions are made.

---

## 5. Cross-Operability: The Read/Write Boundary

### Read: globally available, not uniformly visible

All issue data belongs to the shared global layer and should be available through canonical APIs/exports for audit, interoperability, and analysis, subject to the platform's privacy rules. That does **not** mean every detail has to be equally prominent in every UI or shown in raw form by default.

If community A uses consensus and community B doesn't:

- Community B members can **see** the consensus process on shared issues (rounds, objections, resolutions)
- The module provides a **fallback renderer** — a read-only summary view for users whose lens doesn't include the module
- This might be: a summary card showing "Consensus process: 3 rounds completed, 2 objections resolved, current proposal accepted"

**Critical rule**: a viewer's lens defaults must never suppress an issue's active protocol. The city lens might not use consensus for its own new issues, but it must still show the suburb issue's consensus tools.

### Write: controlled by the issue's protocol

A user can interact with (write to) a module when:

1. The module is active on that specific issue (part of its protocol binding), AND
2. The user meets the issue's participation requirements

The user's current lens is irrelevant for write access. You don't need to belong to the "Kreuzberg housing" lens to participate in a Kreuzberg housing issue's consensus process — you just need to meet that issue's eligibility criteria.

### Data schema discipline

Modules extend the core data model but must do so in a structured way:

- Every module declares the data types it produces
- Module-specific data is stored alongside core issue data (not in an opaque silo)
- All module data has a canonical export format (for API consumers, analytics, archival)
- Fallback rendering is mandatory — no module can create data that's unavailable without it

---

## 6. Extension Points Architecture

### On-chain (conservative)

Only modules affecting **trust, money, rights, or finality** get on-chain facets:

- Voting tally logic (different engines as different facets)
- Delegation rules
- Reward minting logic
- Dispute finalization
- Conviction accumulation

Everything else starts off-chain. The Diamond proxy's `ModuleRegistryFacet` already tracks facets — extend it to store approved on-chain module IDs, versions, and metadata hashes.

On-chain modules require full meta-governance approval + security audit before deployment.

### Backend hooks

Event-driven hook system in the Node.js backend:

```
Domain events:
  issue.created
  issue.state_changed
  proposal.updated
  comment.created
  deliberation.round_completed
  decision.opened
  vote.cast
  implementation.report_submitted
  verification.requested
  verification.completed
  dispute.opened
  issue.protocol_resolved

Module hooks:
  validators    — can reject or normalize module-specific input before it is committed; they must not silently change binding outcomes
  side_effects  — async reactions (e.g., "prediction market module opens a market when decision phase begins")
  read_models   — derived data views
  async_jobs    — background processing
  notifications — module-specific notification types
```

Module-specific data: stored in PostgreSQL using typed JSONB columns alongside core entities. Core entities remain strictly typed; modules get structured extension points, not arbitrary schema additions.

### Frontend plugin slots

Contribution-point model (similar to VS Code extensions):

| Slot | Where | What modules contribute |
|------|-------|------------------------|
| `issue.header.badges` | Issue detail, top | Status badges, module indicators |
| `issue.deliberation.tabs` | Deliberation area | Pro/con panel, Pol.is view, consensus rounds |
| `issue.decision.panel` | Decision area | Voting UI for active engine, delegation controls |
| `issue.decision.signals` | Sidebar during decision | Prediction market widget, expert panel summary |
| `issue.metrics.sidebar` | Metrics area | Dimension-specific visualizations |
| `issue.implementation.section` | Implementation area | Verification evidence upload UI, structured report forms |
| `issue.summary.widgets` | Summary/overview | AI summary card, consensus status card |
| `dashboard.cards` | User dashboard | Module-specific dashboard widgets |
| `lens.settings` | Lens configuration | Module enable/disable toggles with previews |

The shell app owns routing, auth, layout, and permissions. Modules provide React components registered to specific slots.

For now, modules are **first-party code in a monorepo** — deployed as part of the single global build, activated by feature flags keyed to the issue's protocol binding. This avoids the complexity of dynamic module loading, sandboxing, or third-party code execution while the platform is young.

---

## 7. Module Lifecycle: From Idea to Deployment

### Development and approval

1. Module author builds against a platform SDK (TypeScript interfaces for backend hooks, React component contracts for frontend slots, Solidity interfaces for on-chain facets)
2. Module provides a **manifest**:
   - Key, slot, multiplicity
   - Dependencies and incompatibilities
   - Data schemas (what it produces)
   - Permissions required
   - Fallback renderer component
   - Maturity level
3. **Platform review** (via meta-governance) approves the module into the **global catalog**
4. Code is merged into the monorepo and deployed globally
5. Communities can then enable the approved module through their lens governance

### Maturity levels

| Level | Meaning | Who can enable |
|-------|---------|----------------|
| **Experimental** | New, lightly tested | Lenses that explicitly opt in, with a visible warning |
| **Beta** | Functionally complete, gathering feedback | Any lens, with a beta badge |
| **Stable** | Production-ready, well-tested | Any lens |
| **Core** | Part of the always-on protocol | Everyone (not disableable) |

Modules can be promoted or deprecated through platform governance.

### Quality guardrails

- **Approved catalog only** — communities cannot upload arbitrary code; they enable from the global catalog
- **Compatibility matrix** — enforced by the slot/multiplicity system
- **Fallback renderer required** — no module can create opaque data
- **Module bundles / presets** — curated configurations like "Neighborhood governance pack" (consensus + delegation + peer verification) or "Research community pack" (expert panels + prediction markets + enhanced metrics)
- **UI complexity budget** — cap how many active deliberation surfaces an issue exposes by default (e.g., max 3 tabs), with an "advanced" toggle for more
- **Sunset policy** — modules with zero usage for N months get flagged for deprecation
- **No hidden schemas** — every module must export canonical data views accessible via the API

---

## 8. Data Model Sketch

```
Lens {
  id: string
  name: string
  description: string
  selector: SelectorPredicate     // location refs, tags, scope, keywords
  subscription_mode: enum         // auto_location | opt_in | hybrid
  governance_policy: GovernanceRef // how config changes are decided
  created_by: address
  created_at: timestamp
}

LensOverlay {
  lens_id: string
  slot: string                    // e.g., "decision.engine"
  module_key: string              // e.g., "consensus-decision"
  mode: enum                      // enable | disable | configure
  params: json                    // module-specific configuration
  specificity_score: number       // computed from selector narrowness
}

ModuleCatalogEntry {
  key: string
  name: string
  slot: string
  multiplicity: enum              // single | multi
  depends_on: string[]
  incompatible_with: string[]
  produces: string[]              // data type keys
  maturity: enum                  // experimental | beta | stable | core
  fallback_renderer: ComponentRef
  manifest_hash: bytes32          // for on-chain modules
}

IssueProtocolBinding {
  issue_id: string
  slot: string
  module_key: string
  params: json
  source_lens_id: string          // which lens contributed this binding
  resolved_at: timestamp
  snapshotted_at: timestamp | null // set at phase boundaries
}
```

---

## 9. What This Doesn't Cover (Yet)

- **Detailed API design** for the module SDK
- **Migration strategy** for the existing 15 specs to incorporate this model
- **Performance implications** of resolving protocol bindings (probably fine — computed once at issue creation, cached)
- **Internationalization** of module UIs and lens configurations
- **Legal/regulatory implications** of community governance over module selection
- **Economic modules** — whether different communities could have different fee structures, reward curves, etc. (probably not — the shared economy is core)
- **Third-party module development** — when/if to move beyond the monorepo model to support external developers

---

## 10. Relationship to Existing Specs

This strategy is an **architectural overlay** that doesn't invalidate the existing 15 specs. Instead, it provides the framework in which they operate:

- **001 (Diamond Module Registry)** — already supports the on-chain facet model; extend `ModuleRegistryFacet` to include module catalog metadata
- **005-009 (Issue → Deliberation → Voting → Verification → Delegation)** — these become the first modules in the catalog, with 005/007/008 plus the core metrics framework as core and 006/009 optional where appropriate
- **013 (Meta-Governance)** — governs the module catalog approval process
- **014 (Backend)** — implements the hook system and module resolution engine
- **015 (Frontend)** — implements the plugin slot system

A new spec should be written to formalize this extensibility architecture, sitting between 001 and the functional specs as a foundational concern.
