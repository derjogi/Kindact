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