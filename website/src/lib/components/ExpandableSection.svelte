<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		summary?: string;
		defaultOpen?: boolean;
		children: Snippet;
	}

	let { title, summary, defaultOpen = false, children }: Props = $props();

	// We intentionally only capture the initial value - this is controlled by the parent at mount time
	let isOpen = $state<boolean>((() => defaultOpen)());

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="border rounded-lg overflow-hidden" style="border-color: var(--color-border)">
	<button
		onclick={toggle}
		class="w-full px-5 py-4 flex items-start justify-between text-left transition-colors hover:bg-opacity-50"
		style="background-color: {isOpen ? 'var(--color-bg-alt)' : 'transparent'}"
		aria-expanded={isOpen}
	>
		<div class="flex-1 pr-4">
			<h3 class="text-lg font-semibold" style="color: var(--color-text)">
				{title}
			</h3>
			{#if summary && !isOpen}
				<p class="mt-1 text-sm" style="color: var(--color-text-muted)">
					{summary}
				</p>
			{/if}
		</div>
		<span
			class="flex-shrink-0 mt-1 transition-transform duration-200"
			style="color: var(--color-text-muted); transform: rotate({isOpen ? 180 : 0}deg)"
		>
			<ChevronDown size={20} />
		</span>
	</button>

	{#if isOpen}
		<div
			class="px-5 pb-5 pt-2 border-t"
			style="border-color: var(--color-border); background-color: var(--color-bg)"
		>
			{@render children()}
		</div>
	{/if}
</div>
