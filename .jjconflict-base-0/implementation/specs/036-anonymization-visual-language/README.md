---
status: planned
created: 2026-05-01
priority: high
tags:
- frontend
- design
- privacy
- ux
depends_on:
- '032'
related:
- 020-015c-ui-deliberation
- 021-015d-ui-voting
- 002-identity-primitive
- 006-deliberation-service
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 036 — Anonymization & Identity Visual Language

## Overview

Kindact intentionally hides authorship during deliberation to reduce bias, then reveals it later under governance-configurable rules ([015-frontend §Anonymization UX](../015-frontend/README.md)). If the UI handles this clumsily, users either think the system is broken ("why no avatars?") or accidentally infer identity from leaked cues. This spec defines a **deliberate visual language for anonymity, pseudonymity, and reveal transitions**.

## Design

### Identity States

The UI distinguishes four states of an authored artifact (comment, argument, wiki edit, vote rationale):

1. **Anonymous** — no identifying surface at all. Author shown as a deterministic per-issue handle (e.g. `Participant 17`) so multiple comments by the same author group visually within the issue, without leaking cross-issue identity.
2. **Pseudonymous** — a stable wallet-derived persona shown across the platform (DID / ENS), still not the legal person.
3. **Verified** — pseudonymous + a verification badge (BrightID, Gitcoin Passport, etc.) per [002-identity-primitive](../002-identity-primitive/README.md).
4. **Revealed** — anonymity lifted post-deliberation; previously-anonymous artifacts now show pseudonymous identity. Reveal is communicated, never silent.

### Visual Tokens

- **`AnonymousAvatar`** — solid neutral circle with a generative geometric glyph derived from a per-issue salt + author hash. Glyphs are visually distinct enough to disambiguate handles on a single page but contain no identifiable information.
- **Pseudonymous avatar** — gradient ring derived from the wallet address; identity-reveal-safe (same gradient for anon/reveal so the transition feels continuous).
- **Color** — anonymous artifacts use a single neutral hue (`color.identity.anon`). Pseudonymous use brand-tinted; verified add a small check overlay.
- **Iconography**
  - `MaskIcon` — anywhere identity is currently hidden.
  - `EyeOpenIcon` — anywhere identity is currently visible.
  - `ClockMaskIcon` — anywhere identity *will* be revealed at a future event (e.g. "revealed when deliberation closes").

### Anonymity Banner

Every page that contains anonymous content shows a **persistent banner** at the top of the relevant region:

> 🎭 You are reading anonymized contributions. Authors are masked during deliberation to reduce bias. Reveal: when the deliberation phase closes (configurable per lens). [Learn more →]

The banner is dismissible per session but reappears on entering a new anonymized region.

### Per-Artifact Treatment

- Anonymous comment header: `🎭 Participant 17 · 2h ago` (no avatar image, geometric glyph).
- Pseudonymous comment header: `<gradient avatar> alice.eth · 2h ago`.
- Verified comment header: `<gradient avatar + check> alice.eth ✓ · 2h ago`.
- Author's own comments (the user themselves) are flagged with a subtle "you" pill, regardless of anonymity state, so the user knows what others see.

### Reveal Transition

When a deliberation phase closes and identity is unmasked:

- A **one-time, prominent banner** appears: "Identities have been revealed. Authorship may now be visible across this issue."
- Per-comment animation: a 320 ms cross-fade from `AnonymousAvatar` to pseudonymous avatar; mask icon morphs to eye icon; handle text crossfades.
- Reduced-motion fallback: instant swap, no fade.
- Newly revealed comments retain a subtle one-time "previously anonymous" tag for the rest of the session, so users orient.
- Reveal is **idempotent** in UI — re-opening the page after refresh shows revealed state with no banner replay (banner is persisted as acknowledged).

### Leakage Prevention (UX rules)

The following UI affordances are **suppressed** while an artifact is anonymous:

- No "view profile" link from anonymous artifacts.
- No relative-time precision finer than "Xh ago" (no exact timestamps that could correlate with off-platform activity).
- No reply-to highlighting that would reveal authorship by quoting.
- Mention syntax (`@alice`) is rendered but not authored-attributable on anonymous artifacts.
- AI summaries that synthesize anonymous comments must not surface stylistic fingerprints (long verbatim quotes); summarizer prompts enforce paraphrase length limits. UI surfaces this with a small "summary paraphrased" indicator.

### Anonymous Voting Identity

Votes are pseudonymously recorded on-chain ([007-voting-engine](../007-voting-engine/README.md)) but **vote rationale text is anonymous during deliberation** like any other authored artifact. UI keeps the vote tally and the rationale identity decoupled in the same surface.

### Configuration Surfacing

The anonymization banner exposes the **lens-configurable rules**:

- When does reveal occur? (deliberation close / vote close / never / custom)
- Which artifact types are anonymized? (comments / arguments / wiki / rationale / all)

Users can click "Learn more" to see the active configuration and which lens supplied it.

### Mode Indicator in Composer

When the user is **about to author** something that will be anonymized, the composer header makes it explicit:

> 🎭 Posting anonymously · authors revealed when deliberation closes.

This is a 1-line header, never a popup, and is persistent until the user submits.

## Plan

- [ ] Implement `AnonymousAvatar` with deterministic per-issue glyph generator
- [ ] Implement pseudonymous avatar gradient (continuity-safe with anon)
- [ ] Add `color.identity.anon` semantic token + verified-check overlay
- [ ] Implement persistent anonymity banner with dismiss + per-region replay
- [ ] Implement reveal-transition animation + reduced-motion fallback
- [ ] Implement composer "posting anonymously" header
- [ ] Implement leakage-prevention rules (timestamp precision, mention attribution, summary paraphrase indicator)
- [ ] Implement reveal banner persistence (acknowledged → hidden)
- [ ] Document the anonymity contract in Storybook with worked examples

## Test

- [ ] Anonymous artifacts render with no PII-revealing surfaces (manual checklist + automated lint on attributes)
- [ ] Reveal animation passes `prefers-reduced-motion`
- [ ] Avatar glyph determinism: same author + issue → same glyph; cross-issue glyphs uncorrelated
- [ ] Banner reappears when navigating into a new anonymized region after dismiss
- [ ] Composer header present on every anonymous-authored input
- [ ] No timestamp precision finer than 1 h on anonymous artifacts

## Notes

- Anonymity is a **trust feature**, not a side effect. Visual treatment must be deliberate and confident, not apologetic ("avatar missing"). The mask glyph + neutral hue is the *correct* state, not a degraded one.
- Coordinate with [006-deliberation-service](../006-deliberation-service/README.md) on the data shape that distinguishes "anonymous now, revealed later" from "anonymous forever".
- The hardest UX question is the moment of reveal: user can feel surveilled if the transition is jarring. The 320 ms cross-fade plus a clear banner is the chosen middle ground.
- Open question: do we offer an opt-out from reveal (some commenters may want permanent anonymity)? Defer to governance / [013-meta-governance](../013-meta-governance/README.md).
