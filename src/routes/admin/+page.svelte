<script lang="ts">
	let { data } = $props();
	const items = $derived([
		['products', 'Products', data.counts.products], ['collections', 'Collections', data.counts.collections], ['news', 'News', data.counts.news],
		['testimonials', 'Testimonials', data.counts.testimonials], ['accolades', 'Accolades', data.counts.accolades]
	] as [string, string, number][]);
</script>

<svelte:head><title>Dashboard | Admin</title></svelte:head>
<h1 class="font-serif text-3xl text-forest-700">Dashboard</h1>
<ul class="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each items as [key, label, n] (key)}
		<li>
			<a href="/admin/{key}" class="block rounded-md border border-forest-700/25 bg-white p-5">
				<span class="block text-3xl font-semibold text-forest-700">{n}</span>
				<span class="text-sm text-stone-600">{n === 0 ? `No ${label.toLowerCase()} yet. Add the first one` : label}</span>
			</a>
		</li>
	{/each}
	<li>
		<a href="/admin/subscribers" class="block rounded-md border border-forest-700/25 bg-white p-5">
			<span class="block text-3xl font-semibold text-forest-700">{data.counts.subscribers}</span>
			<span class="text-sm text-stone-600">Subscribers</span>
		</a>
	</li>
</ul>
{#if data.drafts.length}
	<h2 class="mt-10 text-lg font-semibold">News drafts</h2>
	<ul class="mt-2 list-disc pl-6">
		{#each data.drafts as d (d.id)}<li><a class="underline" href="/admin/news/{d.id}">{d.slug}</a></li>{/each}
	</ul>
{/if}
