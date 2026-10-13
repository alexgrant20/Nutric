<script lang="ts">
	let { data } = $props();
</script>
<svelte:head><title>Subscribers | Admin</title></svelte:head>
<header class="adm-head max-w-3xl">
	<div>
		<h1 class="adm-title">Subscribers</h1>
		<p class="adm-sub">{data.rows.length ? `${data.rows.length} newsletter sign-ups.` : 'Addresses appear here when visitors use the newsletter form on the site.'}</p>
	</div>
	{#if data.rows.length}<a href="/admin/subscribers/export" class="adm-btn-ghost">Export CSV</a>{/if}
</header>
{#if !data.rows.length}
	<p class="mt-8 max-w-prose text-stone-600">No subscribers yet.</p>
{:else}
	<div class="mt-6 max-w-3xl overflow-x-auto">
		<table class="adm-table" style="min-width: 0">
			<thead><tr><th>Email</th><th>Language</th><th>Date</th></tr></thead>
			<tbody>{#each data.rows as r (r.id)}<tr><td>{r.email}</td><td><span class="adm-code">{r.lang}</span></td><td class="tabular-nums text-stone-600">{new Date(r.createdAt * 1000).toISOString().slice(0, 10)}</td></tr>{/each}</tbody>
		</table>
	</div>
{/if}
