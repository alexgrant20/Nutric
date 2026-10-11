<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
	let rows = $state(data.rows.map((r) => ({ ...r })));
	const labels: Record<string, string> = {
		hero: 'Hero', best_seller: 'Best seller', collections: 'Collections and products', about: 'About teaser',
		testimonials: 'Testimonials', accolades: 'Accolades', news: 'Latest news', newsletter: 'Newsletter'
	};
	function move(i: number, d: number) {
		const j = i + d;
		if (j < 0 || j >= rows.length) return;
		[rows[i], rows[j]] = [rows[j], rows[i]];
	}
</script>

<svelte:head><title>Landing sections | Admin</title></svelte:head>
<h1 class="font-serif text-3xl text-forest-700">Landing sections</h1>
<p class="mt-2 max-w-prose text-stone-600">Set the order and which sections appear. A section with no published content is hidden automatically, even when enabled.</p>
<form method="post" use:enhance class="mt-6 max-w-xl space-y-2">
	{#each rows as r, i (r.key)}
		<div class="flex items-center gap-3 rounded-md border border-forest-700/25 bg-white p-3">
			<input type="hidden" name="order" value={r.key} />
			<label class="flex min-h-11 flex-1 items-center gap-3">
				<input type="checkbox" name="enabled" value={r.key} bind:checked={r.isEnabled} class="size-5" />
				<span>{labels[r.key]}</span>
				{#if r.isEnabled && !r.hasContent}<span class="text-xs text-stone-600">(hidden: no content)</span>{/if}
			</label>
			<button type="button" class="size-11 rounded-sm border border-forest-700/40" aria-label="Move {labels[r.key]} up" onclick={() => move(i, -1)} disabled={i === 0}>&uarr;</button>
			<button type="button" class="size-11 rounded-sm border border-forest-700/40" aria-label="Move {labels[r.key]} down" onclick={() => move(i, 1)} disabled={i === rows.length - 1}>&darr;</button>
		</div>
	{/each}
	<button class="mt-4 min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100">Save order</button>
</form>
