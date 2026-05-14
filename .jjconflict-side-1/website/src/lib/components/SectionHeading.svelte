<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
		centered?: boolean;
	}

	let { title, subtitle, centered = false }: Props = $props();
</script>

<div class={centered ? 'text-center' : ''}>
	<h2 class="text-3xl md:text-4xl font-bold" style="color: var(--color-text)">
		{title}
	</h2>
	{#if subtitle}
		<p class="mt-4 text-lg max-w-2xl" class:mx-auto={centered} style="color: var(--color-text-muted)">
			{subtitle}
		</p>
	{/if}
</div>
