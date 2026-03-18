import { Issue, User } from "./types";

export const issues: Issue[] = [
  {
    id: "1",
    title: "Fix drainage on Elm Street",
    summary:
      "Recurring flooding after rain damages sidewalks and creates safety hazards for pedestrians.",
    description: `## Background

Elm Street between 3rd and 7th Avenue has experienced recurring flooding after moderate to heavy rainfall for the past three years. The existing storm drains are undersized for the current runoff volume, partly due to new construction upstream that increased impervious surface area.

## Proposed Solution

Install two additional catch basins at the low points (intersections of 4th and 6th Ave), replace the 12-inch main with 18-inch pipe, and add a bioswale along the north sidewalk to handle overflow naturally.

## Expected Outcomes

- Eliminate standing water within 2 hours of rain stopping
- Reduce sidewalk damage repair costs by ~60%
- Improve pedestrian safety (3 slip-and-fall incidents reported last year)`,
    status: "deliberating",
    scope: "local",
    tags: ["infrastructure", "safety", "environment"],
    participants: 12,
    createdAt: "2026-03-15",
    metrics: [
      { label: "Cost", value: "~$15,000", confidence: "medium" },
      { label: "Time", value: "3 months", confidence: "high" },
    ],
    aiSummary: `**Key points raised:**
- Broad agreement that drainage is inadequate and needs fixing
- Debate over whether bioswale (natural) or purely engineered solution is better
- Concern about disruption to traffic during construction

**Areas of consensus:**
- The problem is real and getting worse each year
- North side of street is the worst-affected area

**Open questions:**
- Should the project include permeable pavement on sidewalks?
- Who bears cost — city budget or community fund?`,
    comments: [
      {
        id: "c1",
        alias: "Owl",
        emoji: "🦉",
        text: "The current drainage plan doesn't account for the slope on the north side of the street.",
        createdAt: "2h ago",
        parentId: null,
        upvotes: 12,
        downvotes: 2,
      },
      {
        id: "c2",
        alias: "Fox",
        emoji: "🦊",
        text: "Good point — the 2019 survey shows a 4% grade there. The bioswale design should account for that.",
        createdAt: "1h ago",
        parentId: "c1",
        upvotes: 8,
        downvotes: 0,
      },
      {
        id: "c3",
        alias: "Bear",
        emoji: "🐻",
        text: "We should consider permeable pavement instead of just pipes. It handles runoff at the source.",
        createdAt: "5h ago",
        parentId: null,
        upvotes: 15,
        downvotes: 3,
        stance: "pro",
      },
      {
        id: "c4",
        alias: "Deer",
        emoji: "🦌",
        text: "Permeable pavement is expensive and needs regular maintenance. The pipes are proven technology.",
        createdAt: "4h ago",
        parentId: "c3",
        upvotes: 6,
        downvotes: 1,
        stance: "con",
      },
      {
        id: "c5",
        alias: "Rabbit",
        emoji: "🐰",
        text: "Has anyone contacted the city engineer? They did a study on this exact block in 2022.",
        createdAt: "3h ago",
        parentId: null,
        upvotes: 20,
        downvotes: 0,
      },
    ],
    arguments: [
      {
        id: "a1",
        text: "Bioswale approach is cheaper long-term and provides environmental co-benefits",
        type: "pro",
        parentId: null,
        alias: "Bear",
        emoji: "🐻",
      },
      {
        id: "a2",
        text: "Bioswale requires ongoing maintenance that may not be funded",
        type: "con",
        parentId: "a1",
        alias: "Deer",
        emoji: "🦌",
      },
      {
        id: "a3",
        text: "Engineered solution (pipes) has a 50-year track record in this climate",
        type: "pro",
        parentId: null,
        alias: "Deer",
        emoji: "🦌",
      },
      {
        id: "a4",
        text: "Permeable pavement at sidewalks would reduce total runoff by 30%",
        type: "pro",
        parentId: null,
        alias: "Fox",
        emoji: "🦊",
      },
    ],
    votesTally: { approve: 0, reject: 0 },
    rewardIntent: "500 $CC per milestone",
  },
  {
    id: "2",
    title: "Community solar panel program",
    summary:
      "Install solar panels on public buildings and share the energy savings with the community.",
    description: `## Background

Energy costs have risen 22% in the past two years. Several public buildings (library, community center, town hall) have large south-facing roofs that are ideal for solar installation.

## Proposed Solution

A community-owned solar cooperative that installs panels on public roofs, sells power back to the grid, and distributes savings as credits to participating households.

## Expected Outcomes

- 15% reduction in energy costs for participating households
- 200 tons of CO₂ avoided per year
- Revenue-positive within 4 years`,
    status: "vote-ready",
    scope: "national",
    tags: ["energy", "climate", "economics"],
    participants: 87,
    createdAt: "2026-03-10",
    metrics: [
      { label: "Cost", value: "~$120,000", confidence: "high" },
      { label: "Time", value: "8 months", confidence: "medium" },
    ],
    aiSummary: `**Key points raised:**
- Strong support for the concept; debate mostly around financial model
- Concern about maintenance responsibility and long-term ownership
- Some want to prioritize low-income households for credits

**Areas of consensus:**
- Solar on public buildings is a net positive
- Community ownership preferred over corporate lease

**Open questions:**
- Credit distribution: equal per household or proportional to need?
- Insurance and liability for rooftop installations`,
    comments: [
      {
        id: "c10",
        alias: "Eagle",
        emoji: "🦅",
        text: "The cooperative model worked well in Burlington, VT. We should study their structure.",
        createdAt: "2d ago",
        parentId: null,
        upvotes: 34,
        downvotes: 2,
      },
      {
        id: "c11",
        alias: "Dolphin",
        emoji: "🐬",
        text: "Low-income households should get priority access to credits. Otherwise this just benefits homeowners.",
        createdAt: "1d ago",
        parentId: null,
        upvotes: 45,
        downvotes: 8,
        stance: "pro",
      },
    ],
    arguments: [
      {
        id: "a10",
        text: "Community ownership ensures long-term local benefit vs corporate lease",
        type: "pro",
        parentId: null,
        alias: "Eagle",
        emoji: "🦅",
      },
      {
        id: "a11",
        text: "High upfront cost may strain the community fund",
        type: "con",
        parentId: null,
        alias: "Turtle",
        emoji: "🐢",
      },
    ],
    votesTally: { approve: 68, reject: 14 },
    rewardIntent: "2000 $CC per phase",
  },
  {
    id: "3",
    title: "Reduce packaging waste citywide",
    summary:
      "Implement a reusable packaging program for local businesses to cut single-use waste by 50%.",
    description: `## Background

The city produces 12,000 tons of packaging waste annually. A pilot with 5 restaurants showed reusable container programs can reduce waste by 60% with modest cost.

## Proposed Solution

Expand the pilot to all food service businesses with a city-supported container washing facility and deposit system.`,
    status: "deliberating",
    scope: "local",
    tags: ["environment", "waste", "business"],
    participants: 24,
    createdAt: "2026-03-12",
    metrics: [
      { label: "Cost", value: "~$45,000", confidence: "low" },
      { label: "Time", value: "6 months", confidence: "medium" },
    ],
    aiSummary: `**Key points:** Pilot data is promising but scaling challenges remain. Business owners concerned about cost burden. Environmental benefits are clear.

**Open questions:** Who funds the washing facility? Voluntary or mandatory participation?`,
    comments: [
      {
        id: "c20",
        alias: "Panda",
        emoji: "🐼",
        text: "The pilot restaurants reported 15% increase in customer satisfaction. People like reusables!",
        createdAt: "1d ago",
        parentId: null,
        upvotes: 18,
        downvotes: 1,
      },
    ],
    arguments: [],
    votesTally: { approve: 0, reject: 0 },
    rewardIntent: "300 $CC per milestone",
  },
  {
    id: "4",
    title: "Open-source AI safety research fund",
    summary:
      "Create a community fund to support open-source AI safety research that benefits everyone.",
    description: `## Background

AI capabilities are advancing rapidly while safety research is underfunded and often locked behind corporate walls. Open-source safety tools benefit the entire ecosystem.

## Proposed Solution

A Kindact-managed fund that accepts proposals for open-source AI safety research, with community voting on allocation and milestone-based payouts.`,
    status: "adopted",
    scope: "global",
    tags: ["AI", "safety", "research", "open-source"],
    participants: 156,
    createdAt: "2026-02-20",
    metrics: [
      { label: "Cost", value: "~$50,000/year", confidence: "medium" },
      { label: "Time", value: "Ongoing", confidence: "high" },
    ],
    aiSummary: `**Consensus:** Strong support for open-source AI safety. Fund structure approved. First research proposals being accepted.`,
    comments: [],
    arguments: [],
    votesTally: { approve: 132, reject: 18 },
    rewardIntent: "Variable per proposal",
  },
  {
    id: "5",
    title: "Community garden on vacant lot (Oak & 3rd)",
    summary:
      "Transform the vacant lot at Oak and 3rd into a community garden with 30 plots.",
    description: `## Background

The lot has been vacant for 5 years. Neighbors have expressed interest in a community garden. The city has indicated willingness to lease the land for $1/year.

## Proposed Solution

Clear the lot, install raised beds, water access, a tool shed, and a small gathering area. Plots allocated by lottery with priority for adjacent residents.`,
    status: "implementing",
    scope: "local",
    tags: ["community", "food", "green-space"],
    participants: 42,
    createdAt: "2026-01-15",
    metrics: [
      { label: "Cost", value: "~$8,000", confidence: "high" },
      { label: "Time", value: "2 months", confidence: "high" },
    ],
    aiSummary: `**Status:** Approved and under construction. 20 of 30 beds installed. Water connection complete. Tool shed in progress.`,
    comments: [],
    arguments: [],
    votesTally: { approve: 38, reject: 2 },
    rewardIntent: "200 $CC per work day",
  },
  {
    id: "6",
    title: "Bike lane network expansion",
    summary:
      "Connect existing bike lanes into a coherent network covering all major routes.",
    description: `## Background

The city has 12km of bike lanes but they're disconnected fragments. Cyclists must merge with car traffic at the most dangerous intersections.

## Proposed Solution

Add 8km of protected bike lanes to connect existing segments into a continuous network. Priority routes identified by cyclist survey data.`,
    status: "deliberating",
    scope: "local",
    tags: ["transport", "safety", "infrastructure"],
    participants: 67,
    createdAt: "2026-03-08",
    metrics: [
      { label: "Cost", value: "~$200,000", confidence: "low" },
      { label: "Time", value: "12 months", confidence: "low" },
    ],
    aiSummary: `**Key debate:** Route prioritization — should we connect the most-used segments first or the most dangerous ones? Cost estimates need refinement.`,
    comments: [
      {
        id: "c30",
        alias: "Hawk",
        emoji: "🦅",
        text: "Safety should be the priority. The intersection at Main & 5th has had 4 accidents this year.",
        createdAt: "6h ago",
        parentId: null,
        upvotes: 28,
        downvotes: 3,
      },
    ],
    arguments: [],
    votesTally: { approve: 0, reject: 0 },
    rewardIntent: "1500 $CC per segment",
  },
  {
    id: "7",
    title: "Free public Wi-Fi in town center",
    summary:
      "Provide free, high-speed public Wi-Fi across the town center and main parks.",
    description: `## Background

Many residents lack reliable internet access at home. Public spaces currently have no Wi-Fi. This creates a digital divide that affects job seeking, education, and civic participation.`,
    status: "vote-ready",
    scope: "local",
    tags: ["digital-access", "equity", "infrastructure"],
    participants: 31,
    createdAt: "2026-03-05",
    metrics: [
      { label: "Cost", value: "~$25,000", confidence: "high" },
      { label: "Time", value: "2 months", confidence: "high" },
    ],
    aiSummary: `**Consensus:** Broad support. Main concern is ongoing maintenance costs and privacy of usage data.`,
    comments: [],
    arguments: [],
    votesTally: { approve: 24, reject: 5 },
    rewardIntent: "800 $CC total",
  },
  {
    id: "8",
    title: "Mentorship program for young adults",
    summary:
      "Match experienced professionals with 18–25 year olds for career guidance and skills development.",
    description: `## Background

Youth unemployment in the region is 18%. Many young adults lack professional networks and mentorship that comes naturally to those from privileged backgrounds.`,
    status: "completed",
    scope: "local",
    tags: ["education", "youth", "equity"],
    participants: 53,
    createdAt: "2025-12-01",
    metrics: [
      { label: "Cost", value: "~$3,000", confidence: "high" },
      { label: "Time", value: "6 months (first cohort)", confidence: "high" },
    ],
    aiSummary: `**Completed:** First cohort of 15 mentor-mentee pairs. 80% of mentees reported improved confidence and career clarity. Second cohort launching.`,
    comments: [],
    arguments: [],
    votesTally: { approve: 48, reject: 3 },
    rewardIntent: "100 $CC per mentor per month",
  },
];

