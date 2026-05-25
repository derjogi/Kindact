# Holochain Hybrid — Prototype Plan

> **Purpose**: Validate (or invalidate) the [hybrid architecture](specs/000-substrate-architecture-decision-record/README.md) cheaply before committing to the spec set in [specs/](specs/).
> **Source**: [implementation/holochain-architecture-exploration.md §11](../implementation/holochain-architecture-exploration.md).
> **Time estimate**: 6–9 weeks of focused work for a single experienced engineer; 3–5 weeks with two. Adjust generously for first-time Holochain builders.
> **Bias**: deliberately scoped down. **No bridge, no EVM, no Hypercerts, no metrics framework, no UI polish, no Holo hosting in this plan.** Those are validatable independently once primitives hold.

## What the prototype must answer

Three questions, in priority order. If any answers "no," stop and revisit the substrate decision before further investment.

1. **Does the multi-cell + anchor + subscription pattern actually deliver the cross-cell discovery UX described in [042](specs/042-anchor-and-subscription-model/README.md)?** Walk a user from "subscribes to `#wind-power`" through "sees a Manhattan-WindTurbine issue in a foreign cell" to "joins as guest contributor and writes a comment" — end-to-end, on one machine, against two real Holochain DNAs.
2. **Is Base-DNA composition workable in current tooling ([041](specs/041-base-dna-specification/README.md))?** Build two cells that both include a shared "Base" set of zomes via the Holochain `hdk` zomes-as-libraries pattern. Verify a Base-tampered cell is detectably non-canonical.
3. **Do jurisdictional claims ([043](specs/043-jurisdictional-claims/README.md)) survive a hostile creator?** Layer Berlin housing on top of the Manhattan scenario: an outsider creates a Berlin-located issue in a global Housing cell; verify the Berlin claim's overlay is enforced unconditionally regardless of the creator's tagging.

If all three answer "yes" with reasonable effort, the architecture's load-bearing primitives are real. The bridge, EVM integration, Hypercerts, and metrics are separate engineering risks — meaningful but not architecturally novel.

## What the prototype explicitly does NOT do

| Out of scope | Why |
|---|---|
| EVM smart contracts | Settlement plane is well-understood; not what's being tested |
| Bridge service ([040](specs/040-bridge-specification/README.md)) | Cross-chain bridge is a separate engineering exercise; Holochain primitives are independent |
| Real $CC token / reserve / Hypercerts | Out of scope until primitives hold |
| Identity providers (Gitcoin, BrightID, etc.) | Use stubbed humanity-verified flag |
| Holo hosting | Local conductor only; mobile UX is a separate validation |
| Production UI | Minimal CLI or HTML — enough to demonstrate flow, not to prototype the [015](specs/015-frontend/README.md) frontend |
| Performance at scale | Two-cell, ~10-agent toy environment; load testing is a separate phase |
| AI summaries, metrics bundles, work verification quorum | Not what's being validated |

If you find yourself building any of these, stop and ask whether you've drifted from the validation question.

## Phase 0 — Foundations (Week 1, can be 2 if new to Holochain)

**Goal**: Be productive in the Holochain build/run loop. Walk through one reference hApp end-to-end on local hardware.

