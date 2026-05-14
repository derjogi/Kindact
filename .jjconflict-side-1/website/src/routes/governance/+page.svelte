<script lang="ts">
	import { ExpandableSection, SectionHeading } from '$lib';
	import { MessageSquare, Vote, Users, Shield, CheckCircle, GitBranch } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Governance — Kindact</title>
	<meta
		name="description"
		content="Deep dive into Kindact's governance mechanisms: deliberation, voting, delegation, and decision-making."
	/>
</svelte:head>

<article class="max-w-4xl mx-auto px-6 py-16">
	<!-- Header -->
	<header class="mb-16">
		<p class="text-sm font-semibold uppercase tracking-wide mb-3" style="color: var(--color-primary)">
			Deep Dive
		</p>
		<h1 class="text-4xl md:text-5xl font-bold mb-6" style="color: var(--color-text)">
			Governance Mechanisms
		</h1>
		<p class="text-xl" style="color: var(--color-text-muted)">
			How decisions are made in Kindact: from structured deliberation to fluid voting, delegation,
			and beyond. These mechanisms are designed to produce legitimate outcomes while remaining
			adaptable to new information.
		</p>
	</header>

	<!-- Deliberation -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<MessageSquare size={24} />
			</div>
			<SectionHeading title="Deliberation: Bias-Adjusted Discussion" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Once an issue is created, the community engages in deliberation. This is where ideas are
			explored, refined, and tested through structured discussion.
		</p>

		<div class="p-6 rounded-xl mb-6" style="background-color: var(--color-bg-alt)">
			<h4 class="font-semibold mb-4" style="color: var(--color-text)">How Discussion Works</h4>
			<ul class="space-y-3 text-sm" style="color: var(--color-text-muted)">
				<li><strong style="color: var(--color-text)">Comments:</strong> Traditional threaded discussion where users share thoughts, ask questions, and respond to each other</li>
				<li><strong style="color: var(--color-text)">Pro/Con Arguments:</strong> Kialo-style structured arguments where users articulate supporting points and counterarguments</li>
				<li><strong style="color: var(--color-text)">Proposal Updates:</strong> Users can edit the main proposal body wiki-style, gradually refining the suggested solution(s)</li>
				<li><strong style="color: var(--color-text)">AI Summarization:</strong> AI continuously generates summaries capturing main points, key arguments, areas of consensus/disagreement, and outstanding questions</li>
			</ul>
		</div>

		<div class="space-y-4">
			<ExpandableSection title="Mechanisms to Minimize Bias" summary="Traditional social media amplifies popularity and creates echo chambers. Kindact addresses this.">
				<ul class="space-y-3 text-sm" style="color: var(--color-text-muted)">
					<li><strong style="color: var(--color-text)">Anonymization:</strong> During the ranking and display phase, comments are shown without author identities. This reduces "signaling" behavior and forces evaluation by merit.</li>
					<li><strong style="color: var(--color-text)">Randomized Display:</strong> Comments are shown based on a mix of factors (some randomness, some outlier detection, some upvotes) rather than pure popularity. You encounter perspectives you might not naturally seek out.</li>
					<li><strong style="color: var(--color-text)">Wikipedia-Style Evolution:</strong> The proposal body evolves collaboratively, with AI ensuring changes reflect collective understanding rather than individual agendas.</li>
				</ul>
			</ExpandableSection>

			<ExpandableSection title="The Role of Anonymity" summary="When you can't see who's posting, you can't dismiss ideas based on who holds them.">
				<p class="text-sm mb-4" style="color: var(--color-text-muted)">
					Kindact's anonymized discussion mechanisms are designed specifically to bridge divides. In polarized times, ideological labels often short-circuit genuine engagement with ideas.
				</p>
				<p class="text-sm" style="color: var(--color-text-muted)">
					The anonymization is <strong style="color: var(--color-text)">not absolute</strong>. The platform can identify users if necessary (for moderation, fraud prevention, or legal compliance), but this information is segregated from the public-facing discussion layer. This maintains accountability while preserving the cognitive benefits of anonymous evaluation.
				</p>
			</ExpandableSection>

			<ExpandableSection title="Metrics and Predictions" summary="Understanding the likely impacts of different options before voting.">
				<p class="text-sm mb-4" style="color: var(--color-text-muted)">
					Each issue displays <strong style="color: var(--color-text)">metrics and predictions</strong> that estimate effects across Social and Planetary Boundaries, and economic & time requirements. This helps ensure that only net-positive issues proceed to voting.
				</p>
				<h5 class="font-semibold text-sm mb-2" style="color: var(--color-text)">Sources of Metric Data:</h5>
				<ul class="space-y-1 text-sm" style="color: var(--color-text-muted)">
					<li>• <strong style="color: var(--color-text)">AI Estimation:</strong> Machine learning models trained on relevant data</li>
					<li>• <strong style="color: var(--color-text)">Prediction Markets:</strong> Community-based forecasting on likely outcomes</li>
					<li>• <strong style="color: var(--color-text)">User & Expert Input:</strong> Specialists can contribute informed estimates</li>
					<li>• <strong style="color: var(--color-text)">User Flagging:</strong> Community members can mark estimates as disputed</li>
				</ul>
			</ExpandableSection>
		</div>
	</section>

	<!-- Voting -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Vote size={24} />
			</div>
			<SectionHeading title="Voting: Fluid and Ongoing" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Most political systems have a single moment of voting. Kindact uses <strong style="color: var(--color-text)">fluid, ongoing voting</strong> where decisions are never truly "final." Votes can be changed at any time, delegations can be revoked, and as new information emerges, the community's position can evolve.
		</p>

		<div class="grid md:grid-cols-2 gap-4 mb-6">
			<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
				<h4 class="font-semibold mb-2" style="color: var(--color-text)">Voting Requirements</h4>
				<ul class="space-y-2 text-sm" style="color: var(--color-text-muted)">
					<li>• Voting only permitted after metrics are determined</li>
					<li>• Overall outcome must be positive</li>
					<li>• Negative effects must fall within acceptable thresholds</li>
					<li>• Thresholds defined collaboratively by community</li>
				</ul>
			</div>
			<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
				<h4 class="font-semibold mb-2" style="color: var(--color-text)">Legitimacy Model</h4>
				<p class="text-sm" style="color: var(--color-text-muted)">
					<strong style="color: var(--color-text)">Low turnout doesn't mean low legitimacy.</strong> If few engage, it may indicate "silent agreement." The system remains legitimate because turnout can spike when controversial issues arise.
				</p>
			</div>
		</div>

		<ExpandableSection title="Conviction Mechanism" summary="Balancing fluidity with stability—preventing constant upheaval while allowing course corrections.">
			<p class="text-sm mb-4" style="color: var(--color-text-muted)">
				The longer a decision remains uncontested, the more <strong style="color: var(--color-text)">"conviction"</strong> it accumulates, making reversals progressively harder.
			</p>
			<p class="text-sm" style="color: var(--color-text-muted)">
				Reversing direction is also less painful than in traditional systems. Implementers receive rewards for verified work along the way, so pivoting doesn't mean total loss. Major reversals would typically follow genuine new information: a flood, a technological breakthrough, updated scientific consensus.
			</p>
		</ExpandableSection>
	</section>

	<!-- Delegation -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<GitBranch size={24} />
			</div>
			<SectionHeading title="Delegated Voting (Liquid Democracy)" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Kindact doesn't require everyone to participate in every decision. Instead, it offers <strong style="color: var(--color-text)">delegated voting</strong>: the ability to delegate your vote on specific topics to someone you trust.
		</p>

		<div class="p-6 rounded-xl" style="background-color: var(--color-bg-alt)">
			<h4 class="font-semibold mb-4" style="color: var(--color-text)">Key Features</h4>
			<ul class="space-y-3 text-sm" style="color: var(--color-text-muted)">
				<li><strong style="color: var(--color-text)">Topic-specific:</strong> Delegate differently for different issue categories (environment, technology, local community)</li>
				<li><strong style="color: var(--color-text)">Always revocable:</strong> If your delegate votes in ways you disagree with, take back your voting power instantly</li>
				<li><strong style="color: var(--color-text)">Dynamic influence:</strong> "Experts" can accumulate influence through demonstrated judgment, but never lock in permanent power</li>
				<li><strong style="color: var(--color-text)">Transitive optional:</strong> Delegates can further delegate, creating chains of trust (configurable)</li>
			</ul>
		</div>
	</section>

	<!-- Consensus -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Users size={24} />
			</div>
			<SectionHeading title="Beyond Voting: Consensus and Iteration" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			The principle of "one person, one vote" is important for legitimate decision-making, but <strong style="color: var(--color-text)">voting is only one part</strong> of Kindact's toolkit.
		</p>

		<div class="grid md:grid-cols-2 gap-4">
			<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
				<h4 class="font-semibold mb-2" style="color: var(--color-text)">Voting Mode</h4>
				<p class="text-sm" style="color: var(--color-text-muted)">
					Best for clear yes/no decisions, resource allocation, or when speed matters more than perfect consensus.
				</p>
			</div>
			<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
				<h4 class="font-semibold mb-2" style="color: var(--color-text)">Consensus Mode</h4>
				<p class="text-sm" style="color: var(--color-text-muted)">
					Iterate on proposals until dissenting voices are heard and addressed. Best for complex issues where buy-in matters.
				</p>
			</div>
		</div>
	</section>

	<!-- Competence Verification -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<CheckCircle size={24} />
			</div>
			<SectionHeading title="Competence Verification" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Before voting on an issue, users must pass a <strong style="color: var(--color-text)">basic eligibility test</strong>. This is designed to be inclusive while ensuring informed participation.
		</p>

		<div class="p-6 rounded-xl mb-6" style="background-color: var(--color-bg-alt)">
			<h4 class="font-semibold mb-4" style="color: var(--color-text)">Test Goals</h4>
			<ul class="space-y-2 text-sm" style="color: var(--color-text-muted)">
				<li>• Ensure voters are informed to a basic degree regarding the issue</li>
				<li>• Include only stakeholders (could be "everyone" for global issues, or a small group for local ones)</li>
				<li>• Keep the test easy enough that it doesn't exclude legitimate participants</li>
				<li>• Ensure decisions reflect those most affected while preventing outside interference</li>
			</ul>
		</div>

		<ExpandableSection title="How the Test Works" summary="Two components: understanding check + relevance check.">
			<div class="space-y-4 text-sm" style="color: var(--color-text-muted)">
				<div>
					<h5 class="font-semibold mb-1" style="color: var(--color-text)">1. Understanding Check</h5>
					<p>A few simple questions about the issue summary (true/false, multiple choice) to confirm the voter understands what's being decided—<em>not</em> what their opinion is.</p>
				</div>
				<div>
					<h5 class="font-semibold mb-1" style="color: var(--color-text)">2. Relevance Check</h5>
					<p>If the user's profile shows a clear connection (they live in the affected area, work in a related field), they're admitted automatically. Otherwise, they briefly explain their stake.</p>
				</div>
				<p class="mt-4 p-4 rounded-lg" style="background-color: var(--color-bg)">
					<strong style="color: var(--color-text)">Example:</strong> A climate scientist can vote on a local emissions policy even if they live elsewhere. A resident can vote even without specialized knowledge. The test filters out drive-by voting while keeping the barrier low.
				</p>
			</div>
		</ExpandableSection>

		<div class="mt-6 p-5 rounded-xl border" style="border-color: var(--color-accent); background-color: rgba(212, 168, 75, 0.1)">
			<h4 class="font-semibold mb-2" style="color: var(--color-text)">A Note on Controversy</h4>
			<p class="text-sm" style="color: var(--color-text-muted)">
				Having an "eligibility test" might be controversial, especially for those growing up in democracies where "everyone gets a vote" is a core value. The test is designed to be fairly inclusive—nobody who really wants to participate should be excluded. As with almost all mechanisms on this platform, the community can vote to modify or abolish it.
			</p>
		</div>
	</section>

	<!-- Self-Governance -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Shield size={24} />
			</div>
			<SectionHeading title="Self-Governance" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			Crucially, <strong style="color: var(--color-text)">the platform governs itself through the same mechanisms</strong>. Changes to voting thresholds, eligibility tests, token economics, or any other rule follow the same issue-based process.
		</p>

		<div class="grid md:grid-cols-2 gap-4">
			<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
				<h4 class="font-semibold mb-2" style="color: var(--color-text)">Regular Changes</h4>
				<p class="text-sm" style="color: var(--color-text-muted)">
					Standard deliberation and voting. Simple majority or configured threshold.
				</p>
			</div>
			<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
				<h4 class="font-semibold mb-2" style="color: var(--color-text)">Constitutional Changes</h4>
				<p class="text-sm" style="color: var(--color-text-muted)">
					Core principles (like one-person-one-vote or open-source requirements) demand supermajority quorums of total users, making them more robust.
				</p>
			</div>
		</div>
	</section>

	<!-- Conclusion -->
	<section class="p-8 rounded-xl" style="background-color: var(--color-bg-alt)">
		<h2 class="text-2xl font-bold mb-4" style="color: var(--color-text)">Design Principles</h2>
		<ul class="space-y-3" style="color: var(--color-text-muted)">
			<li><strong style="color: var(--color-text)">Evaluate ideas, not identities:</strong> Anonymization forces engagement with substance.</li>
			<li><strong style="color: var(--color-text)">Decisions can evolve:</strong> Fluid voting mirrors how understanding actually works.</li>
			<li><strong style="color: var(--color-text)">Expertise without gatekeeping:</strong> Delegation lets knowledge flow without creating permanent hierarchies.</li>
			<li><strong style="color: var(--color-text)">Informed participation:</strong> Competence verification ensures quality without exclusion.</li>
			<li><strong style="color: var(--color-text)">Self-governing:</strong> The system can modify itself through its own processes.</li>
		</ul>
	</section>
</article>
