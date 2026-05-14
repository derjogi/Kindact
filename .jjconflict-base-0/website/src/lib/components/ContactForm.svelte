<script lang="ts">
	import { Send } from 'lucide-svelte';

	let name = $state('');
	let email = $state('');
	let interest = $state('general');
	let message = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');

	const interestOptions = [
		{ value: 'general', label: 'General inquiry' },
		{ value: 'collaborate', label: 'Interested in collaborating' },
		{ value: 'funding', label: 'Funding / investment' },
		{ value: 'technical', label: 'Technical contribution' },
		{ value: 'research', label: 'Academic / research' }
	];

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		status = 'submitting';

		// TODO: Connect to actual form backend (Formspree, etc.)
		// For now, simulate submission
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Simulated success
		status = 'success';
		name = '';
		email = '';
		interest = 'general';
		message = '';
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div>
			<label for="name" class="block text-sm font-medium mb-2" style="color: var(--color-text)">
				Name
			</label>
			<input
				type="text"
				id="name"
				bind:value={name}
				required
				class="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
				style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text); --tw-ring-color: var(--color-primary)"
				placeholder="Your name"
			/>
		</div>
		<div>
			<label for="email" class="block text-sm font-medium mb-2" style="color: var(--color-text)">
				Email
			</label>
			<input
				type="email"
				id="email"
				bind:value={email}
				required
				class="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
				style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text); --tw-ring-color: var(--color-primary)"
				placeholder="you@example.com"
			/>
		</div>
	</div>

	<div>
		<label for="interest" class="block text-sm font-medium mb-2" style="color: var(--color-text)">
			I'm interested in...
		</label>
		<select
			id="interest"
			bind:value={interest}
			class="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
			style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text); --tw-ring-color: var(--color-primary)"
		>
			{#each interestOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>

	<div>
		<label for="message" class="block text-sm font-medium mb-2" style="color: var(--color-text)">
			Message
		</label>
		<textarea
			id="message"
			bind:value={message}
			required
			rows={5}
			class="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none"
			style="border-color: var(--color-border); background-color: var(--color-bg); color: var(--color-text); --tw-ring-color: var(--color-primary)"
			placeholder="Tell us about yourself and how you'd like to get involved..."
		></textarea>
	</div>

	<div class="flex items-center gap-4">
		<button
			type="submit"
			disabled={status === 'submitting'}
			class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
			style="background-color: var(--color-accent); color: var(--color-text)"
		>
			{#if status === 'submitting'}
				Sending...
			{:else}
				Send message
				<Send size={16} />
			{/if}
		</button>

		{#if status === 'success'}
			<span class="text-sm font-medium" style="color: var(--color-primary)">
				✓ Message sent! We'll be in touch.
			</span>
		{/if}

		{#if status === 'error'}
			<span class="text-sm font-medium text-red-600">
				Something went wrong. Please try again.
			</span>
		{/if}
	</div>
</form>
