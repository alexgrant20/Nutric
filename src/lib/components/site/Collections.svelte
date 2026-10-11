<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	import ProductCoverflow from './ProductCoverflow.svelte';

	let { lang, collections, products }: { lang: string; collections: any[]; products: any[] } = $props();
	const t = useT();
	let activeId = $state(collections[0]?.id);
	const shown = $derived(products.filter((p) => p.collectionId === activeId));
</script>

<section id="collections" class="on-dark relative isolate overflow-hidden bg-forest-700 px-4 py-24 text-cream-100 sm:px-6 sm:py-32">
	<!-- Each collection's own campaign photo sits behind the products and cross-fades with the tabs. -->
	<div class="absolute inset-0 -z-10" aria-hidden="true">
		{#each collections as c (c.id)}
			{#if c.bannerImage}
				<Img src={c.bannerImage} alt="" class="absolute inset-0 size-full object-cover transition-opacity duration-700 {c.id === activeId ? 'opacity-45' : 'opacity-0'}" />
			{/if}
		{/each}
		<div class="absolute inset-0 bg-forest-700/70"></div>
	</div>

	<div class="mx-auto max-w-7xl" use:reveal>
		<div class="flex flex-wrap items-end justify-between gap-6">
			<h2 class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none">{t('collections.title')}</h2>
			<ul class="flex flex-wrap gap-2">
				{#each collections as c (c.id)}
					<li>
						<button type="button" aria-pressed={c.id === activeId} onclick={() => (activeId = c.id)} aria-label={c.t.name}
							class="flex h-12 items-center rounded-sm bg-cream-100 px-5 text-forest-900 transition-opacity {c.id === activeId ? 'ring-2 ring-lime-400 ring-offset-2 ring-offset-forest-700' : 'opacity-80 hover:opacity-100'}">
							{#if c.logoImage}
								<Img src={c.logoImage} alt="" class="h-5 w-auto max-w-32" />
							{:else}
								<span class="font-medium">{c.t.name}</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<div class="mt-12">
			<ProductCoverflow {lang} products={shown} />
		</div>

		<div class="mt-10 text-center">
			<a href="/{lang}/products" class="inline-flex min-h-11 items-center underline underline-offset-4">{t('collections.viewAll')}</a>
		</div>
	</div>
</section>
