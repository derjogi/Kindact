<script lang="ts">
	import { ExpandableSection, SectionHeading, ContactForm } from '$lib';
	import { Heart, HelpCircle, Users, Mail } from 'lucide-svelte';
</script>

<svelte:head>
	<title>About — Kindact</title>
	<meta
		name="description"
		content="Learn about Kindact's vision, frequently asked questions, and how to get involved."
	/>
</svelte:head>

<article class="max-w-4xl mx-auto px-6 py-16">
	<!-- Header -->
	<header class="mb-16">
		<h1 class="text-4xl md:text-5xl font-bold mb-6" style="color: var(--color-text)">
			About Kindact
		</h1>
		<p class="text-xl" style="color: var(--color-text-muted)">
			A vision in progress. We're exploring whether a better system for collective action is
			possible, and we're looking for collaborators who want to help find out.
		</p>
	</header>

	<!-- Vision -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Heart size={24} />
			</div>
			<SectionHeading title="The Vision" />
		</div>

		<div class="prose max-w-none" style="color: var(--color-text-muted)">
			<p class="text-lg mb-6">
				The name "Kindact" reflects what we're trying to build: an amalgamation of <strong style="color: var(--color-text)">"humankind acts,"</strong> <strong style="color: var(--color-text)">"kind act,"</strong> and <strong style="color: var(--color-text)">"code of conduct."</strong> It's about collective action rooted in doing good.
			</p>

			<p class="mb-6">
				We believe the institutions we inherited—representative democracies, nation-states, international treaties—were designed for a world that no longer exists. Today's challenges cross borders faster than any government can respond. Climate change, artificial intelligence, pandemics, and the breakdown of shared reality all demand new approaches to coordination.
			</p>

			<p class="mb-6">
				Kindact is an attempt to answer a deceptively simple question: <strong style="color: var(--color-text)">What if there were a system where anyone could identify problems, discuss solutions with others, vote on what should be done, and get rewarded for actually implementing the ideas that the community approves?</strong>
			</p>

			<p>
				This isn't about replacing governments or creating a utopia overnight. It's about building a <strong style="color: var(--color-text)">parallel layer</strong>: a voluntary system that operates alongside existing institutions, complementing them where they work and filling the gaps where they fail.
			</p>
		</div>
	</section>

	<!-- FAQ -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<HelpCircle size={24} />
			</div>
			<SectionHeading title="Frequently Asked Questions" />
		</div>

		<div class="space-y-4">
			<ExpandableSection title="Isn't this just another crypto project?" summary="No. The token is a tool, not the point.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					$CC exists to create incentives for real-world action, not to generate speculative returns. Tokens are only minted when community-approved work is verifiably completed. There's no pre-mine, no founder allocation, and the economic design includes mechanisms (demurrage, fees) that actively discourage hoarding. The blockchain is infrastructure, like how Wikipedia uses servers—essential but not the point.
				</p>
			</ExpandableSection>

			<ExpandableSection title="How is this different from existing DAOs?" summary="Kindact is designed for real-world collective action, not just on-chain governance.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					Most DAOs govern protocol parameters or treasury allocation. Kindact is designed to coordinate real-world action: planting trees, building community resources, caring for neighbors. The verification system, competence checks, and fluid voting mechanisms are all oriented toward bridging the gap between online consensus and physical implementation.
				</p>
			</ExpandableSection>

			<ExpandableSection title="Won't the eligibility test exclude people unfairly?" summary="The test is designed to be inclusive, not exclusive.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					The test has two components: a simple understanding check (do you know what's being decided?) and a relevance check (are you a stakeholder?). Both are designed to be easy to pass for anyone who genuinely wants to participate. A resident automatically qualifies for local issues. A domain expert automatically qualifies for their field. The goal is to filter out drive-by voting, not to create gatekeeping. And like all mechanisms in Kindact, the community can vote to modify or abolish it.
				</p>
			</ExpandableSection>

			<ExpandableSection title="What prevents wealthy actors from taking over?" summary="Multiple mechanisms limit concentration of power.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					One-person-one-vote means you can't buy more voting power. Voter-scaled reward caps mean small groups can only award small amounts regardless of their wealth. Demurrage discourages accumulation. Blockchain provenance distinguishes earned tokens from purchased ones, so buying $CC doesn't buy reputation. And verified identity prevents creating multiple accounts.
				</p>
			</ExpandableSection>

			<ExpandableSection title="How do you verify real-world implementation?" summary="Multiple verification mechanisms, none perfect but collectively robust.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					Verification uses a combination of approaches: photo/video evidence (geotagged), third-party auditors, peer confirmation, and for some work types, cryptographic proofs. Verifiers must rotate to prevent rubber-stamping. Disputes can be raised by anyone, with escalating community review. No single mechanism is foolproof, but gaming the system requires coordinated fraud that becomes increasingly difficult and detectable at scale.
				</p>
			</ExpandableSection>

			<ExpandableSection title="What happens if decisions get reversed mid-implementation?" summary="The conviction mechanism prevents constant upheaval.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					Fluid voting doesn't mean chaos. The conviction mechanism means decisions that remain uncontested accumulate stability over time. Reversal becomes progressively harder. And crucially, implementers receive rewards for verified work along the way—so pivoting doesn't mean losing everything. Major reversals would typically follow genuine new information, not whims.
				</p>
			</ExpandableSection>

			<ExpandableSection title="Is this legal?" summary="It depends on jurisdiction, and we're still researching.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					Operating across borders with a token-based economic system raises complex legal questions. Securities regulations, money transmission requirements, and cross-border compliance all need careful analysis. This is an area where we need expert input, and we're committed to operating within legal frameworks while exploring what's possible.
				</p>
			</ExpandableSection>

			<ExpandableSection title="When will this launch?" summary="We're in the early exploration phase.">
				<p class="text-sm" style="color: var(--color-text-muted)">
					Kindact is currently a vision and a set of design documents. We're actively seeking collaborators—developers, economists, governance researchers, community organizers—to help refine the design and build prototypes. There's no fixed launch date because we want to get this right, not just get it done.
				</p>
			</ExpandableSection>
		</div>
	</section>

	<!-- Challenges -->
	<section class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Users size={24} />
			</div>
			<SectionHeading title="Honest Challenges" />
		</div>

		<p class="mb-6" style="color: var(--color-text-muted)">
			No vision this ambitious comes without challenges. We're being upfront about what we don't yet know how to solve:
		</p>

		<div class="space-y-4">
			{#each [
				{ title: 'Bootstrapping', desc: 'How does a system like this go from zero users to meaningful influence? The classic cold-start problem applies.' },
				{ title: 'Legal Complexity', desc: 'Securities laws, money transmission, cross-border operations—these questions need expert analysis.' },
				{ title: 'Abuse Prevention', desc: 'Any reward system attracts gaming. Our fraud prevention mechanisms are a starting point, not a complete solution.' },
				{ title: 'Institutional Resistance', desc: 'Powerful interests benefit from the status quo. How does the system handle active opposition?' },
				{ title: 'Scale Dynamics', desc: 'Mechanisms that work for 100 people might break at 100,000. We need to build in adaptability.' }
			] as challenge}
				<div class="p-5 rounded-xl border" style="border-color: var(--color-border); background-color: var(--color-bg)">
					<h4 class="font-semibold mb-1" style="color: var(--color-text)">{challenge.title}</h4>
					<p class="text-sm" style="color: var(--color-text-muted)">{challenge.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Contact -->
	<section id="contact" class="mb-16">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: var(--color-primary); color: white">
				<Mail size={24} />
			</div>
			<SectionHeading title="Get Involved" />
		</div>

		<p class="mb-8" style="color: var(--color-text-muted)">
			We're looking for collaborators across many domains:
		</p>

		<div class="grid md:grid-cols-2 gap-4 mb-8">
			{#each [
				{ role: 'Developers', need: 'Help build prototypes, design architecture, write code' },
				{ role: 'Economists', need: 'Refine token economics, model incentive dynamics' },
				{ role: 'Governance Researchers', need: 'Analyze mechanisms, draw on existing literature' },
				{ role: 'Community Organizers', need: 'Think about adoption, user experience, real-world implementation' },
				{ role: 'Legal Experts', need: 'Navigate regulatory landscape, structure for compliance' },
				{ role: 'Funders', need: 'Support development, research, and early community building' }
			] as item}
				<div class="p-4 rounded-lg" style="background-color: var(--color-bg-alt)">
					<h4 class="font-semibold text-sm" style="color: var(--color-text)">{item.role}</h4>
					<p class="text-sm" style="color: var(--color-text-muted)">{item.need}</p>
				</div>
			{/each}
		</div>

		<div class="p-8 rounded-xl" style="background-color: var(--color-bg-alt)">
			<h3 class="text-xl font-bold mb-6" style="color: var(--color-text)">Send a Message</h3>
			<ContactForm />
		</div>
	</section>

	<!-- Closing -->
	<section class="text-center py-8">
		<p class="text-lg" style="color: var(--color-text-muted)">
			This is still a vision in progress. We're writing this to explore and refine that vision
			together, and to find people who want to help make it real.
		</p>
	</section>
</article>
