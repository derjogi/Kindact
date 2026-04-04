<script lang="ts">
	import type { Snippet } from 'svelte';
	import { scrollReveal, type ScrollRevealOptions } from '$lib/utils/scroll';

	interface Props {
		y?: number;
		opacity?: number;
		duration?: number;
		delay?: number;
		stagger?: number;
		children: Snippet;
	}

	let props: Props = $props();

	function getOptions(): ScrollRevealOptions {
		const opts: ScrollRevealOptions = {};
		if (props.y !== undefined) opts.y = props.y;
		if (props.opacity !== undefined) opts.opacity = props.opacity;
		if (props.duration !== undefined) opts.duration = props.duration;
		if (props.delay !== undefined) opts.delay = props.delay;
		if (props.stagger !== undefined) opts.stagger = props.stagger;
		return opts;
	}
</script>

<div use:scrollReveal={getOptions()}>
	{@render props.children()}
</div>
