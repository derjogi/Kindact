<script>
	import { page } from '$app/state';
</script>

<div class="error-page">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Something went wrong'}</p>
	<a href="/">Back to home</a>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
	}

	h1 {
		font-size: 4rem;
		font-weight: 700;
		color: var(--color-primary, #2d6a6a);
		margin: 0 0 0.5rem;
	}

	p {
		font-size: 1.25rem;
		color: var(--color-text-secondary, #64748b);
		margin: 0 0 2rem;
	}

	a {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--color-primary, #2d6a6a);
		color: white;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	a:hover {
		opacity: 0.9;
	}
</style>