export const currentUser: User = {
  displayName: "You",
  balance: 142.3,
  decayRate: 1.4,
  activities: [
    {
      id: "a1",
      type: "comment",
      issueId: "1",
      issueTitle: "Fix drainage on Elm Street",
      detail: 'You commented on "Fix drainage on Elm Street"',
      createdAt: "2h ago",
    },
    {
      id: "a2",
      type: "vote",
      issueId: "2",
      issueTitle: "Community solar panel program",
      detail: 'You voted Approve on "Community solar panel program"',
      createdAt: "1d ago",
    },
    {
      id: "a3",
      type: "earned",
      issueId: "5",
      issueTitle: "Community garden on vacant lot",
      detail: "You earned 25 $CC for community garden work day",
      createdAt: "3d ago",
    },
    {
      id: "a4",
      type: "claimed",
      issueId: "5",
      issueTitle: "Community garden on vacant lot",
      detail: 'Your claim on "Community garden" was verified',
      createdAt: "3d ago",
    },
    {
      id: "a5",
      type: "vote",
      issueId: "7",
      issueTitle: "Free public Wi-Fi in town center",
      detail: 'You voted Approve on "Free public Wi-Fi"',
      createdAt: "5d ago",
    },
  ],
};

export function getIssue(id: string): Issue | undefined {
  return issues.find((i) => i.id === id);
}
