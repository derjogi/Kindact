# Kindact Website — Technical Specification

*Interactive documentation site to showcase the Kindact governance platform*

---

## 1. Goals & Success Criteria

### Primary Goals
1. **Convince academics/experts** that Kindact is feasible and intellectually rigorous
2. **Attract collaborators** (developers, funders, advisors, researchers)
3. **Explain complex concepts** accessibly without oversimplifying

### Success Metrics
- Visitor reaches contact section (scroll depth)
- Contact form submissions
- Time on site > 3 minutes (engagement with content)

---

## 2. Target Audience

| Audience | What They Care About | Content Focus |
|----------|---------------------|---------------|
| Academic researchers | Rigor, citations, mechanism design | Economics deep dive, voting theory, references |
| Potential funders | Feasibility, team, roadmap | Vision, challenges addressed honestly, contact |
| Technical contributors | Architecture, stack, contribution path | Tech section, open-source plans |
| General curious visitors | "What is this and why should I care?" | Hero, problem statement, examples |

---

## 3. Site Structure

```
/                     → Landing page (full scrolling experience)
/economics            → Deep dive: token mechanics, demurrage, fraud prevention
/governance           → Deep dive: voting, delegation, deliberation mechanisms
/walkthrough          → Interactive example: follow an issue through the 5 steps
/about                → Vision, FAQ, team/contact
```

### Landing Page Sections (scroll-based)
1. **Hero** — Tagline + one-sentence pitch + scroll indicator
2. **The Problem** — Condensed version of challenges (collapsible by level: individual/social/national/global)
3. **The Solution** — Core philosophy ("parallel layer, not replacement")
4. **How It Works** — The 5-step cycle with interactive diagram
5. **Why It Might Work** — Key differentiators (anonymized deliberation, fluid voting, economic incentives)
6. **Explore Further** — Cards linking to deep dives
7. **Get Involved** — Contact form, collaboration CTA

---

## 4. Key Interactive Components

### 4.1 Expandable Content Blocks
- Default: concise summary (2-3 sentences)
- Expand: full explanation with details
- Use case: Different audiences explore different depths

### 4.2 The 5-Step Cycle Diagram
- Visual: Circular or linear flow diagram
- Interaction: Click/hover on each step to reveal details
- Animation: Subtle pulse or highlight on active step
- Consider: Step-through mode ("Next →") for guided exploration

### 4.3 Hypothetical Walkthrough ("/walkthrough")
A guided, interactive story:
> "Imagine your neighborhood has a plastic waste problem..."

User clicks through stages:
1. **Identify** — See the issue being created
2. **Deliberate** — Watch (simulated) comments, pro/con arguments, AI synthesis
3. **Decide** — See vote tallies, delegation in action
4. **Implement** — Proof submission, verification
5. **Reward** — Token minting, contributor recognition

Each stage: brief narration + visual mock-up of what the UI might look like

### 4.4 Token Economics Visualizer
- Interactive demurrage calculator: "If you hold 100 $CC for X months..."
- Voter-scaling chart: Show how reward caps grow with voter count
- Supply flow diagram: Minting → Circulation → Sinks (animated)

### 4.5 Scroll-Triggered Animations
- Parallax backgrounds or subtle shape movements
- Section transitions: fade-in, slide-up
- Diagrams animate into view as user scrolls to them
- Keep subtle and professional (not distracting)

---

## 5. Design Language

### Visual Style
- **Palette**: Calm, muted tones:
  - Primary: Deep teal (#2D6A6A)
  - Accent: Warm amber for CTAs (#D4A84B)
  - Background: Off-white (#F8F6F2)
  - Text: Near-black (#1A1A1A)
- **Typography**: 
  - Headings: Inter (clean sans-serif)
  - Body: System fonts for performance
- **Spacing**: Generous whitespace, breathable layout
- **Imagery**: Abstract, geometric shapes; no stock photos of people

### Tone
- Confident but not arrogant
- Honest about challenges and open questions
- Academic rigor without being dry

---

## 6. Technical Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **SvelteKit** | Fast, great DX, excellent for scroll-based interactions |
| Styling | **Tailwind CSS v4** | Rapid iteration, utility-first |
| Animations | **GSAP** | Smooth scroll-triggered animations |
| Icons | **Lucide** | Clean, professional |
| Hosting | **Vercel** | Easy SvelteKit deployment, good performance |

### Project Structure
```
website/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   ├── content/        # Structured content data
│   │   └── utils/          # Scroll utilities, helpers
│   ├── routes/
│   │   ├── +page.svelte    # Landing page
│   │   ├── +layout.svelte
│   │   ├── economics/
│   │   ├── governance/
│   │   ├── walkthrough/
│   │   └── about/
│   ├── app.css             # Global styles + Tailwind
│   └── app.html
├── static/
├── svelte.config.js
├── vite.config.ts
└── package.json
```

---

## 7. Content Migration Plan

| Source | Destination |
|--------|-------------|
| Kindact_Blog_Post.md §Introduction | Hero + Problem sections |
| Kindact_Blog_Post.md §Steps 1-5 | How It Works + deep dive pages |
| Kindact_Blog_Post.md §Challenges | About/FAQ |
| Kindact_Economics_Deep_Dive.md | /economics page |
| New content needed | Walkthrough scenario, governance deep dive |

---

## 8. Accessibility & Performance

- Semantic HTML throughout
- Reduced motion preference respected (`prefers-reduced-motion`)
- All interactive elements keyboard-accessible
- Target Lighthouse score: 90+ across all categories
- Lazy-load below-fold content

---

*Last updated: 2026-02-06*
