<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import ProductCard from '$lib/components/site/ProductCard.svelte';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('products.title')}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('products.title')}</h1>
	{#if !data.groups.length && !data.loose.length}
		<p class="mt-8 text-stone-600">{t('common.empty')}</p>
	{/if}
	{#each data.groups as g (g.collection.id)}
		<section class="mt-14">
			<h2 class="text-2xl font-semibold"><a href="/{data.lang}/collections/{g.collection.slug}" class="hover:underline">{g.collection.t.name}</a></h2>
			{#if g.collection.t.tagline}<p class="mt-1 text-stone-600">{g.collection.t.tagline}</p>{/if}
			<ul class="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
				{#each g.products as p (p.id)}<li><ProductCard lang={data.lang} product={p} /></li>{/each}
			</ul>
		</section>
	{/each}
	{#if data.loose.length}
		<ul class="mt-14 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
			{#each data.loose as p (p.id)}<li><ProductCard lang={data.lang} product={p} /></li>{/each}
		</ul>
	{/if}
</div>
