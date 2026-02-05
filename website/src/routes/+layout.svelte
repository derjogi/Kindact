<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Header />

	<!-- Main content with top padding for fixed header -->
	<main class="flex-1 pt-16">
		{@render children()}
	</main>

	<Footer />
</div>
