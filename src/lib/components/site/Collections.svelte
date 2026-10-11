<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import ProductCard from './ProductCard.svelte';
	let { lang, collections, products }: { lang: string; collections: any[]; products: any[] } = $props();
	const t = useT();
	let activeId = $state(collections[0]?.id);
	let rail: HTMLElement | undefined = $state();
	const shown = $derived(products.filter((p) => p.collectionId === activeId));
	const scrollBy = (dir: number) => rail?.scrollBy({ left: dir * 320, behavior: 'smooth' });
</script>

<section id="collections" class="on-dark bg-forest-700 px-4 py-24 text-cream-100 sm:px-6">
	<div class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[16rem_1fr]">
		<div use:reveal>
			<h2 class="font-serif text-3xl">{t('collections.title')}</h2>
			<ul class="mt-6 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
				{#each collections as c (c.id)}
					<li>
						<button aria-pressed={c.id === activeId} onclick={() => (activeId = c.id)}
							class="flex min-h-11 w-full items-center rounded-sm px-3 text-left {c.id === activeId ? 'bg-cream-100 text-forest-900' : 'hover:bg-cream-100/10'}">
							<span>
								<span class="block font-medium">{c.t.name}</span>
								{#if c.t.tagline}<span class="block text-sm opacity-80">{c.t.tagline}</span>{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
			<a href="/{lang}/products" class="mt-8 inline-flex min-h-11 items-center underline underline-offset-4">{t('collections.viewAll')}</a>
		</div>

		<div class="min-w-0">
			<ul bind:this={rail} class="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
				{#each shown as p (p.id)}
					<li class="w-64 shrink-0 snap-start sm:w-72"><ProductCard {lang} product={p} /></li>
				{/each}
			</ul>
			{#if shown.length > 3}
				<div class="mt-2 flex gap-2">
					<button class="size-11 rounded-sm border border-cream-100/40" aria-label={t('common.prevPage')} onclick={() => scrollBy(-1)}>
						<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
					</button>
					<button class="size-11 rounded-sm border border-cream-100/40" aria-label={t('common.nextPage')} onclick={() => scrollBy(1)}>
						<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
</section>
