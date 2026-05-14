<script lang="ts">
	import { SectionHeading } from '$lib';
	import {
		Search,
		MessageSquare,
		Vote,
		ClipboardCheck,
		Award,
		ChevronLeft,
		ChevronRight,
		RotateCcw,
		Sparkles,
		ThumbsUp,
		ThumbsDown,
		Camera,
		ShieldCheck,
		Coins,
		Tag,
		Users,
		ArrowRight,
		FileCheck
	} from 'lucide-svelte';

	interface Step {
		name: string;
		icon: typeof import('lucide-svelte').Icon;
		narrative: string[];
		mockTitle: string;
	}

	const steps: Step[] = [
		{
			name: 'Identify',
			icon: Search,
			narrative: [
				'Maria notices her neighborhood park is overflowing with plastic waste. Bottles pile up along the walking paths, and the creek running through the park carries trash downstream. She opens Kindact and creates an issue, describing what she sees and why it matters to the community.',
				'Within minutes, the platform\'s AI analyzes her submission. It finds similar issues that other communities have tackled successfully, surfacing their approaches so Maria and her neighbors don\'t have to start from scratch.'
			],
			mockTitle: 'New Issue'
		},
		{
			name: 'Deliberate',
			icon: MessageSquare,
			narrative: [
				'Within days, 23 neighbors have joined the discussion. Ideas range from organized cleanups to lobbying for a local plastic bag ban. Some suggest installing more trash cans, others propose a community composting program.',
				'The platform structures the conversation so it stays productive — grouping similar ideas, surfacing areas of agreement, and summarizing key points so latecomers can get up to speed without reading every comment.'
			],
			mockTitle: 'Discussion'
		},
		{
			name: 'Decide',
			icon: Vote,
			narrative: [
				'After two weeks of discussion, the community moves to a vote. The leading proposal combines the most popular ideas: monthly organized cleanups plus a permanent composting station near the park entrance. The estimated cost is measured in volunteer hours and materials.',
				'Eligible voters — residents who passed a simple relevance check confirming they live in the area — cast their votes. The result is decisive.'
			],
			mockTitle: 'Voting Results'
		},
		{
			name: 'Implement',
			icon: ClipboardCheck,
			narrative: [
				'Teams form organically. Maria takes the lead on organizing the first cleanup, while another neighbor with construction experience coordinates the composting station build. The first cleanup happens the following Saturday — 31 volunteers show up.',
				'Maria submits an implementation report through the platform, documenting what was accomplished with photos and participant counts. The work is transparent and trackable.'
			],
			mockTitle: 'Implementation Report'
		},
		{
			name: 'Reward',
			icon: Award,
			narrative: [
				'After the first month\'s verified cleanup, two things happen simultaneously: $CC tokens are minted for all contributors, and a Hypercert—a verifiable impact credential—is generated for the completed work. Maria earned 45 $CC for organizing, while volunteers earned tokens proportional to their participation.',
				'The Hypercert records exactly what was accomplished: 47 bags of waste collected, 31 volunteers, one neighborhood park restored. External buyers—impact funds, corporations needing ESG documentation, progressive governments—can purchase this Hypercert, and the proceeds flow into a reserve that backs $CC with real monetary value. More verified work means more Hypercerts, a deeper reserve, and a more stable currency for everyone.',
				'The cycle doesn\'t end here. The composting station proposal moves into its own implementation track, and new issues are already being raised by energized community members who saw the cleanup succeed.'
			],
			mockTitle: 'Rewards Distributed'
		}
	];

	let currentStep = $state(0);

	function next() {
		if (currentStep < steps.length - 1) currentStep++;
	}

	function prev() {
		if (currentStep > 0) currentStep--;
	}

	function restart() {
		currentStep = 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') next();
		else if (e.key === 'ArrowLeft') prev();
	}

	const step = $derived(steps[currentStep]);
</script>

