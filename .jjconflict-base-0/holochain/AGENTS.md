# AI Agent Instructions — `holochain/` exploratory spec set

## Project context

This directory holds an **exploratory alternative spec set** for Kindact built on a hybrid EVM L2 + Holochain architecture. It is a sibling to [`implementation/`](../implementation/) (current EVM L2 + AT Protocol architecture). Specs here are for design comparison, not for implementation. **Do not start coding anything from these specs**; the substrate decision is unresolved.

The source of truth for the architecture is [`implementation/holochain-architecture-exploration.md`](../implementation/holochain-architecture-exploration.md). Read it before editing any spec here.

## When working in this directory

1. Run `lean-spec` from this folder (`cd holochain && lean-spec board`).
2. Maintain the numbering convention. Specs that have a counterpart in `implementation/specs/` keep the same number. New specs are in the 040+ range.
3. Each spec frontmatter MUST include a `derivation` field describing its relationship to the corresponding `implementation/` spec:
   - `ported` — copied with only minor wording adjustments
   - `changed` — same scope, materially different design under the hybrid
   - `new` — no counterpart in `implementation/`
   - `replaces` — supersedes a different-numbered spec
4. Flag the open decisions from [§8 of the exploration document](../implementation/holochain-architecture-exploration.md) under an explicit **Open questions** section. Do not silently pick answers.
5. Cross-reference the corresponding `implementation/` spec when writing a `changed` spec, so reviewers can diff the two.

## Scope discipline

- This project is **self-contained**. Every spec the implementation/ project has is mirrored here so each project tracks status independently.
- Substrate-agnostic specs ported from `implementation/` carry `derivation: ported` and a brief **Hybrid notes** block flagging any substrate substitutions to apply when reading detail. The body is otherwise verbatim so the diff against `implementation/` stays small and divergence is easy to spot.
- When the user evolves a ported spec here (status change, content change), do **not** automatically propagate to `implementation/`. The two projects are intentionally parallel until/unless the user picks one.
- Keep specs comparable in detail and rigor to `implementation/specs/`, but do not over-commit. Open questions are a feature, not a bug.

## Closed-loop vs. fiat-bridged

This spec set assumes the current PRD answer (fiat-bridged). If the user flips that decision, much of this directory becomes obsolete and a closed-loop variant should be drafted as a new sibling.
