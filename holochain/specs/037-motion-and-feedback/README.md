---
status: planned
created: 2026-05-01
priority: medium
derivation: ported
ports_from: 037-motion-and-feedback
tags:
- frontend
- design
- motion
depends_on:
- '032'
related:
- 021-015d-ui-voting
- 024-015g-ui-token-wallet
- 020-015c-ui-deliberation
- 036-anonymization-visual-language
- 038-accessibility-and-responsive
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 037 — Motion & Micro-Interaction Patterns

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [037-motion-and-feedback](../../../implementation/specs/037-motion-and-feedback/README.md)

## Hybrid notes

Motion & feedback port — substrate-agnostic. New patterns needed for: redemption-queue progress, bridge-pending state, conductor-reconnect status.


## Overview

Motion in Kindact has work to do: it must communicate **state transitions in a slow, asynchronous, often consequential governance loop** (vote cast, conviction accumulating, demurrage decaying, dispute opened, identity revealed). Motion that is decorative becomes noise; motion that is meaningful becomes a feature. This spec catalogs the platform's allowed motion patterns, their durations, and the reduced-motion contract.

## Design

### Principles

1. **Motion has a job.** Every animation either communicates state change, draws attention to a consequence, or guides focus. No idle decoration.
2. **Slow systems deserve calm motion.** Governance is async. UI motion must feel measured (200–320 ms) — not Snapchat-fast.
3. **Reduced motion is a first-class mode.** Every animation has a non-animated equivalent. Honor `prefers-reduced-motion: reduce` everywhere.
4. **Never animate the user out of orientation.** No layout-shifting hero animations. Reserve large motion for explicit user intent.
5. **Motion follows physics, not bling.** Easing reflects mass and inertia (`standard`, `decelerate`, `accelerate`); no exaggerated overshoot.

### Tokenized Timings

From [032-design-system-foundations](../032-design-system-foundations/README.md):

| Token | Duration | Use |
|---|---|---|
| `motion.instant` | 0 ms | reduced-motion replacement |
| `motion.fast` | 120 ms | hover, focus ring, small toggles |
| `motion.base` | 200 ms | tab change, popover, toast in/out |
| `motion.slow` | 320 ms | dialog, sheet, identity reveal |
| `motion.epic` | 480 ms | first-time onboarding moment, success celebration (sparingly) |

Easings:
- `ease.standard` — most transitions
- `ease.decelerate` — entrance (something arriving)
- `ease.accelerate` — exit (something leaving)

### Pattern Catalog

**Feedback on action**
- Button press → `fast` scale 0.98 + opacity 0.9, then return on release.
- Form submit → button shows inline spinner; on success, swap to check icon for 800 ms then return to default label.
- Copy-to-clipboard → 1 s "Copied" badge, fade out.

**State change**
- Toast in → slide-up + fade `base` decelerate, dismiss → slide-down + fade `base` accelerate.
- Dialog → backdrop fade `base`; panel scale 0.96 → 1 with fade `slow` decelerate.
- Tabs → underline slides `base` standard between tabs, content cross-fades `fast`.

**Governance-specific**
- **Vote cast confirmation** — tally bar segment grows from 0 to its new share over `slow` decelerate; the segment is briefly outlined with the user's vote color, then settles. Subtle haptic on mobile.
- **Conviction accumulation** — meter fills continuously (animation tied to data-driven duration, not synthetic). On data refresh, fill animates from previous value with `slow` standard.
- **Demurrage tick** — once per demurrage period, the `DemurrageRing` plays a single `epic` decelerate ring-sweep + balance number tween. Outside that moment, the ring is static.
- **Identity reveal** — see [036-anonymization-visual-language](../036-anonymization-visual-language/README.md). 320 ms cross-fade.
- **Phase advance** — phase timeline node "lights up" (`slow` decelerate, ring + glow) once when an issue advances; not on every render.
- **Dispute opened** — dispute banner slide-down `slow`, dispute icon pulses twice (1 s total) then idle.
- **Reward earned** — $CC balance tweens up; coin-glyph pip rises and fades over `epic`. Reduced-motion: number swap, no pip.

**Skeleton loaders**
- Subtle shimmer at `slow` cycle, low contrast (`color.surface.subtle` ↔ `color.surface.muted`). Never aggressive.
- Skeletons match the final layout's geometry to prevent layout shift on hydrate.

**Drag, sort, drop** (used in delegation manager, lens reordering)
- Lift on grab → `fast` scale 1.02 + elevation step.
- Live snap to grid `fast` standard.
- Drop → settle `base` decelerate.

### Reduced-Motion Contract

When `prefers-reduced-motion: reduce`:

- All durations resolve to `motion.instant` except: focus ring fade (kept fast for clarity).
- Cross-fades become instant swaps.
- No translate/scale-only entrances; opacity swap only.
- Pulsing, looping, parallax, and parallax-like effects are disabled entirely.
- Live-tally bars still animate but at `motion.fast`, not `slow`, to keep them legible without feeling kinetic.

### Performance Budget

- Animations run on `transform` / `opacity` only (compositor-friendly). No `top/left/width/height` animation in production code.
- Frame budget per interaction: < 8 ms scripting, > 55 fps sustained.
- Lottie/JSON animations are restricted to onboarding and first-success moments only; everywhere else uses CSS / `framer-motion` springs.

### Implementation

- Use `framer-motion` for orchestrated component animation; CSS transitions for hover/focus/simple state.
- Centralize all motion configs in `@kindact/motion` (durations, easings, named variants like `slideInBottom`, `fadeIn`, `tallyGrow`).
- Lint rule: no inline `transition:` strings in components — must reference a named token.

## Plan

- [ ] Author `@kindact/motion` package: tokens, named variants, reduced-motion resolver
- [ ] Implement core named variants (fade, slideUp, scaleIn, tallyGrow, ringSweep)
- [ ] Wire reduced-motion media query → variant resolver
- [ ] Apply pattern catalog to existing components in `@kindact/ui`
- [ ] Implement governance-specific motion: vote-cast tally grow, conviction fill, demurrage tick, identity reveal, phase advance, dispute open, reward earned
- [ ] Add Storybook stories that toggle reduced-motion to verify both modes
- [ ] Add CI lint: no raw `transition:` / `animation:` strings in app code

## Test

- [ ] Every motion variant has a reduced-motion equivalent verified in Storybook
- [ ] No layout-shift animations (Lighthouse CLS contribution from motion = 0)
- [ ] Frame-time profiling under sustained interaction stays > 55 fps on a baseline laptop
- [ ] Vote-cast animation completes in ≤ 320 ms in normal mode, instant in reduced-motion
- [ ] Demurrage tick fires once per period, not on every render

## Notes

- "Calm motion for slow systems" is the most important principle here. Governance feels weighty; UI must reinforce, not undercut, that weight.
- The `epic` (480 ms) duration is rarely used — keep it for moments where the user *should* pause and feel the consequence (first reward, demurrage tick, onboarding milestone).
- Do not use motion to mask latency; use skeletons + optimistic state, then animate on the data update.
