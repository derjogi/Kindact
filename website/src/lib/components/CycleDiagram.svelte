<script lang="ts">
	import { steps } from '$lib/content/steps';
	import { Lightbulb, MessageSquare, Vote, Hammer, Coins } from 'lucide-svelte';

	let activeStep = $state<number | null>(null);

	const icons = [Lightbulb, MessageSquare, Vote, Hammer, Coins];

	const cx = 200;
	const cy = 200;
	const radius = 150;
	const nodeRadius = 36;

	function getPosition(index: number): { x: number; y: number } {
		const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
		return {
			x: cx + radius * Math.cos(angle),
			y: cy + radius * Math.sin(angle)
		};
	}

	function getArcPath(fromIndex: number, toIndex: number): string {
		const from = getPosition(fromIndex);
		const to = getPosition(toIndex);

		const fromAngle = (fromIndex * 2 * Math.PI) / 5 - Math.PI / 2;
		const toAngle = (toIndex * 2 * Math.PI) / 5 - Math.PI / 2;

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
		activeStep = activeStep === index ? null : index;
	}

	function handleKeydown(e: KeyboardEvent, index: number) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleStepClick(index);
		}
	}

	const positions = Array.from({ length: 5 }, (_, i) => getPosition(i));
</script>

<div class="cycle-diagram">
	<!-- SVG Diagram -->
	<div class="flex justify-center mb-8">
		<svg viewBox="0 0 400 400" class="w-full max-w-md" role="img" aria-label="Kindact 5-step cycle diagram">
			<!-- Connection arcs -->
			{#each [0, 1, 2, 3, 4] as i}
				{@const nextI = (i + 1) % 5}
				<path
					d={getArcPath(i, nextI)}
					fill="none"
					stroke={activeStep === i || activeStep === nextI ? 'var(--color-primary)' : 'var(--color-border)'}
					stroke-width="2"
					stroke-dasharray={activeStep === i ? '0' : '6 4'}
					class="transition-all duration-300"
				/>
			{/each}

			<!-- Arrow markers along arcs -->
			{#each [0, 1, 2, 3, 4] as i}
				{@const pos = getPosition(i)}
				{@const nextPos = getPosition((i + 1) % 5)}
				{@const midX = (pos.x + nextPos.x) / 2}
				{@const midY = (pos.y + nextPos.y) / 2}
				{@const pullX = (midX - cx) * 0.15}
				{@const pullY = (midY - cy) * 0.15}
				<circle
					cx={midX + pullX}
					cy={midY + pullY}
					r="3"
					fill={activeStep === i ? 'var(--color-primary)' : 'var(--color-border)'}
					class="transition-colors duration-300"
				/>
			{/each}

			<!-- Step nodes -->
			{#each steps as step, i}
				{@const pos = positions[i]}
				{@const isActive = activeStep === i}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<g
					onclick={() => handleStepClick(i)}
					onkeydown={(e) => handleKeydown(e, i)}
					tabindex="0"
					role="button"
					aria-label="Step {step.number}: {step.name} — {step.title}. {step.summary}"
					aria-pressed={isActive}
					class="cursor-pointer focus:outline-none"
				>
					<!-- Outer glow ring -->
					{#if isActive}
						<circle
							cx={pos.x}
							cy={pos.y}
							r={nodeRadius + 6}
							fill="none"
							stroke="var(--color-primary)"
							stroke-width="2"
							opacity="0.3"
							class="animate-pulse"
						/>
					{/if}

					<!-- Node circle -->
					<circle
						cx={pos.x}
						cy={pos.y}
						r={nodeRadius}
						fill={isActive ? 'var(--color-primary)' : 'var(--color-bg)'}
						stroke={isActive ? 'var(--color-primary)' : 'var(--color-border)'}
						stroke-width="2"
						class="transition-all duration-300"
					/>

					<!-- Step number -->
					<text
						x={pos.x}
						y={pos.y - 8}
						text-anchor="middle"
						font-size="10"
						font-weight="600"
						fill={isActive ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)'}
						class="transition-colors duration-300 select-none pointer-events-none"
					>
						{step.number}
					</text>

					<!-- Step name -->
					<text
						x={pos.x}
						y={pos.y + 6}
						text-anchor="middle"
						font-size="13"
						font-weight="700"
						fill={isActive ? 'white' : 'var(--color-text)'}
						class="transition-colors duration-300 select-none pointer-events-none"
					>
						{step.name}
					</text>
				</g>
			{/each}
		</svg>
	</div>

	<!-- Detail panel -->
	<div
		class="min-h-[180px] flex items-center justify-center"
	>
		{#if activeStep !== null}
			{@const step = steps[activeStep]}
			{@const Icon = icons[activeStep]}
			<div
				class="w-full p-6 rounded-xl border transition-all duration-300"
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
							<span class="text-xs font-semibold uppercase tracking-wide" style="color: var(--color-primary)">
								Step {step.number}
							</span>
							<h3 class="text-lg font-bold" style="color: var(--color-text)">
								{step.name}: {step.title}
							</h3>
						</div>
						<p class="text-sm mb-2 font-medium" style="color: var(--color-text)">{step.summary}</p>
						<p class="text-sm" style="color: var(--color-text-muted)">{step.details}</p>
					</div>
				</div>
			</div>
		{:else}
			<p class="text-sm text-center" style="color: var(--color-text-muted)">
				Click a step to learn more
			</p>
		{/if}
	</div>
</div>
