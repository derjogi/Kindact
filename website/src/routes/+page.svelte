<script lang="ts">
	import { ExpandableSection, Card, SectionHeading, ContactForm, ScrollReveal } from '$lib';
	import CycleDiagram from '$lib/components/CycleDiagram.svelte';
	import { problems } from '$lib/content/problems';
	import { differentiators } from '$lib/content/differentiators';
	import {
		ChevronDown,
		Coins,
		Layers,
		EyeOff,
		RefreshCw,
		Award,
		Scale,
		Play
	} from 'lucide-svelte';

	const diffIcons = {
		layers: Layers,
		'eye-off': EyeOff,
		'refresh-cw': RefreshCw,
		award: Award
	};

	const exploreCards = [
		{
			title: 'Economics',
			description: 'Deep dive into token mechanics, demurrage, and fraud prevention.',
			href: '/economics',
			icon: Coins
		},
		{
			title: 'Governance',
			description: 'Voting mechanisms, delegation, and deliberation processes.',
			href: '/governance',
			icon: Scale
		},
		{
			title: 'Walkthrough',
			description: 'Experience how Kindact works through an interactive example.',
			href: '/walkthrough',
			icon: Play
		}
	];
</script>

<svelte:head>
	<title>Kindact — A New Paradigm for Governance</title>
	<meta
		name="description"
		content="A novel systemic platform that could reshape how we solve problems together. Identify, deliberate, decide, implement, reward."
	/>
</svelte:head>

<!-- Hero Section -->
<section class="min-h-[90vh] flex flex-col items-center justify-center text-center px-6">
	<div class="max-w-4xl">
		<h1 class="text-5xl md:text-7xl font-bold mb-6" style="color: var(--color-primary)">
			Kindact
		</h1>
		<p class="text-xl md:text-2xl mb-4" style="color: var(--color-text)">
			A New Paradigm for Governance and Collective Action
		</p>
		<p class="text-lg max-w-2xl mx-auto mb-12" style="color: var(--color-text-muted)">
			What if there were a system where anyone could identify problems, discuss solutions with others, vote on
			what should be done, and get rewarded for actually implementing the ideas that the community
			approves?
		</p>
		<a
			href="#problem"
			class="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
			style="color: var(--color-text-muted)"
		>
			Learn how it works
			<ChevronDown size={16} class="animate-bounce" />
		</a>
	</div>
</section>

