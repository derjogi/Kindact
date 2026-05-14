# Design System Strategy: The Civic Archive

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Civic Archive."** 

Governance is often treated as either a cold, bureaucratic machine or a hyper-minimalist abstraction. This system rejects both. Instead, we are building a digital environment that feels like a high-end, modern library: a place where information is dense but navigable, and where the aesthetic is warm, authoritative, and permanent. 

We blend the utility of **Notion**, the structural integrity of **Wikipedia**, and the community-driven density of **Reddit**. This is achieved through an editorial layout strategy that uses intentional asymmetry—such as wide margins for metadata paired with dense central content columns—to guide the eye without the need for rigid, boxed-in grids.

---

## 2. Colors & Surface Logic
The palette moves away from "digital white" (#FFFFFF) in favor of stone and cream tones to reduce eye strain and establish a tactile, paper-like quality.

### The "No-Line" Rule
To achieve a signature premium feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined through background color shifts. Use `surface_container_low` for secondary sections and `surface_container_highest` for nested interactive areas. The contrast between these tones provides all the structural clarity required without the "cheap" look of hair-line dividers.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers:
- **Level 0 (The Floor):** `surface_dim` (#d5dcd0) – Used for the furthest background layer.
- **Level 1 (The Desk):** `surface` (#fafaf5) – The main canvas for content.
- **Level 2 (The Document):** `surface_container_lowest` (#ffffff) – Used for cards or active work areas to create a "lifted" paper effect.

### The "Glass & Gradient" Rule
For floating elements (modals, popovers, or navigation bars), use Glassmorphism. Utilize a semi-transparent `surface_container` with a `backdrop-blur` of 12px-20px. 
**Signature Polish:** main CTAs or high-level status headers should use a subtle linear gradient from `primary` (#5d5f56) to `primary_dim` (#51534a) to add "soul" and depth.

---

## 3. Typography
We employ a sophisticated Serif/Sans-Serif mix to balance editorial authority with functional clarity.

- **Display & Headlines (Newsreader):** Use these for page titles and major headers. The serif typeface provides the "Wikipedia-style" credibility and a sense of history.
- **Titles & Body (Inter):** Use Inter for all functional text and long-form reading. It provides the "Notion-style" utility.
- **Metadata (Work Sans):** Labels and small technical data points use Work Sans for its high legibility at small scales.

**Editorial Hierarchy:**
- **Lead Paragraphs:** Use `title-lg` with increased line-height (1.6) to introduce complex governance topics.
- **Information Density:** For Reddit-style discussions or Wikipedia-style data tables, use `body-sm` with `primary` text colors to allow more content to sit comfortably on the screen.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not structural lines.

- **The Layering Principle:** Rather than a shadow, place a `surface_container_lowest` card on top of a `surface_container_low` section. The subtle shift in stone tones creates a natural, soft lift.
- **Ambient Shadows:** When a true floating state is required (e.g., a dropdown), use a shadow with a 24px blur, 0% spread, and an opacity of 6%. The shadow color must be a tinted version of `on_surface` (#2e342d), never pure black.
- **The Ghost Border Fallback:** If accessibility requires a container boundary, use a "Ghost Border": the `outline_variant` token at 15% opacity. It should be felt, not seen.
- **Glassmorphism:** Apply to the Global Navigation bar. Use a blur effect so the warm background tones of the content bleed through as the user scrolls, maintaining a sense of place.

---

## 5. Components

### Status Chips (The Governance Pulse)
Status is the only area where we deviate from the neutral palette. Use these for clear "Civic Health" indicators:
- **Deliberating:** `surface_container_high` with `primary` text.
- **Voting:** Blue (Custom Accent).
- **Adopted:** `tertiary` (#6e3bd8).
- **Implementing:** Amber (Custom Accent).
- **Completed:** `on_surface_variant` (#5b6159).

### Buttons
- **Primary:** Background `primary`, Text `on_primary`. Corner radius `md` (0.375rem). No shadow; use a subtle inset glow on hover.
- **Secondary:** Background `primary_container`, Text `on_primary_container`. 
- **Tertiary:** No background. Text `primary`. Use for low-emphasis actions.

### Input Fields
Abandon the 4-sided box. Use a "bottom-line only" approach or a subtle `surface_container_high` flood fill with a `sm` (0.125rem) bottom radius. Labels should use `label-md` in `on_surface_variant`.

### Lists & Activity Feeds
**Forbid the use of divider lines.** Separate list items using vertical white space (16px - 24px). For dense Wikipedia-style data, use zebra-striping with `surface` and `surface_container_low` instead of borders.

### The "Focus Panel" (Custom Component)
A layout pattern where the left side of the screen is a dense, Inter-based data column (Wikipedia style), while the right side is a wide, serif-led discussion/context area. This allows the user to control their focus between "Data" and "Deliberation."

---

## 6. Do's and Don'ts

### Do
- **Do** use `surface_container` tiers to create hierarchy.
- **Do** embrace "Breathable Density." High information density is okay as long as the margins and line-heights are generous.
- **Do** use Newsreader for any text that expresses an "opinion" or "proposal."

### Don't
- **Don't** use pure #000000 for text. Always use `on_surface` (#2e342d) to maintain the warm, organic feel.
- **Don't** use 100% opaque borders to separate content blocks.
- **Don't** use "Standard" Material Design shadows. They are too aggressive for this refined, editorial aesthetic.
- **Don't** over-round corners. Stick to `DEFAULT` (0.25rem) or `md` (0.375rem) to keep the platform feeling professional and grounded.