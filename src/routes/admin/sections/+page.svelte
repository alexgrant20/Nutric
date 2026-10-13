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

<header class="adm-head max-w-3xl">
	<div>
		<h1 class="adm-title">Landing sections</h1>
		<p class="adm-sub">Set the order and which sections appear. A section with no published content is hidden automatically, even when enabled.</p>
	</div>
</header>

<form method="post" use:enhance class="max-w-3xl">
	<ol class="mt-2">
		{#each rows as r, i (r.key)}
			<li class="flex items-center gap-3 border-b border-forest-700/15 py-2 {r.isEnabled ? '' : 'bg-forest-700/5'}">
				<input type="hidden" name="order" value={r.key} />
				<span class="w-8 text-center font-serif text-xl tabular-nums text-forest-700/50" aria-hidden="true">{i + 1}</span>
				<label class="flex min-h-11 flex-1 items-center gap-3">
					<input type="checkbox" name="enabled" value={r.key} bind:checked={r.isEnabled} class="size-5 accent-forest-700" />
					<span class="{r.isEnabled ? 'font-medium text-forest-700' : 'text-stone-600'}">{labels[r.key]}</span>
					{#if r.isEnabled && !r.hasContent}<span class="adm-code">hidden: no content</span>{/if}
				</label>
				<button type="button" class="adm-btn-ghost size-11 !px-0" aria-label="Move {labels[r.key]} up" onclick={() => move(i, -1)} disabled={i === 0}>&uarr;</button>
				<button type="button" class="adm-btn-ghost size-11 !px-0" aria-label="Move {labels[r.key]} down" onclick={() => move(i, 1)} disabled={i === rows.length - 1}>&darr;</button>
			</li>
		{/each}
	</ol>
	<div class="adm-savebar"><button class="adm-btn">Save order</button></div>
</form>
