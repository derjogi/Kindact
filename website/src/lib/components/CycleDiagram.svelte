<script lang="ts">
	import { steps } from '$lib/content/steps';
	import { Lightbulb, MessageSquare, Vote, Hammer, Coins } from 'lucide-svelte';
	import { onMount } from 'svelte';

	const icons = [Lightbulb, MessageSquare, Vote, Hammer, Coins];

	const cx = 200;
	const cy = 200;
	const radius = 150;
	const nodeRadius = 36;

	let scrollContainer: HTMLDivElement;
	let rotation = $state(0);
	let activeStep = $state(0);
	let scrollProgress = $state(0);
	let prefersReducedMotion = $state(false);

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		function handleScroll() {
			if (!scrollContainer) return;

			const rect = scrollContainer.getBoundingClientRect();
			const containerHeight = scrollContainer.offsetHeight;
			const viewportHeight = window.innerHeight;
			const scrollableDistance = containerHeight - viewportHeight;

			const scrolled = -rect.top;
			const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
			scrollProgress = progress;

			const stepProgress = progress * 5;
			const currentStep = Math.min(4, Math.floor(stepProgress));
			activeStep = currentStep;

			if (prefersReducedMotion) {
				rotation = currentStep * (360 / 5);
			} else {
				rotation = stepProgress * (360 / 5);
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function getPosition(index: number, rotationDeg: number): { x: number; y: number } {
		const baseAngle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
		const rotationRad = (rotationDeg * Math.PI) / 180;
		const angle = baseAngle - rotationRad;
		return {
			x: cx + radius * Math.cos(angle),
			y: cy + radius * Math.sin(angle)
		};
	}

	function getArcPath(fromIndex: number, toIndex: number, rotationDeg: number): string {
		const from = getPosition(fromIndex, rotationDeg);
		const to = getPosition(toIndex, rotationDeg);

		const fromBaseAngle = (fromIndex * 2 * Math.PI) / 5 - Math.PI / 2;
		const toBaseAngle = (toIndex * 2 * Math.PI) / 5 - Math.PI / 2;
		const rotationRad = (rotationDeg * Math.PI) / 180;
		const fromAngle = fromBaseAngle - rotationRad;
		const toAngle = toBaseAngle - rotationRad;

		const offsetFrom = {
			x: from.x + nodeRadius * Math.cos(fromAngle),
			y: from.y + nodeRadius * Math.sin(fromAngle)
		};
		const offsetTo = {
			x: to.x - nodeRadius * Math.cos(toAngle),
			y: to.y - nodeRadius * Math.sin(toAngle)
		};

		return `M ${offsetFrom.x} ${offsetFrom.y} A ${radius} ${radius} 0 0 1 ${offsetTo.x} ${offsetTo.y}`;
	}

	function handleStepClick(index: number) {
		activeStep = index;
	}
</script>

<!-- Scroll container: tall enough for 5 steps + some breathing room -->
<div bind:this={scrollContainer} class="relative" style="height: 300vh;">
	<!-- Sticky diagram + detail panel -->
	<div class="sticky top-16 flex flex-col items-center py-8">
		<!-- Progress indicator -->
		<div class="flex gap-2 mb-6">
			{#each steps as step, i}
				<button
					onclick={() => handleStepClick(i)}
					class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300"
					style="background-color: {activeStep === i ? 'var(--color-primary)' : 'transparent'};
						   color: {activeStep === i ? 'white' : 'var(--color-text-muted)'};
						   border: 1px solid {activeStep === i ? 'var(--color-primary)' : 'var(--color-border)'};"
					aria-label="Step {step.number}: {step.name}"
				>
					{step.number}
					<span class="hidden sm:inline">{step.name}</span>
				</button>
			{/each}
		</div>

		<!-- SVG Diagram -->
		<div class="flex justify-center mb-6">
			<svg
				viewBox="0 0 400 400"
				class="w-64 md:w-80"
				role="img"
				aria-label="Kindact 5-step cycle diagram — Step {activeStep + 1}: {steps[activeStep].name}"
			>
				<!-- Connection arcs -->
				{#each [0, 1, 2, 3, 4] as i}
					{@const nextI = (i + 1) % 5}
					<path
						d={getArcPath(i, nextI, rotation)}
						fill="none"
						stroke={activeStep === i ? 'var(--color-primary)' : 'var(--color-border)'}
						stroke-width="2"
						stroke-dasharray={activeStep === i ? '0' : '6 4'}
					/>
				{/each}

				<!-- Midpoint dots on arcs -->
				{#each [0, 1, 2, 3, 4] as i}
					{@const pos = getPosition(i, rotation)}
					{@const nextPos = getPosition((i + 1) % 5, rotation)}
					{@const midX = (pos.x + nextPos.x) / 2}
					{@const midY = (pos.y + nextPos.y) / 2}
					{@const pullX = (midX - cx) * 0.15}
					{@const pullY = (midY - cy) * 0.15}
					<circle
						cx={midX + pullX}
						cy={midY + pullY}
						r="3"
						fill={activeStep === i ? 'var(--color-primary)' : 'var(--color-border)'}
					/>
				{/each}

				<!-- Step nodes -->
				{#each steps as step, i}
					{@const pos = getPosition(i, rotation)}
					{@const isActive = activeStep === i}
					<g
						onclick={() => handleStepClick(i)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleStepClick(i);
							}
						}}
						aria-label="Step {step.number}: {step.name}"
						aria-pressed={isActive}
						class="cursor-pointer focus:outline-none"
					>
						{#if isActive}
							<circle
								cx={pos.x}
								cy={pos.y}
								r={nodeRadius + 6}
								fill="none"
								stroke="var(--color-primary)"
								stroke-width="2"
								opacity="0.3"
							/>
						{/if}

						<circle
							cx={pos.x}
							cy={pos.y}
							r={nodeRadius}
							fill={isActive ? 'var(--color-primary)' : 'var(--color-bg)'}
							stroke={isActive ? 'var(--color-primary)' : 'var(--color-border)'}
							stroke-width="2"
						/>

						<text
							x={pos.x}
							y={pos.y - 8}
							text-anchor="middle"
							font-size="10"
							font-weight="600"
							fill={isActive ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)'}
							class="select-none pointer-events-none"
						>
							{step.number}
						</text>

						<text
							x={pos.x}
							y={pos.y + 6}
							text-anchor="middle"
							font-size="13"
							font-weight="700"
							fill={isActive ? 'white' : 'var(--color-text)'}
							class="select-none pointer-events-none"
						>
							{step.name}
						</text>
					</g>
				{/each}
			</svg>
		</div>

		<!-- Detail panel -->
		{#key activeStep}
			{@const step = steps[activeStep]}
			{@const Icon = icons[activeStep]}
			<div
				class="w-full max-w-2xl px-6 animate-fade-in"
			>
				<div
					class="p-6 rounded-xl border"
					style="border-color: var(--color-primary); background-color: var(--color-bg)"
				>
					<div class="flex items-start gap-4">
						<div
							class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
							style="background-color: var(--color-primary); color: white"
						>
							<Icon size={20} />
						</div>
						<div>
							<div class="flex items-baseline gap-2 mb-1">
								<span
									class="text-xs font-semibold uppercase tracking-wide"
									style="color: var(--color-primary)"
								>
									Step {step.number}
								</span>
								<h3 class="text-lg font-bold" style="color: var(--color-text)">
									{step.name}: {step.title}
								</h3>
							</div>
							<p class="text-sm mb-2 font-medium" style="color: var(--color-text)">
								{step.summary}
							</p>
							<p class="text-sm" style="color: var(--color-text-muted)">
								{step.details}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/key}

		<!-- Scroll hint -->
		{#if scrollProgress < 0.05}
			<p class="mt-4 text-xs animate-pulse" style="color: var(--color-text-muted)">
				↓ Scroll to explore each step
			</p>
		{/if}
	</div>
</div>

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
