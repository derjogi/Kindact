<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';

	interface Props {
		title: string;
		description: string;
		href?: string;
		icon?: typeof import('lucide-svelte').Icon;
	}

	let { title, description, href, icon: Icon }: Props = $props();
</script>

{#if href}
	<a
		{href}
		class="group block p-6 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
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
			<div class="flex-1">
				<h3
					class="text-lg font-semibold flex items-center gap-2"
					style="color: var(--color-text)"
				>
					{title}
					<span
						class="opacity-0 group-hover:opacity-100 transition-opacity"
						style="color: var(--color-primary)"
					>
						<ArrowRight size={16} />
					</span>
				</h3>
				<p class="mt-2 text-sm" style="color: var(--color-text-muted)">
					{description}
				</p>
			</div>
		</div>
	</a>
{:else}
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
			<div class="flex-1">
				<h3 class="text-lg font-semibold" style="color: var(--color-text)">
					{title}
				</h3>
				<p class="mt-2 text-sm" style="color: var(--color-text-muted)">
					{description}
				</p>
			</div>
		</div>
	</div>
{/if}
