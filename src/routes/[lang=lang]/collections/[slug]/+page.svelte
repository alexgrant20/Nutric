<script lang="ts">
	import Img from '$lib/components/ui/Img.svelte';
	import ProductCard from '$lib/components/site/ProductCard.svelte';
	let { data } = $props();
	const c = $derived(data.collection);
</script>

<svelte:head><title>{c.t.name}</title></svelte:head>

<div class="pt-16">
	{#if c.bannerImage}
		<Img src={c.bannerImage} alt={c.t.bannerAlt ?? c.t.name} loading="eager" class="max-h-80 w-full object-cover" />
	{/if}
	<div class="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6">
		<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{c.t.name}</h1>
		{#if c.t.tagline}<p class="mt-2 text-lg text-stone-600">{c.t.tagline}</p>{/if}
		{#if c.t.description}<p class="mt-4 max-w-prose">{c.t.description}</p>{/if}
		<ul class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each data.products as p (p.id)}<li><ProductCard lang={data.lang} product={p} /></li>{/each}
		</ul>
	</div>
</div>
