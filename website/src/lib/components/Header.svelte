<script lang="ts">
	import { page } from '$app/state';

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/economics', label: 'Economics' },
		{ href: '/governance', label: 'Governance' },
		{ href: '/walkthrough', label: 'Walkthrough' },
		{ href: '/about', label: 'About' }
	];

	let mobileMenuOpen = $state(false);

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMenu() {
		mobileMenuOpen = false;
	}
</script>

<header
	class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
	style="background-color: rgba(248, 246, 242, 0.9);"
>
	<nav class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
		<!-- Logo / Wordmark -->
		<a href="/" class="text-xl font-bold tracking-tight" style="color: var(--color-primary)">
			Kindact
		</a>

		<!-- Desktop Navigation -->
		<ul class="hidden md:flex items-center gap-8">
			{#each navLinks as link}
				<li>
					<a
						href={link.href}
						class="text-sm font-medium transition-colors hover:opacity-80"
						class:active={page.url.pathname === link.href ||
							(link.href !== '/' && page.url.pathname.startsWith(link.href))}
						style="color: {page.url.pathname === link.href ||
						(link.href !== '/' && page.url.pathname.startsWith(link.href))
							? 'var(--color-primary)'
							: 'var(--color-text-muted)'}"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Mobile Menu Button -->
		<button
			class="md:hidden p-2 -mr-2"
			onclick={toggleMenu}
			aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
			aria-expanded={mobileMenuOpen}
		>
			<svg
				class="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				style="color: var(--color-text)"
			>
				{#if mobileMenuOpen}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				{:else}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				{/if}
			</svg>
		</button>
	</nav>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="md:hidden border-t" style="border-color: var(--color-border)">
			<ul class="px-6 py-4 space-y-4">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							onclick={closeMenu}
							class="block text-base font-medium"
							style="color: {page.url.pathname === link.href
								? 'var(--color-primary)'
								: 'var(--color-text-muted)'}"
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</header>

<style>
	.active {
		position: relative;
	}

	.active::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		right: 0;
		height: 2px;
		background-color: var(--color-primary);
		border-radius: 1px;
	}
</style>
