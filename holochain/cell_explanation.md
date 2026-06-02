I want to understand a bit better how the holochain architecture can scale in the particular kindact scenario. Speficially: It looks like every new 'lense' requires actual _code_, is that correct? If so, that would be quite a big blocker to scaling (and adoption), because users aren't coders; users want to immediately be able to create their particular lense, and possibly over time there would be millions and more lenses (e.g. one for every city!)... do they all have to be created as new zome in code?
Explored 3 files, 3 lists
Good question — this is exactly the scalability concern the cell architecture is designed to address. Looking at the relevant specs, the short answer is no, most "lenses" do not require new code. There are three tiers, with very different cost profiles:

1. Anchors — free, no code, scales to millions
Per [042-anchor-and-subscription-model](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/042-anchor-and-subscription-model/README.md) and §4.3 of the [exploration doc](file:///home/jonas/Documents/Governance/Own/Kindact/implementation/holochain-architecture-exploration.md#L199-L212), anchors are just tags/paths in the Global Registry (#new-york, #wind-power, #permaculture). Users create and subscribe to them with no code, no DNA, no governance setup. The "one anchor per city" case is purely data.

2. Cells — cloning, not coding
Per [030-cell-architecture-and-registry](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/030-cell-architecture-and-registry/README.md#L97-L104):
Anyone humanity-verified can clone the Base DNA and create a cell. Mechanical step.

A cell is the Base DNA + a configuration record (selector predicate, membrane rules, governance engine choice, jurisdictional claims). In Holochain terms, this is done via DNA modifiers / properties — same compiled zome bytecode, different config baked into the hash. The user picks options in a UI; the conductor produces a new cell. No Rust, no build pipeline.

The "Manhattan Wind Turbine Q3 2026" example in the cell taxonomy table is literally a user-created cell, not a developer artifact.

3. Custom zomes — the only path that needs code
The things that do require code are listed in [041 §4.1 "Layered cell DNA"](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/041-base-dna-specification/README.md#L62-L73):
- A genuinely new decision engine (e.g., a novel quadratic-funding variant)
- A new metrics pack with custom validation
- Stricter verification logic beyond what Base parameters express

These are equivalent to "writing a new app," and meta-governance curates them as reusable zome libraries other cells can install. This is rare and intentionally so.

Why the scaling story holds

╭─────────────────────────────────────────────────────────────╮
│ Millions of users / cities / interests                      │
│   ├─ Anchors (pure data) ─────── unlimited, free            │
│   ├─ Cells (Base DNA + config) ─ unlimited, no-code         │
│   └─ Custom zomes ────────────── rare, curated, code        │
╰─────────────────────────────────────────────────────────────╯

The architectural bet is that 99% of "I want a lens for X" is satisfied by an anchor or a configured clone of the Base DNA, and only the long-tail novel-governance-mechanism cases need code. The "one cell per city" worry collapses into "one cell config row per city + one anchor per city," which is the same cost as creating a subreddit.

The real open question isn't whether cells need code — it's the one called out in [030's open questions](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/030-cell-architecture-and-registry/README.md#L164-L171) and §8.3.7 of the exploration: cell-creation UX, naming collisions, and whether the parameterization surface of the Base DNA is rich enough to cover most cases without forcing custom zomes. If the Base DNA's configuration knobs are too narrow, people will end up needing code for cases that should have been pure config — and that would be the actual blocker. Worth flagging in [041's "Open questions"](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/041-base-dna-specification/README.md#L103-L109) explicitly if it isn't already.
Ok. Could you explain the cell layer a bit more, I don't understand what exactly it means to 'clone' the base DNA, creating a config record, DNA modifiers/properties, producing a new cell... 
Also, why then do we have a separate DNA for the global registry, housing & manhattan-windturbine?
Explored 5 files, 2 lists
Great — now I can ground this in the actual prototype. Let me walk through the concepts using what's literally in your repo.

The vocabulary, concretely

Term
What it actually is
In your repo
Zome
A WASM-compiled Rust module with entry types + validation functions. Code.
wind_turbine_integrity.wasm, registry_integrity.wasm, housing_integrity.wasm
DNA
A bundle of zomes + a manifest (dna.yaml) + optional config (properties, network_seed). The build artifact that defines a network's rules.
[manhattan_windturbine.dna](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/kindact-hc/dnas/manhattan_windturbine/workdir/manhattan_windturbine.dna), and the three dna.yaml files
DNA hash
A content-addressed hash of (zome WASMs + properties + network_seed). Two DNAs with the same zomes but different properties have different hashes, so they form different networks.
Computed at install time
Cell
A running instance of a DNA in a conductor, bound to one agent. (dnaHash, agentPubKey) → cell. The thing that actually has a DHT and members.
The "Manhattan WindTurbine cell" Alice runs

So a cell is not a file — it's the live network that emerges when one or more agents install the same DNA.

What "cloning the Base DNA" actually means

Right now your prototype has three hand-built DNAs, each with its own bespoke integrity zome ([wind_turbine_integrity/src/lib.rs](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/kindact-hc/dnas/manhattan_windturbine/zomes/integrity/wind_turbine_integrity/src/lib.rs) defines IssueEntry, CommentEntry, AnchorEntry). They share types via the kindact_base crate import, but each DNA still has its own compiled WASM and its own DNA hash.

The target architecture is different. There is one canonical "Base DNA" build artifact — a fixed set of generic zomes (issues, comments, lifecycle, identity, dispute, etc., per [spec 041](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/041-base-dna-specification/README.md)). To create a new cell, a user does NOT recompile anything. They:

1. Take the same kindact_base.dna WASM bundle.
2. Fill in DNA properties — a JSON blob baked into the manifest:
properties:
  cellName: "berlin"
  scopeLevel: "city"
  locationRefs: ["h3:88283082..."]
  membrane: { read: "public", write: "scope_verified" }
  decisionEngine: "approval_voting"
  jurisdictionalClaims: ["jc:berlin-housing-rules-v2"]
3. The conductor hashes (base_wasm + properties + network_seed) → new DNA hash → new isolated network.
4. The Base zomes' validation code reads dna_info()?.modifiers.properties at runtime and enforces those rules.

That's "cloning." No Rust compilation, no new file in dnas/. The "config record" registered in the Global Registry is essentially the same JSON blob plus the resulting DNA hash so others can discover and join.

Notice dna.yaml already has properties: null and network_seed: null slots — those are exactly the parameterization knobs. They're nulled out in the prototype because each DNA is currently hardcoded, but in the target design properties is where the lens configuration lives.

Why three DNAs exist in the prototype right now

This is a prototyping shortcut, not the target architecture. Per the [holochain/ AGENTS.md](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/AGENTS.md) note: "Do not start coding anything from these specs" — the code under kindact-hc/ is exploratory scaffolding to learn the substrate, not a faithful implementation of [spec 041](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/041-base-dna-specification/README.md).

Each of the three was built as a separate DNA because:

- global_registry is genuinely a different DNA — even in the target design. It plays a different role (anchor index, cell directory, cross-cell discovery per [spec 042](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/042-anchor-and-subscription-model/README.md)). It has different entry types (AnchorEntry, cell records), different membrane (write-via-meta-governance), different scaling profile (one canonical instance everyone subscribes to). It will always be its own DNA.
- housing and manhattan_windturbine are the ones that should not be separate DNAs in the target architecture. In the prototype they were each given their own integrity zome so you could see two cells gossiping in isolation and exchanging anchor links. But conceptually they're both "an instance of the Base DNA with different properties." When [spec 041](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/041-base-dna-specification/README.md) is implemented, they collapse into:
- kindact_base.dna + properties: { cellName: "housing", ... }
- kindact_base.dna + properties: { cellName: "manhattan-windturbine", ... }

Both run identical WASM; the conductor produces two distinct cells because the property-blobs differ, yielding distinct DNA hashes.

The picture

PROTOTYPE TODAY                          TARGET (per spec 041)
─────────────────                        ─────────────────────
crates/kindact_base/  (shared types)     crates/kindact_base_*/  (six zome libs)
                                                 │
dnas/                                            │ built once into:
├── global_registry/   ← own zomes               ▼
├── housing/           ← own zomes        kindact_base.dna   (canonical artifact,
└── manhattan_         ← own zomes                            registered hash)
    windturbine/                                  │
                                                  │ instantiated as cells
Three separate DNA hashes,                        │ via different properties:
three networks,                                   ▼
hand-built validation each.              ┌──────────────────────────┐
                                         │ cell "berlin"   props:{} │
                                         │ cell "housing"  props:{} │
                                         │ cell "manhattan-wt" "..."│
                                         │ cell "your-block" "..."  │
                                         │  ... millions ...        │
                                         └──────────────────────────┘
                                                  +
                                         global_registry.dna
                                         (one separate DNA, always)

So the answer to your second question: global_registry stays its own DNA forever; housing and manhattan_windturbine only exist as separate DNAs today because the prototype hasn't implemented the parameterized Base yet. That's exactly the gap the user-spawned-cells story depends on closing.

A reasonable next prototype step would be to merge housing and manhattan_windturbine into a single kindact_base.dna and demonstrate spawning both as instances with different properties. That would prove the "no-code cell creation" claim concretely.


----


Please go over the open questions with me, one by one (or grouped if they are tightly related). Please explain them so that someone who doesn't know much about holochain or other technical aspects can understand what the decision is about, and what and of it affects.
Plan for the walkthrough

There are ~30 open questions across 10 specs. I'll group them so closely-related decisions are discussed together, and work from most foundational/strategic to most local. I'll do one group per turn and pause for your reactions/decisions before moving on, so this stays a real conversation rather than a dump.

Here's the order I propose:

1. Strategic substrate decisions (000) — the "are we even doing this?" questions
2. Base DNA & what counts as a real Kindact cell (041)
3. Cells: who creates them, who curates, who sunsets (030)
4. Jurisdictional claims: whose rules apply where (043)
5. Anchors & subscriptions: how people find issues across cells (042)
6. Issue lifecycle: home cell, migration, rewards UX (005)
7. Deliberation: AI agents, CRDTs, read replicas (006)
8. Content anchoring: what gets pinned on-chain, who runs the gateway (004)
9. The bridge: multi-sig, audits, trust minimization (040)
10. EVM Diamond shape (001)

Tell me if you'd rather reorder or merge groups. Otherwise, here's Group 1.

---

Group 1 — Strategic substrate decisions (000)

These are listed under "Open questions" in [000-substrate-architecture-decision-record](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/000-substrate-architecture-decision-record/README.md) and they're the load-bearing strategic questions. Everything else in the directory is downstream of these.

1a. Closed-loop vs. fiat-bridged (§8.1.1)

What it means in plain language. Today's PRD says $CC is fiat-bridged: it has a real USDC reserve behind it, people can redeem $CC for stablecoins, and the system needs to integrate with the regulated financial world (custody, compliance, identity providers like World ID, on-chain Hypercerts that exist in the broader impact-credit market).

The alternative is closed-loop: $CC is purely an internal accounting unit, like LETS points or babysitting-circle hours. No fiat reserve. No redemption to USDC. No need for EVM at all, plausibly.

Why the question matters. If you go closed-loop, most of this directory becomes obsolete. The whole reason for the three-layer hybrid (EVM + bridge + Holochain) is that fiat redemption, recognized Hypercerts, oracles, and identity providers all need EVM's global atomic state. If you don't need any of that, you can drop the EVM layer entirely and do a pure-Holochain Kindact. Cheaper, simpler, fewer attack surfaces — but you lose interop with the rest of the impact-economy ecosystem, and $CC becomes economically inert outside the community.

What's affected if it flips. Everything in holochain/ would need to be redrafted as a closed-loop variant. Specs 001 (Diamond), 040 (Bridge), and large chunks of 004/005 lose their reason to exist. This is why [AGENTS.md](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/AGENTS.md) explicitly flags it: "If the user flips that decision, much of this directory becomes obsolete and a closed-loop variant should be drafted as a new sibling."

Current status. The PRD says fiat-bridged. This entire spec set assumes that. The question is whether you want to actively confirm that for the third time or formally close it.

1b. Substrate commitment threshold (§8.1.2)

What it means. Right now you have two parallel architectures specced — implementation/ (EVM L2 + AT Protocol) and holochain/ (the hybrid). At some point you have to pick one and commit. The question is: what evidence would be enough to justify that commitment?

Why it matters. Forever-parallel exploration is its own form of cost. Specs drift, decisions never land, real engineering work can't start. But committing too early to the wrong substrate is also expensive.

The decision shape. You need to define a concrete bar — e.g., "if the prototype demonstrates working cross-cell discovery + jurisdictional enforcement + bridge round-trip for a verified work claim, I commit to hybrid", or conversely "if the prototype shows bridge complexity is unmanageable for a small team, I commit to AT Proto". The current ADR (item 2 in the Plan) says the cross-cell prototype was validated. That's evidence — but is it enough?

What's affected. Whether you keep maintaining implementation/ and holochain/ in parallel, or sunset one. Whether you start hiring/building for one substrate's expertise. Whether spec 000 flips from "in-progress / decision recorded but not committed" to "complete / decision committed".

1c. Holochain vs. AT Protocol for the coordination layer (§8.2.3)

What it means. Both Holochain and AT Protocol can host the off-chain coordination work (issues, deliberation, comments, votes). They make different trade-offs:

Aspect
AT Protocol
Holochain
Mental model
Like Bluesky — every user has a Personal Data Server (PDS), and an "AppView" (a big indexer) aggregates everything into a searchable feed
Every cell is its own peer-to-peer mini-network; users run a "conductor" that gossips data with cell members
Centralization risk
The AppView is a single political/operational point — if Kindact's AppView is censored or DDoS'd, the platform goes dark
No single point — each cell's members validate and gossip; harder to censor, harder to take offline
Ecosystem maturity
Production-scale (Bluesky has millions of users); mature tooling
Smaller community; tooling immature; "zomes-as-libraries" still rolling out
Resource cost on user devices
Lightweight — users just publish to their PDS
Heavier — conductors hold cell DHT data, gossip, validate
User onboarding
Familiar (just an account)
Less familiar; needs Holo hosting ([047](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/047-holo-hosting-strategy/README.md)) to feel as easy

Why it matters. This is the substantive comparison the parallel spec sets exist to enable. Holochain wins on decentralization, anti-censorship, and free social actions (no gas to comment). AT Proto wins on tooling maturity, scale, and onboarding UX. The hybrid spec set bets the former matters more for Kindact's anti-territoriality values.

What's affected. If AT Proto wins this comparison, the whole holochain/ directory was a useful exercise but implementation/ becomes the path forward. If Holochain wins, the bridge complexity and tooling-immaturity costs become real and must be budgeted for.

1d. Bandwidth for two stacks (§8.5.15)

What it means. The hybrid is not a one-stack project. You need:
- EVM Solidity development (Diamond, facets, audits)
- Holochain Rust development (zomes, DNAs, validation)
- A bridge service written in some third language (Node? Rust? Go?) run by independent operators
- Two sets of tests, two sets of audits, two sets of CI

The estimate in [000's "Consequences > Negative"](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/000-substrate-architecture-decision-record/README.md) is ~1.5–2× engineering bandwidth vs. the current implementation/ architecture.

Why it matters. This is the operational reality check. A 3-person team building hybrid is probably underwater. A 6-person team can do it. A 1-person team should pick a single substrate.

What's affected. Realistic hiring plan, runway, and what "MVP" means. May force a phased approach — e.g., ship pure-EVM v1 to validate product, then layer Holochain v2 once the team is bigger.

---

How I'd suggest we land Group 1

These four questions are really one question worn four ways: am I committing to the hybrid, and if so, on what evidence and with what team size? If you have answers (even tentative ones), tell me what they are and I'll either:
- record them in the ADR and move us on to Group 2, or
- note them as still-pending and move on anyway.

Otherwise just tell me to proceed and we'll work through the more concrete downstream questions, which are easier to reason about even with 1a-1d still simmering.
a: Yes I need the fiat bridge!
b: commit to holochain. (but don't do anything about the implementation - just in case I _do_ want to switch later. But for now, holochain it is!)
c: I'm mainly conserned about resource cost & user onboarding, and I don't understand what's actually involved. How do users access the holochain app? Can there actually be a web interface? (oh... that might even affect (b)! If I can't have a web interface that users can go to, then I think adoption will be significantly more difficult, making this a much less attractive choice in the end...) also, how much load is on the users devices? Is it ... just heavier than AT protocol, but still relatively lightweight and bearable, or actually ~heavy~ ?
d: bandwidth is ok
Explored 1 file
Group 1 — recorded & reconsidered

Decisions captured: (a) fiat-bridged confirmed, (d) team bandwidth OK. (b) is paused pending (c) — and you're right to pause it, because (c) is the load-bearing UX question for whether Holochain is actually viable for Kindact's audience.

(c) — Can users actually get a web interface? And how heavy is the user-device load?

Short version: yes there can be a web interface, but the path to it is bumpier than it sounds, and on mobile especially the resource story is honestly the weakest link in the whole hybrid design. This is the single biggest UX risk per [spec 047 itself](file:///home/jonas/Documents/Governance/Own/Kindact/holochain/specs/047-holo-hosting-strategy/README.md#L99): "The local-vs-hosted question is the single biggest UX risk in the hybrid architecture."

How users access a Holochain app — three runtime modes

A Holochain app needs a conductor running somewhere. The conductor is a background process that keeps the user's data, gossips with other peers in each cell, and runs validation. Someone has to run it. Three options:

Mode
Where the conductor runs
What the user sees
Trade-off
Local desktop
On user's laptop, bundled with a desktop app (Tauri/Electron wrapper around the Holochain Launcher)
Desktop app icon. Like installing Signal Desktop or Discord
Most decentralized; users have to download & install
Local mobile
On user's phone, as part of a native mobile app
A normal mobile app, but it has to keep a background process alive
Sovereignty OK; battery and reliability are real concerns
Holo hosting
On a third-party "host" computer (Holo network or Kindact-operated)
A normal web page in any browser
Lowest friction; introduces a hosting trust assumption

So yes, a browser-only web interface is possible — but only via Holo hosting (or a Kindact-operated conductor pool that fills the same role). The web frontend itself is just a Svelte/React app talking over WebSocket to some conductor; the question is just whose conductor.

The catch on Holo hosting

Holo (the company behind Holo Hosting) has been promising production-grade browser-accessible Holochain hosting since ~2019. Reality as of mid-2026:

- The Holo Network and HoloFuel (the cryptocurrency that pays hosts) have had repeated launch delays
- Holo Hosting works technically and some real hApps run on it, but it's "early beta"-flavored, not "Stripe-grade reliable"
- Production-readiness, geographic host distribution (especially LATAM/Africa/SEA per spec 047's open questions), and pricing model are all still genuinely uncertain

The spec is candid about this: "Holo hosting is the right model for Kindact's values but its production readiness needs explicit validation before commitment."

Realistic fallback if Holo isn't ready: Kindact-operated conductor-as-a-service

This is the pragmatic answer most projects choose. Kindact runs a conductor pool, users connect via web browser, identical UX to a normal SaaS app. But:

- It re-introduces a single Kindact-operated dependency (exactly what Holochain was supposed to avoid)
- Trust profile becomes similar to AT Protocol's AppView model — Kindact can censor reads, sees metadata, can be DDoS'd or compelled by court order
- Signing keys still stay with the user (browser/hardware wallet), so the conductor can't forge entries — but it can selectively withhold them
- It's not nothing — multi-host replication mitigates a lot — but the political/operational decentralization story gets significantly weaker

So the realistic deployment ladder is probably:
1. Launch: desktop app (Tauri wrapper) + Kindact-operated conductor pool serving the web UI
2. Year 1–2: migrate the conductor pool to Holo hosting as it matures
3. Year 2+: mobile app, ideally with local conductor option

Device-load reality

For people who run a local conductor:

Resource
Desktop reality
Mobile reality
RAM
200–800 MB
80–250 MB — not lightweight on older phones
Storage
100 MB per active medium cell (grows with cell membership)
Same numbers, much tighter budget
Bandwidth
Idle ~1 KB/s, active ~50 KB/s per cell — adds up if you're in 10 cells
Same, with mobile-data implications
Battery
"Non-trivial; ongoing gossip drains"
Non-trivial — the elephant in the room
Always-on
Conductor needs to be running for you to participate and receive gossip
Mobile OSes aggressively kill background processes — gossip falls behind, sync gets choppy

For comparison:
- AT Protocol: essentially zero device load (it's just an account on a server, like Bluesky). Web app is trivially light.
- Holochain local: comparable to running Signal Desktop + a small torrent client simultaneously. Bearable for an engaged user on a modern machine. Genuinely painful on a 4-year-old Android phone in a high-data-cost country.
- Holochain via Holo hosting: device load drops to ~AT-Proto levels (it's just a web app), at the cost of the hosting-trust assumption.

The honest summary: on desktop with a modern machine, "heavier than AT Proto but bearable." On older mobile devices in cost-sensitive markets, "actually heavy" — to the point that Holo hosting (or Kindact-operated equivalent) becomes basically mandatory, not optional.

How this affects (b)

Two ways to read the situation:

Read 1: "Holochain still wins." Because Kindact targets a values-aligned audience that will tolerate either a desktop install (engaged users / power users / validators) or a slight web-hosting-trust assumption (casual browsing), the censorship-resistance and "free social actions" wins are still worth it. The web UX problem is solvable — start with Kindact-operated conductors, migrate to Holo as it matures.

Read 2: "AT Protocol wins after all." If a critical mass of your users are on mid-range phones, especially in low-bandwidth markets, asking them to either install a desktop app or trust either Holo or a Kindact-operated conductor (re-introducing the very centralization you wanted to avoid) means you're paying the hybrid's complexity tax without getting the decentralization benefit they're "supposed" to be paying for.

My honest opinion — and treat this as advisory, not authoritative: the answer depends heavily on who Kindact's first 10,000 users are. If they're climate-active Westerners on laptops, Holochain is fine. If they're community organizers in Lagos or São Paulo on Android phones with metered data, the resource story is a real problem and AT Protocol's hands-down-better UX may be worth its centralization cost.

What I need from you

Two clarifying questions before recording the (b) decision:

1. Who do you imagine the first 10,000 Kindact users being? (Desktop-having Westerners vs. mobile-first global-south organizers vs. somewhere in between.) This is the single biggest input.
2. Are you OK shipping a "Kindact-operated conductor-as-a-service" web UI at launch as the bridge to eventual Holo Hosting? If yes, the hybrid is viable. If you'd consider that a betrayal of the decentralization premise — and would rather not ship at all than ship that — then the (b) decision needs to flip back to AT Proto.

Tell me how those land and I'll either record (b) as committed-to-holochain (with the launch story documented) or flag it as still-pending pending a re-evaluation against AT Proto.
Some more clarifications about hosting: 
Assuming I might have 2-3 separate communities: 
1. If I have one host, that host would need to handle all of the connections and cells etc; depending on the network size (later assuming we have more than just 3 communities how would that possibly scale?)
2. More likely: I'd have 1 host per community. Would each host only handle the cells the users that are logging in are interacting with? I.e. would a host in community A only have to deal with the data from community A as long as only community-A-people are logging in? If a community-b-person logs into hub A, would it then load the cell data that person B needs? (Or how does that work?) 
3. Would the scaling be 'dynamic', i.e. if I provide all three possibilities: Web UI, Desktop & Mobile app; I start with one host for the Web UI, many people will use that, but then gradually some might shift over to apps; would using those apps automatically a) distribute the load, and b) introduce increasing decentralization and thus stability? (If there are individuals using desktop apps, do those act as a de-facto host while they're online? What about mobile apps?)
Conductors vs. cells — the key conceptual clarification first

Before answering the three questions: there's one bit of vocabulary that makes the whole thing click.

╭──────────────────────────────────────────────────────────────────╮
│ A "host" is a machine that runs user conductors.                 │
│ A "conductor" is one user's Holochain agent.                     │
│ A "cell" is a peer-to-peer network whose members are agents.     │
│                                                                  │
│ A host doesn't "host a cell."                                    │
│ A host hosts users — each user participates in their own cells.  │
│ The cell's data is sharded across all member agents,             │
│ wherever those agents' conductors happen to be running.          │
╰──────────────────────────────────────────────────────────────────╯

So when Alice logs into "host A," what's running on host A is Alice's personal conductor instance. That conductor only participates in the cells Alice is a member of, holding whatever shard of each cell's DHT was assigned to her by the gossip algorithm. Bob's conductor on the same host is an entirely separate process holding entirely separate shards (with some overlap if they're in the same cells).

With that in hand:

1) One host for all communities — how does it scale?

The host's load = sum of all the user-conductors running on it. Roughly:

host load ≈ Σ over users on this host of (cells_user_is_in × activity × shard_share_per_cell)

- If you have 3 communities × 1,000 users each, hosted on one machine, that machine is running 3,000 conductor instances
- Each conductor holds a slice of each cell its user belongs to — but if 1,000 of your users are all in the "Berlin" cell, the host ends up storing many overlapping slices of Berlin's DHT (one per user)
- Scaling limit is just the host's RAM/storage/bandwidth, like any SaaS backend

How it scales beyond one machine: horizontally, like any web service. You add more host machines and load-balance users across them. This is exactly what the Holo Network is supposed to do organically (anyone can run a host and earn HoloFuel), but in practice — pre-Holo-maturity — it looks identical to running a normal SaaS backend pool.

There's no special Holochain bottleneck different from "we now have a lot of users." The good news: scaling problems will look familiar to anyone who's scaled a web service.

2) One host per community — does load stay local?

Yes, mostly — and your intuition is exactly right. A host doesn't have a notion of "I belong to community A." It has the user-conductors that happen to be running on it, each of which only participates in the cells its user is in.

So:

Scenario
What host A actually holds
Alice (community A user) logs in to host A
Alice's conductor joins cell A. Host A holds shards of cell A on her behalf.
1,000 community-A users all log in to host A
Host A runs 1,000 conductors, each holding overlapping shards of cell A. Host A is "the de facto cell-A hub" — but only because 1,000 of cell A's members happen to live there.
A community-B user logs in to host A
Yes — host A now also runs that user's conductor, which joins cell B and starts gossiping with cell B's network. So host A picks up a small slice of cell B's data, just for that user.

Key consequence: if you set up "host per community," the geographic/topical separation isn't enforced by hosting — it's emergent from "most community-A users happen to use host A." A user can sign in from anywhere; their data follows them, replication kicks in, life continues.

Caveat — there's nothing magical preventing duplication. If 1,000 community-A users all live on host A, host A stores 1,000 (overlapping but separate) participations in cell A. This is more storage than a hypothetical "one shard per host" architecture, but it preserves the property that each user is a real independent agent in the cell (not a thin client of the host).

Practical scaling story: add hosts when load demands it; routing users to a "near" host minimizes latency but isn't required for correctness.

3) Do desktop & mobile apps automatically distribute load and add decentralization?

This is the most interesting question, and the answer is: yes for desktop, partially for mobile, and it's actually the strongest argument in favor of Holochain over AT Proto.

Desktop apps → genuine peer contribution

A local desktop conductor is a full DHT peer, indistinguishable from a hosted one. So:

- ✅ Load distribution: every desktop user adds capacity to every cell they're in. The cell's total DHT capacity = sum of all members' resources, regardless of where they run.
- ✅ Decentralization & resilience: a cell with 500 members of whom 50 are running desktop conductors continues to function even if your central host goes down. The desktop users carry the cell.
- ✅ Censorship resistance compounds: the more independent conductors, the harder it is for any single host (including a hostile one) to selectively withhold data.

So your intuition is correct: as power users migrate from web → desktop, the network gets stronger automatically, with no architectural change. This is one of Holochain's real wins over the AT Proto AppView model, where a "power user" on AT Proto doesn't reduce the AppView's load at all.

Mobile apps → contributes when active, with caveats

Mobile is the messy middle:

- ✅ When the app is in the foreground, the mobile conductor participates fully in the DHT — receives gossip, holds shards, validates entries
- ⚠️ When the app is backgrounded, iOS and Android aggressively suspend background processes. The conductor effectively "goes offline" until the user opens the app again
- ⚠️ Other peers in the cell notice and re-shard around the absence; mobile users are treated by the network as "frequently-offline peers"
- ⚠️ Net effect: mobile contributes some capacity, but the network can't depend on it for shard availability

Realistic model: desktop = reliable peer, mobile = ephemeral peer, hosted = always-on peer. A healthy Kindact cell needs enough always-on or reliable participants to cover the shards.

Putting it together — the deployment evolution looks like

Year 0 — Launch                        Year 2 — Mature
─────────────────                      ─────────────────
                                       
   ╭─────────────────╮                    ╭─────────────────╮
   │ Kindact host(s) │ ◀─ web users       │   Holo Network  │ ◀─ web users
   │ (most cell      │                    │   (cell capacity │
   │  capacity)      │                    │    distributed)  │
   ╰─────────────────╯                    ╰─────────────────╯
            ▲                                       ▲
            │ ↕ gossip                              │ ↕ gossip
            ▼                                       ▼
   ╭─────────────────╮                    ╭─────────────────╮
   │ A few desktop   │                    │ Many desktop    │
   │ power users     │                    │ users + some    │
   │ (small extra    │                    │ self-hosters    │
   │  capacity)      │                    │ (real capacity) │
   ╰─────────────────╯                    ╰─────────────────╯
            ▲                                       ▲
            │                                       │
            ▼                                       ▼
   ╭─────────────────╮                    ╭─────────────────╮
   │ Few mobile      │                    │ Many mobile     │
   │ users (intermit)│                    │ users (intermit)│
   ╰─────────────────╯                    ╰─────────────────╯

Centralized-feeling at launch (because nearly all capacity is on your hosts); naturally decentralizes as power users adopt desktop apps and the Holo network matures. This trajectory is real and is the actual value proposition of choosing Holochain over AT Proto. AT Proto can never decentralize this way — its AppView model means "more users = more load on the AppView," forever.

What this implies for decision (b)

Two new pieces of context that update the earlier analysis:

1. The "Kindact-operated conductor pool" launch strategy isn't a betrayal of the decentralization premise — it's a starting state that organically improves as the user base diversifies onto desktop and Holo Network matures. This is meaningfully different from AT Proto, where the AppView model centralizes structurally and permanently.
2. Per-community hosts are natural and easy. "Berlin host," "Lagos host," "São Paulo host" — set them up regionally for latency, and load mostly stays local because users mostly join cells in their own community. Cross-community participation works but pays a small cross-region gossip cost.

So the (b) decision still hinges on the same two questions I asked earlier, but with more honest framing:

1. Who are the first 10,000 users — desktop-having or mobile-first low-bandwidth? The mobile-first answer doesn't kill Holochain (Holo-hosted web works fine on a phone — it's just a browser), but it does mean you're stuck on hosted mode forever for that segment, with the same trust profile as AT Proto. The desktop-having answer means natural decentralization happens over time.
2. Is "ship with Kindact-operated conductor pool, migrate to Holo Network as it matures" an acceptable launch story? Now that you understand it's a trajectory and not a permanent compromise, this might land differently than before.

Tell me how those answer now, and I'll either record (b) and move us to Group 2, or pause for more digging.
One more Q: if 1000 users log into one host, and that host then has to run 1000 conductors each with their internally full set of shards (for whatever cells they have joined), ... e.g. if there are 20 different lenses (= cells?), and each user has joined 10 cells, so there'd be roughly 500 users per cell - or in other words, every second conductor will have a shard of the same cell. (What is a shard in this case? If I have one cell 'housing', then my conductor will have to load all the housing issues; i.e. everything from that cell; isn't it? Or does it only load a subset of the data from that cell? Why only a subset?) 
And then there would be a lot of data duplication, right? If conductor A & conductor C both join cell 'housing', they both independently have to load and store and manage the same data? Or is there some deduplication?
It sounds like quite a big data load, if a host has to run 1000 separate conductors, with effectively 500 copies of the same data...
What a shard actually is — and the duplication problem you just spotted

You've identified a real and important inefficiency. Let me explain the mechanism cleanly, then do the math, then say what it means.

A shard is a subset — your conductor does NOT hold the whole cell

Each Holochain cell uses a distributed hash table (DHT). Every entry has a content hash; the entry lives on the agents whose agent-IDs are "near" that hash in the keyspace. Each agent picks an arc — a slice of the keyspace they're responsible for serving and validating — and only holds entries falling inside that arc.

Cell "Housing" keyspace (a circle from 0…2²⁵⁶):

Agent A's arc ─────╮         ╭───── Agent C's arc
   (holds 10%)     │  cell   │       (holds 10%)
                   ▼  data   ▼
              ╭─────────────────╮
              │ ░░░░░░░░░░░░░░░ │  ← every dot = one entry
              │ ░░░░░░░░░░░░░░░ │
              ╰─────────────────╯
                   ▲         ▲
                   │         │
   Agent B's arc ──╯         ╰── Agent D's arc
      (holds 10%)               (holds 10%)

So if cell "Housing" has 800 MB of data and 500 members with arcs auto-tuned to ~10% each, your conductor holds ~80 MB of housing data, not the whole 800 MB.

Why a subset? Because if every agent held everything, every user's device would have to store and validate every comment, vote, and issue ever posted in every cell they joined — which would be unworkable. The DHT's whole point is to spread the load: many small holders, each piece replicated across enough of them for safety.

What happens when you open an issue you don't hold? Your conductor does a DHT lookup ("which agents are near hash X?"), asks one of them for the data, verifies the signature, and shows it to you. You see all data; you only store a slice. (Recently-viewed and authored entries also get cached locally — your own source chain is always yours.)

Arc auto-tuning: Holochain dynamically shrinks each agent's arc as the cell grows, to keep the redundancy factor approximately constant. A cell with 50 members might have each agent holding 50% of data (high arc); the same cell with 5,000 members might have each agent holding 1% of data (low arc). The math self-tunes.

Now the duplication problem you just identified

You're absolutely right. Let me make it concrete with your scenario:

Parameter
Value
Cell "Housing" total data
800 MB (rough estimate: 10k issues + 100k comments)
Cell members worldwide
500
Auto-tuned arc per agent
~10% (= ~80 MB per agent)
Redundancy factor (target holders per entry)
~50 (typical Holochain default)
Total cell storage across the network
800 MB × ~50× redundancy ≈ 40 GB summed across all 500 agents

Now: if all 500 of cell-Housing's members happen to live on host A:

What host A actually stores
Math
500 conductors × 80 MB each
40 GB for cell Housing alone, on one machine
Across 20 cells with similar profile, 50% co-location
scaling toward hundreds of GB

No, there is no cross-conductor deduplication on the host today. Each user-conductor instance is an isolated process with its own database (LMDB / SQLite, depending on Holochain version). If 50 conductors on the same host all hold the same housing-cell entry, that entry is physically written 50 times to disk. The host's filesystem-level dedup might help slightly for identical blocks, but Holochain doesn't share DHT storage across conductor instances natively.

The deeper problem: co-location defeats the DHT's redundancy guarantee

The 50× redundancy factor exists because the DHT assumes independent, geographically-distributed agents. The promise is: "we replicate each entry 50 times so we can survive failures."

If those 50 holders all live on host A, the redundancy is illusory:
- ✅ The DHT shows "50 holders for entry X" — looks great
- ❌ All 50 holders share a single machine, power supply, network connection, and operator
- ❌ Host A goes down → all 50 copies vanish simultaneously → cell unavailable

This is a known Holochain anti-pattern. The Holo Network's design — many independent small hosts run by independent people earning HoloFuel — is the architectural answer. A Kindact-operated single-host launch strategy partially defeats the redundancy benefits until the user base diversifies.

What this means in practice

Three things partially mitigate the problem

1. Multi-host from day one, not single-host. A Kindact-operated "host pool" of, say, 5 geographically-distributed hosts, with users round-robined across them, restores most of the redundancy assumption. Cost: 5× the infrastructure vs. one big box, but you'd want that anyway for latency and uptime in a global product.
2. Arc auto-tuning helps as cells grow. A 5,000-member cell auto-tunes arcs down to ~1%, so per-conductor storage stays in the tens-of-MB range even for large cells. The duplication is on the host total, not on any single user's device.
3. Power users on desktop genuinely help. Every desktop user is a real independent peer outside the host pool — adds redundancy without duplication on your hosts. This compounds over time.

Two things make it worse

1. No production-grade per-host cache layer in Holochain today. This is technically possible (the community has discussed "infrastructure roles" and "shared cache validators"), but it's not shipping. As of mid-2026 you should plan as if cross-conductor dedup doesn't exist.
2. The Holo Network's HoloFuel-incentivized many-small-hosts model is still maturing. That's the long-term answer to the duplication problem. Until then, "Kindact-operated host pool" is what you've got.

The honest revised cost picture

For a 30k-user, 30-cell Kindact deployment, "Kindact-operated host pool" looks something like:

Resource
Rough budget
Hosts
5–10 mid-spec VMs across regions
Storage
~1–5 TB total across the pool (depends heavily on cell activity and arc tuning)
Bandwidth
Significant — gossip traffic between co-located conductors is intra-pool, but cross-region cell membership generates real inter-host traffic
Ops complexity
Comparable to running a moderate SaaS, plus the unfamiliarity of operating Holochain conductors at scale

Not catastrophic, but real. It's heavier than the equivalent AT Proto deployment (where AppView storage is simply "all the data once" with no replication multiplier). You're paying real infrastructure cost for the future-decentralization story.

What this means for decision (b)

Adding this honestly to the picture:

Factor
AT Proto
Holochain (hybrid)
Day-1 ops cost
Lower
~2-3× higher (replication overhead + multi-host pool)
Day-1 UX
Same browser web app
Same browser web app (via host pool)
Year-3 decentralization trajectory
None — AppView stays central forever
Real — power users + Holo Network mature into actual redundancy
Year-3 ops cost trajectory
Grows linearly with users
Can plateau or decline as load shifts to user devices + Holo
Censorship-resistance reality
Always limited by AppView operator
Initially limited by Kindact's host pool, improves over time
Mobile UX
Native — no friction
Native — but mobile conductors are unreliable, so mostly hosted

The hybrid is more expensive at launch and the decentralization is aspirational at launch (real only after multi-year ecosystem maturation). The question is whether that aspiration is worth the day-1 cost premium.

Your two open questions from before are still the deciding ones:

1. Who are the first 10,000 users?
2. Is "Kindact-operated host pool at launch, evolves toward Holo Network + desktop peers" an acceptable trajectory — given that the launch state is roughly as centralized as AT Proto would be, just with a real evolution path?

Want to answer those now and lock in (b), or do you want to dig deeper into any specific aspect (storage costs, mobile reality, comparison numbers, Holo Network maturity timeline)?