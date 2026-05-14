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
    boundaries: [
      { label: "Freshwater", icon: "💧", direction: "improve", delta: "+8%", confidence: "medium" },
      { label: "Health", icon: "❤️", direction: "improve", delta: "+3%", confidence: "medium" },
      { label: "Resource use", icon: "⛏️", direction: "regress", delta: "-2%", confidence: "low" },
      { label: "Social equity", icon: "⚖️", direction: "neutral", delta: "0%", confidence: "low" },
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
    boundaries: [
      { label: "Energy", icon: "⚡", direction: "improve", delta: "+12%", confidence: "high" },
      { label: "Climate", icon: "🌡️", direction: "improve", delta: "+6%", confidence: "high" },
      { label: "Resource use", icon: "⛏️", direction: "regress", delta: "-4%", confidence: "medium" },
      { label: "Social equity", icon: "⚖️", direction: "improve", delta: "+3%", confidence: "medium" },
      { label: "Economy", icon: "💰", direction: "improve", delta: "+5%", confidence: "medium" },
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
    boundaries: [
      { label: "Land use", icon: "🌍", direction: "improve", delta: "+5%", confidence: "medium" },
      { label: "Pollution", icon: "🏭", direction: "improve", delta: "+9%", confidence: "high" },
      { label: "Economy", icon: "💰", direction: "regress", delta: "-3%", confidence: "low" },
      { label: "Health", icon: "❤️", direction: "improve", delta: "+2%", confidence: "low" },
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
    boundaries: [
      { label: "Social equity", icon: "⚖️", direction: "improve", delta: "+4%", confidence: "medium" },
      { label: "Knowledge", icon: "📚", direction: "improve", delta: "+7%", confidence: "high" },
      { label: "Economy", icon: "💰", direction: "neutral", delta: "0%", confidence: "low" },
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
    boundaries: [
      { label: "Food", icon: "🌾", direction: "improve", delta: "+6%", confidence: "high" },
      { label: "Community", icon: "🤝", direction: "improve", delta: "+10%", confidence: "high" },
      { label: "Biodiversity", icon: "🦋", direction: "improve", delta: "+3%", confidence: "medium" },
      { label: "Land use", icon: "🌍", direction: "regress", delta: "-1%", confidence: "high" },
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
    participants: 94,
    createdAt: "2026-03-08",
    metrics: [
      { label: "Cost", value: "~$200,000", confidence: "low" },
      { label: "Time", value: "12 months", confidence: "low" },
    ],
    boundaries: [
      { label: "Health", icon: "❤️", direction: "improve", delta: "+7%", confidence: "medium" },
      { label: "Climate", icon: "🌡️", direction: "improve", delta: "+4%", confidence: "medium" },
      { label: "Air quality", icon: "🌬️", direction: "improve", delta: "+5%", confidence: "medium" },
      { label: "Economy", icon: "💰", direction: "regress", delta: "-6%", confidence: "low" },
    ],
    aiSummary: `Safety concerns dominate: Main & 5th intersection cited as most dangerous with 4 accidents this year. School zone routes lack any protected infrastructure, affecting families at Elm Elementary.

Protected vs painted lanes is the central tradeoff: personal accounts of dooring incidents on narrow painted lanes drive consensus that paint alone is inadequate. Budget math shows ~2.5km protected vs 8km painted at $200k — a hybrid approach covering dangerous segments first is gaining support.

Cost realism is a key theme: domain experts including a civil engineer flag the $200k estimate as unrealistic, suggesting $300-500k. The Oak Ave project's $85k for 1.2km (painted) supports higher projections. Community wants revised estimates before any vote.

Equity gap identified: west side neighborhoods have zero bike infrastructure while east side has the riverside path. Survey data inherently biased toward areas with existing lanes, underrepresenting demand where cycling is currently too dangerous.

Quick-win momentum: temporary flex-post bollards at Main & 5th proposed as a fast-track separate issue — under $2k, installable in a week, though requiring traffic study and council approval (6-week minimum). Seen as a way to demonstrate protected infrastructure benefits.`,
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
        quotedText: "Cyclists must merge with car traffic at the most dangerous intersections",
        sourceType: "description",
        quoteStart: 95,
        quoteEnd: 167,
      },
      {
        id: "c31",
        alias: "Otter",
        emoji: "🦦",
        text: "I bike commute daily on the River Road segment. Last month a delivery truck doored me because the painted lane is only 3 feet wide. Protected lanes or nothing — paint is not infrastructure.",
        createdAt: "5h ago",
        parentId: null,
        upvotes: 41,
        downvotes: 2,
        quotedText: "protected bike lanes to connect existing segments",
        sourceType: "description",
        quoteStart: 199,
        quoteEnd: 249,
      },
      {
        id: "c31a",
        alias: "Fox",
        emoji: "🦊",
        text: "Glad you're okay. This is exactly why the survey data matters — the top 3 near-miss locations are all painted-lane segments. Protected bollards would have prevented every one.",
        createdAt: "4h ago",
        parentId: "c31",
        upvotes: 19,
        downvotes: 0,
        stance: "pro",
      },
      {
        id: "c31b",
        alias: "Deer",
        emoji: "🦌",
        text: "Protected lanes cost roughly 3x more per km than painted ones. With a $200k budget we can do 8km painted or maybe 2.5km protected. That's a real tradeoff.",
        createdAt: "3h ago",
        parentId: "c31",
        upvotes: 14,
        downvotes: 5,
        stance: "con",
      },
      {
        id: "c31c",
        alias: "Otter",
        emoji: "🦦",
        text: "2.5km of protected lane that people actually use > 8km of painted lane that parents won't let their kids ride on. Utilization data from other cities backs this up consistently.",
        createdAt: "2h ago",
        parentId: "c31b",
        upvotes: 22,
        downvotes: 3,
        stance: "con",
      },
      {
        id: "c31d",
        alias: "Crane",
        emoji: "🦩",
        text: "Could we do a hybrid? Protected on the 3 most dangerous segments, painted on the rest to complete the network? Best of both worlds.",
        createdAt: "1h ago",
        parentId: "c31b",
        upvotes: 27,
        downvotes: 1,
      },
      {
        id: "c32",
        alias: "Wolf",
        emoji: "🐺",
        text: "Unpopular opinion: the $200k cost estimate is fantasy. The city's own bike lane on Oak Ave (1.2km, painted) came in at $85k after permits, traffic studies, and change orders. Scale that to 8km and you're looking at $400k+.",
        createdAt: "5h ago",
        parentId: null,
        upvotes: 18,
        downvotes: 4,
      },
      {
        id: "c32a",
        alias: "Bear",
        emoji: "🐻",
        text: "The Oak Ave project was a mess because they redesigned mid-construction. A properly scoped project shouldn't have those overruns. But yes, the estimate needs more rigor — we should get actual contractor bids before voting.",
        createdAt: "4h ago",
        parentId: "c32",
        upvotes: 15,
        downvotes: 0,
        stance: "pro",
      },
      {
        id: "c32b",
        alias: "Hedgehog",
        emoji: "🦔",
        text: "I work in civil engineering. $200k for 8km is unrealistic even for paint-only. Realistic range is $300-500k depending on intersection treatments. Happy to help refine the estimate if there's interest.",
        createdAt: "3h ago",
        parentId: "c32",
        upvotes: 24,
        downvotes: 0,
        stance: "pro",
      },
      {
        id: "c32c",
        alias: "Wolf",
        emoji: "🐺",
        text: "That would be really valuable. Can the proposal be updated with your input before it goes to vote? Voting on a number everyone knows is wrong seems counterproductive.",
        createdAt: "2h ago",
        parentId: "c32b",
        upvotes: 16,
        downvotes: 0,
        stance: "pro",
      },
      {
        id: "c33",
        alias: "Turtle",
        emoji: "🐢",
        text: "What happens to street parking? The stretch on College Ave between 2nd and 4th currently has 40 parking spots. A protected lane would eliminate most of them. The businesses there are already struggling.",
        createdAt: "4h ago",
        parentId: null,
        upvotes: 12,
        downvotes: 7,
      },
      {
        id: "c33a",
        alias: "Panda",
        emoji: "🐼",
        text: "Studies from NYC and Montreal show that businesses on streets that got bike lanes saw 10-30% *increase* in retail sales. Cyclists stop more often than drivers. The parking concern sounds intuitive but the data says otherwise.",
        createdAt: "3h ago",
        parentId: "c33",
        upvotes: 20,
        downvotes: 4,
        stance: "con",
      },
      {
        id: "c33b",
        alias: "Turtle",
        emoji: "🐢",
        text: "Those are big cities with transit alternatives. We don't have a subway. People here drive because they have to, not because they want to. Removing parking without providing alternatives is just punishing them.",
        createdAt: "2h ago",
        parentId: "c33a",
        upvotes: 9,
        downvotes: 6,
        stance: "con",
      },
      {
        id: "c33c",
        alias: "Dolphin",
        emoji: "🐬",
        text: "The municipal lot on 3rd is half-empty most days and it's a 2-minute walk from College Ave. We could make it free for the first 2 hours as a compromise.",
        createdAt: "1h ago",
        parentId: "c33b",
        upvotes: 17,
        downvotes: 1,
        stance: "con",
      },
      {
        id: "c34",
        alias: "Salamander",
        emoji: "🦎",
        text: "I'm a parent of two kids at Elm Elementary. Right now there is no safe bike route to the school — my 10-year-old has to ride on a road with 40mph traffic. This isn't just about commuters, it's about whether our kids can get to school safely.",
        createdAt: "3h ago",
        parentId: null,
        upvotes: 35,
        downvotes: 0,
        quotedText: "Priority routes identified by cyclist survey data",
        sourceType: "description",
        quoteStart: 263,
        quoteEnd: 313,
      },
      {
        id: "c34a",
        alias: "Hawk",
        emoji: "🦅",
        text: "This is the strongest argument for prioritizing by safety rather than usage. The school zone segments aren't high-traffic for adult cyclists, but they're the ones where the consequences of no infrastructure are worst.",
        createdAt: "2h ago",
        parentId: "c34",
        upvotes: 21,
        downvotes: 0,
        stance: "pro",
      },
      {
        id: "c34b",
        alias: "Rabbit",
        emoji: "🐰",
        text: "Elm Elementary, Riverside Middle, and the community center are all within a 2km corridor. One protected route connecting those three would serve a huge number of families.",
        createdAt: "1h ago",
        parentId: "c34",
        upvotes: 18,
        downvotes: 0,
        stance: "pro",
      },
      {
        id: "c35",
        alias: "Badger",
        emoji: "🦡",
        text: "Has anyone looked at the equity angle? The west side neighborhoods (lower income) have zero bike infrastructure while the east side already has the riverside path. This project should prioritize closing that gap.",
        createdAt: "2h ago",
        parentId: null,
        upvotes: 14,
        downvotes: 2,
      },
      {
        id: "c35a",
        alias: "Owl",
        emoji: "🦉",
        text: "Great point. The cyclist survey data we're using for route prioritization is inherently biased — it captures where people bike *now*, which skews toward neighborhoods that already have some infrastructure. The west side is underrepresented because it's too dangerous to bike there, not because nobody wants to.",
        createdAt: "1h ago",
        parentId: "c35",
        upvotes: 19,
        downvotes: 1,
        stance: "pro",
      },
      {
        id: "c36",
        alias: "Heron",
        emoji: "🪶",
        text: "Can we get a temporary sandbag — sorry, wrong issue. What I meant to say: can we get temporary flex-post protection on the worst intersections while we deliberate on the full plan? Main & 5th could have bollards installed for under $2k in a week.",
        createdAt: "1h ago",
        parentId: null,
        upvotes: 30,
        downvotes: 2,
      },
      {
        id: "c36a",
        alias: "Bear",
        emoji: "🐻",
        text: "Love this. Quick wins build momentum and show the community what protected infrastructure feels like. The full project doesn't have to be all-or-nothing.",
        createdAt: "45m ago",
        parentId: "c36",
        upvotes: 16,
        downvotes: 0,
        stance: "pro",
      },
      {
        id: "c36b",
        alias: "Hedgehog",
        emoji: "🦔",
        text: "Flex posts at Main & 5th would require a traffic study and city council approval. Minimum 6 weeks. But it's absolutely the right idea — should be a separate fast-track issue.",
        createdAt: "30m ago",
        parentId: "c36",
        upvotes: 11,
        downvotes: 0,
        stance: "pro",
      },
    ],
    arguments: [
      {
        id: "a30",
        text: "Prioritize by safety: most dangerous intersections first, even if they're not the highest-traffic segments",
        type: "pro",
        parentId: null,
        alias: "Hawk",
        emoji: "🦅",
      },
      {
        id: "a31",
        text: "Prioritize by usage: connect the most-ridden segments first to maximize the number of people who benefit immediately",
        type: "pro",
        parentId: null,
        alias: "Fox",
        emoji: "🦊",
      },
      {
        id: "a31a",
        text: "Usage data is biased toward neighborhoods that already have infrastructure — prioritizing by current usage reinforces existing inequity",
        type: "con",
        parentId: "a31",
        alias: "Owl",
        emoji: "🦉",
      },
      {
        id: "a32",
        text: "Protected lanes are worth the extra cost: painted lanes don't meaningfully improve safety and don't attract new riders",
        type: "pro",
        parentId: null,
        alias: "Otter",
        emoji: "🦦",
      },
      {
        id: "a32a",
        text: "Budget only allows ~2.5km protected vs 8km painted — a fragmented protected network may be worse than a complete painted one",
        type: "con",
        parentId: "a32",
        alias: "Deer",
        emoji: "🦌",
      },
      {
        id: "a33",
        text: "The $200k cost estimate needs serious revision before this goes to vote — contractor bids should be required",
        type: "con",
        parentId: null,
        alias: "Wolf",
        emoji: "🐺",
      },
    ],
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
    boundaries: [
      { label: "Social equity", icon: "⚖️", direction: "improve", delta: "+8%", confidence: "high" },
      { label: "Knowledge", icon: "📚", direction: "improve", delta: "+6%", confidence: "high" },
      { label: "Energy", icon: "⚡", direction: "regress", delta: "-2%", confidence: "medium" },
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
    boundaries: [
      { label: "Social equity", icon: "⚖️", direction: "improve", delta: "+11%", confidence: "high" },
      { label: "Education", icon: "🎓", direction: "improve", delta: "+8%", confidence: "high" },
      { label: "Economy", icon: "💰", direction: "improve", delta: "+4%", confidence: "medium" },
      { label: "Community", icon: "🤝", direction: "improve", delta: "+6%", confidence: "high" },
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