1. Install [Holochain Launcher](https://github.com/holochain/launcher) on your dev machine.
2. Install the [Holochain dev environment via Nix](https://developer.holochain.org/get-started/install-advanced/) — `holochain`, `hc`, `lair-keystore`.
3. Walk the [Forum hApp tutorial](https://developer.holochain.org/get-started/) end-to-end. Build it, install it via Launcher, post entries from two simulated agents.
4. Install [Acorn](https://acorn.software/) and create + invite to a project — see the multi-cell + conductor-as-aggregator UX live.
5. Install one [Neighbourhoods](https://neighbourhoods.network/) hApp (their We pattern) and create a sub-We — see their applet-installation governance live.
6. Read [HoloFuel docs](https://holo.host/holofuel/) for the System Agent pattern (skim the codebase if accessible).

**Deliverable**: a written one-pager of "what surprised me / what was harder/easier than the spec implied." This is the most important artifact in this phase — it tells you which spec assumptions to pressure-test in the next phases.

**Decision gate**: if Holochain tooling is materially worse than expected, document why and revisit before proceeding. Holo Launcher and `hc` should both work for you on Linux/macOS within hours, not days.

## Phase 1 — Manhattan Wind Turbine prototype (Weeks 2–4)

**Goal**: Answer question 1 (multi-cell + anchor + subscription + guest contributor) end-to-end.

### Scope

```diagram
╭──────────────────────────────────────────────────────────────╮
│ Two real DNAs running in one local conductor:                 │
│                                                               │
│   1. global-registry-dna (toy version)                        │
│      • cell directory entries                                 │
│      • anchor entries                                         │
│      • anchor_link entries                                    │
│                                                               │
│   2. manhattan-windturbine-dna                                │
│      • Base-zome subset (humanity-stub, lifecycle-stub)       │
│      • issue entry type                                       │
│      • comment entry type                                     │
│      • publishes anchor_links to global-registry              │
╰──────────────────────────────────────────────────────────────╯
```

### Concrete tasks

1. Build `kindact-base` shared zome library (subset): `humanity_stub` (always returns true for now), `lifecycle_skeleton` (Draft → Deliberating only), `module_manifest` (validates entries declare `slot`).
2. Build `global-registry-dna`: zomes for `cell`, `anchor`, `anchor_link`, `subscription` entries with the validation rules from [030](specs/030-cell-architecture-and-registry/README.md) and [042](specs/042-anchor-and-subscription-model/README.md).
3. Build `manhattan-windturbine-dna` importing `kindact-base` + a `wind_turbine` zome with `issue` and `comment` entry types.
4. Wire issue creation in Manhattan-cell to publish `anchor_link` entries to global-registry.
5. Build a minimal CLI (`hc-bundle` calls or a tiny `tauri` dev shell) that:
   - Spawns 3 simulated agents: Manhattan resident, NYC resident, Nairobi engineer.
   - Manhattan resident creates an issue in Manhattan-cell.
   - NYC resident subscribes to `#new-york`; verifies the issue surfaces.
   - Nairobi engineer subscribes to `#wind-power`; verifies the issue surfaces.
   - Nairobi engineer joins Manhattan-cell as guest contributor and posts a comment.

### Success criteria

- [ ] Issue authored in Manhattan-cell appears in subscribers' notification stream within DHT gossip latency (single-machine: seconds).
- [ ] Subscribing without joining costs measurably less (memory, gossip bandwidth) than joining — measure RAM / cell-membership counts.
- [ ] Guest contributor can write to Manhattan-cell only on the joined issue; rejected on other issues.
- [ ] Comment authored by guest is signed by their agent key and visible to all Manhattan members.
- [ ] Replay: stop both conductors, restart, verify state replays correctly from source chains + DHT.

### Likely surprises to budget for

- DHT propagation in a 3-node local setup is essentially instant; behavior at 30+ nodes will differ. Document this as a follow-up validation.
- Cross-cell write may need explicit cap-token plumbing the spec hand-waves.
- "Guest contributor" is not a built-in Holochain primitive; you'll likely implement it as a per-issue cap grant from a Manhattan member.
- Anchor subscription as "watch on the registry" may need polling in the toy version; full gossip-filter is heavier to implement.

**Status update (spec [048](specs/048-prototype-cross-agent-issue-visibility/README.md))**: Cross-agent issue visibility is now wired end-to-end in `kindact-hc/`. Both cells expose anchor-backed `get_all_*` and per-issue `get_*_for_issue` externs, and the UI polls them every 3s (plus on every local write). The "Trigger Observer Binding Challenge" sandbox button now writes a real `BindingChallenge` link in the housing cell, so the receiving agent sees the issue flip to `Challenged` within one poll tick. Signal-based replacement of the poll is a follow-up.

**Decision gate**: if you cannot get the cross-cell flow working in 3–4 weeks, the architecture's premises about Holochain ergonomics are likely too optimistic. Stop, document, and revisit before adding jurisdictional claims.

## Phase 2 — Berlin jurisdictional claim layer (Weeks 5–6)

**Goal**: Answer questions 2 (Base composition) and 3 (jurisdictional claim enforcement) by extending the Phase 1 prototype.

### Scope additions

1. Build `housing-dna` (a third cell) that imports `kindact-base` plus a `housing` zome. This is the "global Housing cell" where outsiders might create Berlin-located issues.
2. Add `jurisdictional_claim` entries to global-registry-dna with the validation rules from [043](specs/043-jurisdictional-claims/README.md).
3. Author a seed Berlin-housing claim:
   ```
   {
     "claimId": "jc:berlin-housing-rules-v1",
     "scope": {"geographic": ["h3:881f1d4895fffff"], "topicTags": ["#housing"]},
     "overlay": {"decisionEngine": "consensus_neighbor_agreement"},
     "verificationTier": "geotagged_evidence_required"
   }
   ```
4. Extend `kindact-base` lifecycle zome to consult `jurisdictional_claim` entries at issue creation and reject issues that don't carry the required scope-proof tier.
5. Build a fourth simulated agent: an outsider who tries to create a Berlin-located housing issue in housing-dna *without* geotagged evidence (and tagged `location: global` to evade).
6. Build a fifth simulated agent: a Berlin-cell observer that watches the claim and flags `binding-invalid` if Housing-cell accepts a non-conforming issue.

### Success criteria

- [ ] Outsider issue with `location: global` tag but Berlin-physical evidence is rejected at creation by base-zome validators in housing-dna.
- [ ] Outsider issue with no geotagged evidence at all is rejected in housing-dna because the jurisdictional claim requires that tier.
- [ ] Outsider issue with valid geotagged Berlin evidence proceeds, but its protocol-binding hash includes the Berlin claim and the consensus-neighbor-agreement overlay is applied.
- [ ] If you tamper with the housing-dna `kindact-base` zome (e.g., remove the jurisdictional check), the global-registry validators reject housing-dna's anchor_link entries because the DNA hash no longer matches a canonical Base.
- [ ] Berlin observer flagging `binding-invalid` lands the issue in a "challenged" state in the prototype's UI.

### Likely surprises

- "Validators in housing-dna check the jurisdictional claim from global-registry" is a cross-DNA read pattern; verify Holochain's bridge-call ergonomics for this.
- DNA-hash verification (`tampered Base produces different hash`) requires real `hdk` zomes-as-libraries; the toy may need to short-circuit this with manual hash registration.
- Tier verification (geotagged evidence) needs a stubbed evidence type; production would integrate location oracles per [045](specs/045-oracle-relay-network/README.md).

**Decision gate**: if jurisdictional enforcement requires significant Holochain machinery beyond what the spec describes (e.g., a separate enforcement service), document the gap and revise [043](specs/043-jurisdictional-claims/README.md) before committing.

## Phase 3 — Synthesis & decision (Week 7)

**Goal**: Turn prototype experience into the substrate commitment decision.

1. Write a "what we learned" doc covering: tooling reality, performance impressions, ergonomics surprises, gaps between spec and code, estimate of effort to reach v1 from prototype.
2. Update the [open questions](specs/000-substrate-architecture-decision-record/README.md#open-questions) in spec 000 with prototype-grounded answers (or revised confidence).
3. Compare side-by-side with the [implementation/](../implementation/) spec set: which axes are demonstrably better, which are demonstrably worse, which are unchanged.
4. Decide:
   - **Commit to hybrid**: proceed with the holochain/ spec set; start a Phase 4 plan for bridge + EVM integration.
   - **Stay with current architecture**: keep the implementation/ spec set; backport the cross-cutting fixes from [§9.5 of the exploration doc](../implementation/holochain-architecture-exploration.md) (jurisdictional claims, verifiable scope vectors, mandatory vs. default overlay distinction).
   - **Pivot to closed-loop**: if the prototype reveals that the recognized-Hypercerts + reserve constraints are dominating the architecture in ways you don't want, consider the closed-loop alternative ([§8.1.1](../implementation/holochain-architecture-exploration.md)).

## Phase 4 — Only after commit: bridge + EVM stub (Weeks 8–9, optional pre-build)

**Goal** (optional, only if Phase 3 commits to hybrid): de-risk the bridge integration with a stub before full implementation.

1. Deploy a [Safe](https://safe.global/) on a testnet (Optimism Sepolia or Base Sepolia) with 3 founder signers.
2. Stub `BridgeOperatorFacet` with a single function: `mintFromVerifiedWork(workCID, recipient, amount, operationId)` that emits an event.
3. Build a stubbed bridge service that listens to the prototype's "verified work" entry (you'll need to add a trivial work zome to one of the cells), collects 2-of-3 signer countersignatures, and submits the EVM call.
4. Verify end-to-end: a verified-work entry in Manhattan-cell results in a `WorkRewarded` event on the testnet within the bridge SLA.
5. Test idempotency: replay the same workCID; second submission rejected.
6. Test reconciliation: kill the bridge service mid-flight; verify a re-run cleans up.

This validates the bridge plumbing but is not the full bridge spec. A production bridge needs the [040 spec](specs/040-bridge-specification/README.md) in full plus an external audit.

## Tooling stack (recommended)

| Layer | Choice | Rationale |
|---|---|---|
| Holochain | latest stable from [holochain/holochain](https://github.com/holochain/holochain) | Core substrate |
| Build | `hc` CLI + Nix devShell | Standard Holochain dev loop |
| Conductor | local `hc sandbox` for prototype | No Holo hosting in prototype |
| Wallet sims | hand-rolled in TypeScript with `@holochain/client` | Avoid UI work |
| Minimal UI | tiny `tauri` shell or HTML pages with the JS client | Demonstrate, don't polish |
| EVM (Phase 4 only) | Hardhat + Foundry (per implementation/) on Optimism Sepolia | Mirror production stack |
| Bridge service (Phase 4) | TypeScript or Rust; whichever team is faster in | Throwaway, choose for speed |

## Hand-off discipline

- Keep all prototype code in one `prototype-holochain/` directory at the workspace root, sibling to `holochain/` and `implementation/`. Do **not** mix prototype code into either spec project.
- Commit small, frequently. Tag the end of each phase.
- Write the Phase 0 surprises one-pager and the Phase 3 synthesis doc as `prototype-holochain/PHASE0-NOTES.md` and `prototype-holochain/PHASE3-DECISION.md`. These outlive the prototype code.
- If you hit blockers in any phase that take more than 3 days to resolve, write them up as new open questions in the relevant spec(s) and consult the user before continuing.

## What this plan does not commit you to

This is a validation exercise. Completing all four phases does **not** commit you to building Kindact on the hybrid. It commits you to having grounded answers to the substrate question. The cost is 6–9 focused weeks; the alternative (drafting 48 specs to v1 detail without prototyping) is multiples larger and bets the architecture on paper analysis.

The simmering the user has explicitly asked for is healthy. This plan is what to do *if and when* you decide to actively pressure-test the alternative architecture rather than continue desk-research.
