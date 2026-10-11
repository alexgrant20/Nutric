<script lang="ts">
	let { data } = $props();
</script>
<svelte:head><title>Subscribers | Admin</title></svelte:head>
<div class="flex flex-wrap items-center justify-between gap-4">
	<h1 class="font-serif text-3xl text-forest-700">Subscribers</h1>
	{#if data.rows.length}<a href="/admin/subscribers/export" class="inline-flex min-h-12 items-center rounded-sm border border-forest-700 px-5">Export CSV</a>{/if}
</div>
{#if !data.rows.length}
	<p class="mt-8 text-stone-600">No subscribers yet. Addresses appear here when visitors use the newsletter form on the site.</p>
{:else}
	<table class="mt-6 w-full max-w-2xl text-left text-sm">
		<thead><tr class="border-b border-forest-700/30"><th class="p-2">Email</th><th class="p-2">Language</th><th class="p-2">Date</th></tr></thead>
		<tbody>{#each data.rows as r (r.id)}<tr class="border-b border-forest-700/15"><td class="p-2">{r.email}</td><td class="p-2">{r.lang}</td><td class="p-2">{new Date(r.createdAt * 1000).toISOString().slice(0, 10)}</td></tr>{/each}</tbody>
	</table>
{/if}
