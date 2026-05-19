<script lang="ts">
	const currentYear = new Date().getFullYear();

	const footerLinks = [
		{
			title: 'Explore',
			links: [
				{ href: '/economics', label: 'Economics' },
				{ href: '/governance', label: 'Governance' },
				{ href: '/walkthrough', label: 'Walkthrough' }
			]
		},
		{
			title: 'Connect',
			links: [
				{ href: '/about', label: 'About' },
				{ href: '/about#contact', label: 'Contact' }
			]
		}
	];
</script>

<footer class="border-t mt-24" style="border-color: var(--color-border); background-color: var(--color-bg-alt);">
	<div class="max-w-6xl mx-auto px-6 py-12">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- Brand -->
			<div>
				<a href="/" class="text-xl font-bold tracking-tight" style="color: var(--color-primary)">
					Kindact
				</a>
				<p class="mt-3 text-sm" style="color: var(--color-text-muted)">
					A new paradigm for governance and collective action.
				</p>
			</div>

			<!-- Link columns -->
			{#each footerLinks as section}
				<div>
					<h3 class="text-sm font-semibold mb-3" style="color: var(--color-text)">
						{section.title}
					</h3>
					<ul class="space-y-2">
						{#each section.links as link}
							<li>
								<a
									href={link.href}
									class="text-sm transition-colors hover:opacity-80"
									style="color: var(--color-text-muted)"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<!-- Bottom bar -->
		<div class="mt-12 pt-6 border-t" style="border-color: var(--color-border)">
			<p class="text-xs" style="color: var(--color-text-muted)">
				© {currentYear} Kindact. Open source and community-driven.
			</p>
		</div>
	</div>
</footer>