<svelte:head>
	<title>Walkthrough — Kindact</title>
	<meta
		name="description"
		content="Experience how Kindact works through an interactive example. Follow a neighborhood plastic waste issue through the complete cycle."
	/>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<article class="max-w-4xl mx-auto px-6 py-16">
	<!-- Header -->
	<header class="mb-12 text-center">
		<h1 class="text-4xl md:text-5xl font-bold mb-4" style="color: var(--color-primary)">
			See It in Action
		</h1>
		<p class="text-lg max-w-2xl mx-auto" style="color: var(--color-text-muted)">
			Imagine your neighborhood has a plastic waste problem. Follow this hypothetical scenario to
			see how an issue flows through the Kindact cycle.
		</p>
	</header>

	<!-- Progress Bar -->
	<div class="mb-12">
		<div class="flex items-center justify-between mb-3">
			<span class="text-sm font-medium" style="color: var(--color-text-muted)">
				Step {currentStep + 1} of {steps.length}
			</span>
			<span class="text-sm font-semibold" style="color: var(--color-primary)">
				{step.name}
			</span>
		</div>
		<div class="flex gap-2">
			{#each steps as s, i}
				<button
					onclick={() => (currentStep = i)}
					class="flex-1 h-2 rounded-full transition-all duration-300"
					style="background-color: {i <= currentStep
						? 'var(--color-primary)'
						: 'var(--color-border)'}"
					aria-label="Go to step {i + 1}: {s.name}"
				></button>
			{/each}
		</div>
		<div class="flex justify-between mt-2">
			{#each steps as s, i}
				<button
					onclick={() => (currentStep = i)}
					class="text-xs transition-colors duration-200 flex-1 text-center"
					style="color: {i === currentStep
						? 'var(--color-primary)'
						: 'var(--color-text-muted)'};
						font-weight: {i === currentStep ? '600' : '400'}"
				>
					{s.name}
				</button>
			{/each}
		</div>
	</div>

	<!-- Step Content -->
	<div class="min-h-[600px]">
		{#key currentStep}
			<div class="animate-fade-in">
				<!-- Step Header -->
				<div class="flex items-center gap-4 mb-6">
					<div
						class="w-12 h-12 rounded-lg flex items-center justify-center"
						style="background-color: var(--color-primary); color: white"
					>
						<step.icon size={24} />
					</div>
					<div>
						<h2 class="text-2xl md:text-3xl font-bold" style="color: var(--color-text)">
							Step {currentStep + 1}: {step.name}
						</h2>
					</div>
				</div>

				<!-- Narrative -->
				<div class="mb-8 space-y-4">
					{#each step.narrative as paragraph}
						<p class="text-base leading-relaxed" style="color: var(--color-text-muted)">
							{paragraph}
						</p>
					{/each}
				</div>

				<!-- Mock UI Panel -->
				<div
					class="rounded-xl border overflow-hidden"
					style="border-color: var(--color-border); background-color: var(--color-bg-alt)"
				>
					<!-- Window Chrome -->
					<div
						class="flex items-center gap-2 px-4 py-3 border-b"
						style="border-color: var(--color-border); background-color: var(--color-bg)"
					>
						<div class="w-3 h-3 rounded-full" style="background-color: #ef4444"></div>
						<div class="w-3 h-3 rounded-full" style="background-color: #f59e0b"></div>
						<div class="w-3 h-3 rounded-full" style="background-color: #22c55e"></div>
						<span
							class="ml-3 text-xs font-medium"
							style="color: var(--color-text-muted)"
						>
							Kindact — {step.mockTitle}
						</span>
					</div>

					<!-- Mock Content -->
					<div class="p-6">
						{#if currentStep === 0}
							<!-- Step 1: New Issue Form -->
							<div class="space-y-4">
								<div>
									<span
										class="block text-xs font-medium mb-1"
										style="color: var(--color-text-muted)"
									>
										Issue Title
									</span>
									<div
										class="w-full px-3 py-2 rounded-lg border text-sm"
										style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text)"
									>
										Reduce Plastic Waste in Riverside Park
									</div>
								</div>
								<div>
									<span
										class="block text-xs font-medium mb-1"
										style="color: var(--color-text-muted)"
									>
										Category
									</span>
									<div class="flex gap-2">
										<span
											class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
											style="background-color: var(--color-primary); color: white"
										>
											<Tag size={12} />
											Environment
										</span>
										<span
											class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
											style="background-color: var(--color-primary); color: white"
										>
											<Tag size={12} />
											Local
										</span>
									</div>
								</div>
								<div
									class="p-4 rounded-lg border border-dashed flex items-start gap-3"
									style="border-color: var(--color-accent); background-color: color-mix(in srgb, var(--color-accent) 8%, transparent)"
								>
									<Sparkles
										size={18}
										style="color: var(--color-accent); flex-shrink: 0; margin-top: 2px"
									/>
									<div>
										<p
											class="text-xs font-semibold mb-1"
											style="color: var(--color-accent-dark)"
										>
											AI Suggestion
										</p>
										<p class="text-xs" style="color: var(--color-text-muted)">
											Similar issue found in 2 other communities — see their
											approaches
										</p>
									</div>
								</div>
							</div>
						{:else if currentStep === 1}
							<!-- Step 2: Discussion -->
							<div class="space-y-4">
								<div class="flex items-center gap-2 mb-2">
									<Users size={16} style="color: var(--color-primary)" />
									<span
										class="text-xs font-medium"
										style="color: var(--color-primary)"
									>
										23 participants
									</span>
								</div>

								<!-- Comments -->
								<div class="space-y-3">
									{#each [
										{
											user: 'User #7',
											text: 'Monthly cleanups could work if we get enough volunteers. I can organize the first one.'
										},
										{
											user: 'User #12',
											text: 'We should also look into a composting station — it solves the root cause, not just the symptoms.'
										},
										{
											user: 'User #3',
											text: "I've seen success with deposit schemes in other neighborhoods. Maybe we should consider that too."
										}
									] as comment}
										<div
											class="p-3 rounded-lg border"
											style="border-color: var(--color-border); background-color: var(--color-bg)"
										>
											<span
												class="text-xs font-semibold"
												style="color: var(--color-primary)"
											>
												{comment.user}
											</span>
											<p
												class="text-sm mt-1"
												style="color: var(--color-text-muted)"
											>
												{comment.text}
											</p>
										</div>
									{/each}
								</div>

								<!-- Pro/Con -->
								<div class="grid grid-cols-2 gap-3 mt-4">
									<div
										class="p-3 rounded-lg"
										style="background-color: color-mix(in srgb, #22c55e 10%, var(--color-bg))"
									>
										<div class="flex items-center gap-1 mb-2">
											<ThumbsUp size={14} style="color: #22c55e" />
											<span
												class="text-xs font-semibold"
												style="color: #16a34a"
											>
												Arguments For
											</span>
										</div>
										<ul class="space-y-1">
											<li
												class="text-xs"
												style="color: var(--color-text-muted)"
											>
												• Immediate visible impact
											</li>
											<li
												class="text-xs"
												style="color: var(--color-text-muted)"
											>
												• Builds community bonds
											</li>
										</ul>
									</div>
									<div
										class="p-3 rounded-lg"
										style="background-color: color-mix(in srgb, #ef4444 10%, var(--color-bg))"
									>
										<div class="flex items-center gap-1 mb-2">
											<ThumbsDown size={14} style="color: #ef4444" />
											<span
												class="text-xs font-semibold"
												style="color: #dc2626"
											>
												Arguments Against
											</span>
										</div>
										<ul class="space-y-1">
											<li
												class="text-xs"
												style="color: var(--color-text-muted)"
											>
												• Doesn't address root cause
											</li>
											<li
												class="text-xs"
												style="color: var(--color-text-muted)"
											>
												• Requires ongoing commitment
											</li>
										</ul>
									</div>
								</div>

								<!-- AI Summary -->
								<div
									class="p-4 rounded-lg border border-dashed flex items-start gap-3"
									style="border-color: var(--color-accent); background-color: color-mix(in srgb, var(--color-accent) 8%, transparent)"
								>
									<Sparkles
										size={18}
										style="color: var(--color-accent); flex-shrink: 0; margin-top: 2px"
									/>
									<div>
										<p
											class="text-xs font-semibold mb-1"
											style="color: var(--color-accent-dark)"
										>
											AI Summary
										</p>
										<p class="text-xs" style="color: var(--color-text-muted)">
											The community is converging on a combined approach:
											regular cleanups for immediate impact + a composting
											station for long-term change. Key concern is sustaining
											volunteer engagement over time.
										</p>
									</div>
								</div>
							</div>
						{:else if currentStep === 2}
							<!-- Step 3: Voting Results -->
							<div class="space-y-5">
								<!-- Approval Bar -->
								<div>
									<div class="flex items-center justify-between mb-2">
										<span
											class="text-sm font-semibold"
											style="color: var(--color-text)"
										>
											Monthly Cleanups + Composting Station
										</span>
										<span
											class="text-sm font-bold"
											style="color: var(--color-primary)"
										>
											Approved
										</span>
									</div>
									<div
										class="w-full h-4 rounded-full overflow-hidden"
										style="background-color: var(--color-border)"
									>
										<div
											class="h-full rounded-full transition-all duration-1000"
											style="width: 87%; background-color: var(--color-primary)"
										></div>
									</div>
									<div
										class="flex justify-between mt-1 text-xs"
										style="color: var(--color-text-muted)"
									>
										<span>87% approval</span>
										<span>42 voters</span>
									</div>
								</div>

								<!-- Metrics -->
								<div class="grid grid-cols-3 gap-3">
									{#each [
										{
											label: 'Environmental Impact',
											value: '+3.2',
											color: '#22c55e'
										},
										{
											label: 'Community Engagement',
											value: '+2.1',
											color: 'var(--color-primary)'
										},
										{
											label: 'Cost',
											value: '120 hrs',
											color: 'var(--color-accent)'
										}
									] as metric}
										<div
											class="p-3 rounded-lg text-center border"
											style="border-color: var(--color-border); background-color: var(--color-bg)"
										>
											<p
												class="text-lg font-bold"
												style="color: {metric.color}"
											>
												{metric.value}
											</p>
											<p
												class="text-xs mt-1"
												style="color: var(--color-text-muted)"
											>
												{metric.label}
											</p>
										</div>
									{/each}
								</div>
							</div>
						{:else if currentStep === 3}
							<!-- Step 4: Implementation Report -->
							<div class="space-y-4">
								<!-- Progress -->
								<div>
									<div class="flex items-center justify-between mb-2">
										<span
											class="text-sm font-medium"
											style="color: var(--color-text)"
										>
											Progress
										</span>
										<span
											class="text-xs"
											style="color: var(--color-text-muted)"
										>
											3 of 12 months
										</span>
									</div>
									<div
										class="w-full h-3 rounded-full overflow-hidden"
										style="background-color: var(--color-border)"
									>
										<div
											class="h-full rounded-full"
											style="width: 25%; background-color: var(--color-primary)"
										></div>
									</div>
								</div>

								<!-- Photo Placeholder -->
								<div
									class="rounded-lg border-2 border-dashed p-8 text-center"
									style="border-color: var(--color-border)"
								>
									<Camera
										size={32}
										style="color: var(--color-text-muted); margin: 0 auto"
									/>
									<p
										class="text-xs mt-2"
										style="color: var(--color-text-muted)"
									>
										3 geotagged photos attached
									</p>
									<div
										class="flex justify-center gap-2 mt-3"
									>
										{#each Array(3) as _}
											<div
												class="w-16 h-12 rounded"
												style="background-color: var(--color-border)"
											></div>
										{/each}
									</div>
								</div>

								<!-- Verification -->
								<div
									class="flex items-center gap-3 p-3 rounded-lg"
									style="background-color: color-mix(in srgb, #22c55e 10%, var(--color-bg))"
								>
									<ShieldCheck size={20} style="color: #22c55e" />
									<div>
										<p
											class="text-sm font-medium"
											style="color: #16a34a"
										>
											Verified by 4 community members
										</p>
										<p class="text-xs" style="color: var(--color-text-muted)">
											31 volunteers participated · 47 bags of waste collected
										</p>
									</div>
								</div>
							</div>
						{:else if currentStep === 4}
							<!-- Step 5: Rewards -->
							<div class="space-y-4">
								<!-- Contributors -->
								<div class="space-y-2">
									{#each [
										{
											user: 'Maria (Organizer)',
											amount: '45 $CC',
											role: 'Led coordination'
										},
										{
											user: 'User #12',
											amount: '30 $CC',
											role: 'Composting design'
										},
										{
											user: '29 Volunteers',
											amount: '10–15 $CC each',
											role: 'Cleanup participation'
										}
									] as contributor}
										<div
											class="flex items-center justify-between p-3 rounded-lg border"
											style="border-color: var(--color-border); background-color: var(--color-bg)"
										>
											<div>
												<p
													class="text-sm font-medium"
													style="color: var(--color-text)"
												>
													{contributor.user}
												</p>
												<p
													class="text-xs"
													style="color: var(--color-text-muted)"
												>
													{contributor.role}
												</p>
											</div>
											<span
												class="text-sm font-bold"
												style="color: var(--color-primary)"
											>
												{contributor.amount}
											</span>
										</div>
									{/each}
								</div>

								<!-- Total -->
								<div
									class="flex items-center justify-between p-4 rounded-lg"
									style="background-color: var(--color-bg)"
								>
									<div class="flex items-center gap-2">
										<Coins
											size={18}
											style="color: var(--color-accent)"
										/>
										<span
											class="text-sm font-medium"
											style="color: var(--color-text)"
										>
											Total Minted
										</span>
									</div>
									<span
										class="text-lg font-bold"
										style="color: var(--color-accent)"
									>
										485 $CC
									</span>
								</div>

								<!-- Hypercert -->
								<div
									class="p-4 rounded-lg border"
									style="border-color: var(--color-accent); background-color: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg))"
								>
									<div class="flex items-start gap-3">
										<FileCheck
											size={20}
											style="color: var(--color-accent); flex-shrink: 0; margin-top: 2px"
										/>
										<div>
											<p
												class="text-sm font-semibold"
												style="color: var(--color-text)"
											>
												Hypercert Generated
											</p>
											<p class="text-xs mt-1" style="color: var(--color-text-muted)">
												Impact credential: 47 bags collected · 31 volunteers · Riverside Park cleanup
											</p>
											<p class="text-xs mt-1" style="color: var(--color-text-muted)">
												Available for purchase by impact funds, ESG buyers, and governments — proceeds back the $CC reserve.
											</p>
										</div>
									</div>
								</div>

								<!-- Reputation Badge -->
								<div
									class="p-4 rounded-lg border text-center"
									style="border-color: var(--color-primary); background-color: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg))"
								>
									<Award
										size={24}
										style="color: var(--color-primary); margin: 0 auto"
									/>
									<p
										class="text-sm font-semibold mt-2"
										style="color: var(--color-primary)"
									>
										Reputation: +45 $CC earned
									</p>
									<p
										class="text-xs mt-1"
										style="color: var(--color-text-muted)"
									>
										Maria's contribution is now part of her on-chain track record
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/key}
	</div>

	<!-- Navigation -->
	<div class="flex items-center justify-between mt-8 pt-6 border-t" style="border-color: var(--color-border)">
		{#if currentStep > 0}
			<button
				onclick={prev}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border cursor-pointer"
				style="border-color: var(--color-border); color: var(--color-text-muted); background-color: var(--color-bg)"
			>
				<ChevronLeft size={16} />
				Previous
			</button>
		{:else}
			<div></div>
		{/if}

		{#if currentStep < steps.length - 1}
			<button
				onclick={next}
				class="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
				style="background-color: var(--color-primary); color: white"
			>
				Next
				<ChevronRight size={16} />
			</button>
		{:else}
			<button
				onclick={restart}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border cursor-pointer"
				style="border-color: var(--color-border); color: var(--color-text-muted); background-color: var(--color-bg)"
			>
				<RotateCcw size={16} />
				Start Over
			</button>
		{/if}
	</div>

	<!-- CTA (last step) -->
	{#if currentStep === steps.length - 1}
		<section
			class="mt-12 p-8 rounded-xl text-center"
			style="background-color: var(--color-bg-alt)"
		>
			<h3 class="text-xl font-bold mb-3" style="color: var(--color-text)">
				Interested? Learn more or get involved.
			</h3>
			<p class="text-sm mb-6 max-w-lg mx-auto" style="color: var(--color-text-muted)">
				Kindact is a vision in progress. Explore the ideas behind it, or reach out if you want
				to help make it real.
			</p>
			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<a
					href="/about"
					class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200"
					style="background-color: var(--color-primary); color: white"
				>
					About Kindact
					<ArrowRight size={16} />
				</a>
				<a
					href="/economics"
					class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 border"
					style="border-color: var(--color-border); color: var(--color-text); background-color: var(--color-bg)"
				>
					Token Economics
					<ArrowRight size={16} />
				</a>
			</div>
		</section>
	{/if}
</article>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-fade-in {
			animation: none;
		}
	}
</style>