<!-- Problem Section -->
<section id="problem" class="py-24 px-6" style="background-color: var(--color-bg-alt)">
	<div class="max-w-4xl mx-auto">
		<ScrollReveal>
			<SectionHeading
				title="The Challenges We Face"
				subtitle="Our institutions were designed for a world that no longer exists. Today's problems cross borders faster than any government can respond."
				centered
			/>
		</ScrollReveal>

		<div class="mt-12 space-y-4">
			{#each problems as problem, i}
				<ScrollReveal delay={i * 0.1}>
					<ExpandableSection title="{problem.level}: {problem.title}" summary={problem.summary}>
						<ul class="space-y-2">
							{#each problem.details as detail}
								<li class="flex gap-3">
									<span style="color: var(--color-primary)">•</span>
									<span style="color: var(--color-text-muted)">{detail}</span>
								</li>
							{/each}
						</ul>
					</ExpandableSection>
				</ScrollReveal>
			{/each}
		</div>

		<ScrollReveal>
			<p class="mt-8 text-center text-sm" style="color: var(--color-text-muted)">
				These largely aren't partisan issues. Most people across political spectrums would agree these
				problems exist, even if they disagree on solutions.
			</p>
		</ScrollReveal>
	</div>
</section>

<!-- Solution Section -->
<section class="py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<ScrollReveal>
			<SectionHeading
				title="A Parallel Layer, Not a Replacement"
				subtitle="Kindact creates a voluntary framework that operates alongside existing institutions—complementing them where they work, filling gaps where they fail."
				centered
			/>
		</ScrollReveal>

		<div class="mt-12 grid md:grid-cols-2 gap-8">
			<ScrollReveal delay={0}>
				<div class="p-6 rounded-xl" style="background-color: var(--color-bg-alt)">
					<h3 class="text-lg font-semibold mb-3" style="color: var(--color-text)">
						What Kindact Is
					</h3>
					<ul class="space-y-2 text-sm" style="color: var(--color-text-muted)">
						<li>• An incentive layer for collective action</li>
						<li>• A voluntary system anyone can join</li>
						<li>• A platform that governs itself through its own mechanisms</li>
						<li>• Open source and community-driven</li>
					</ul>
				</div>
			</ScrollReveal>
			<ScrollReveal delay={0.15}>
				<div class="p-6 rounded-xl" style="background-color: var(--color-bg-alt)">
					<h3 class="text-lg font-semibold mb-3" style="color: var(--color-text)">
						What Kindact Is Not
					</h3>
					<ul class="space-y-2 text-sm" style="color: var(--color-text-muted)">
						<li>• Not a replacement for governments</li>
						<li>• Not an enforcement layer—it can only reward, not force compliance</li>
						<li>• Not a utopian solution, but a practical framework</li>
						<li>• Not locked to any single technology or platform</li>
					</ul>
				</div>
			</ScrollReveal>
		</div>
	</div>
</section>

<!-- How It Works Section -->
<section id="how-it-works" class="px-6" style="background-color: var(--color-bg-alt)">
	<div class="max-w-4xl mx-auto">
		<CycleDiagram />
	</div>
</section>

<!-- Why It Might Work Section -->
<section class="py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<ScrollReveal>
			<SectionHeading
				title="Why It Might Work"
				subtitle="Key design decisions that address common failure modes of collective action."
				centered
			/>
		</ScrollReveal>

		<div class="mt-12 grid md:grid-cols-2 gap-6">
			{#each differentiators as diff, i}
				{@const Icon = diffIcons[diff.icon as keyof typeof diffIcons]}
				<ScrollReveal delay={i * 0.1}>
					<div
						class="p-6 rounded-xl border"
						style="border-color: var(--color-border); background-color: var(--color-bg)"
					>
						<div class="flex items-start gap-4">
							{#if Icon}
								<div
									class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
									style="background-color: var(--color-primary); color: white"
								>
									<Icon size={20} />
								</div>
							{/if}
							<div>
								<h3 class="text-lg font-semibold mb-2" style="color: var(--color-text)">
									{diff.title}
								</h3>
								<p class="text-sm" style="color: var(--color-text-muted)">
									{diff.description}
								</p>
							</div>
						</div>
					</div>
				</ScrollReveal>
			{/each}
		</div>
	</div>
</section>

<!-- Explore Further Section -->
<section class="py-24 px-6" style="background-color: var(--color-bg-alt)">
	<div class="max-w-4xl mx-auto">
		<ScrollReveal>
			<SectionHeading
				title="Explore Further"
				subtitle="Dive deeper into specific aspects of the Kindact system."
				centered
			/>
		</ScrollReveal>

		<div class="mt-12 grid md:grid-cols-3 gap-6">
			{#each exploreCards as card, i}
				<ScrollReveal delay={i * 0.1}>
					<Card title={card.title} description={card.description} href={card.href} icon={card.icon} />
				</ScrollReveal>
			{/each}
		</div>
	</div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-24 px-6">
	<div class="max-w-2xl mx-auto">
		<ScrollReveal>
			<SectionHeading
				title="Get Involved"
				subtitle="Kindact is a vision in progress. We're looking for collaborators who want to help make it real."
				centered
			/>
		</ScrollReveal>

		<ScrollReveal delay={0.1}>
			<div class="mt-12">
				<ContactForm />
			</div>
		</ScrollReveal>

		<ScrollReveal delay={0.2}>
			<p class="mt-8 text-center text-sm" style="color: var(--color-text-muted)">
				Whether you're a developer, researcher, funder, or just someone who cares about building
				better systems for collective action—we'd love to hear from you.
			</p>
		</ScrollReveal>
	</div>
</section>
