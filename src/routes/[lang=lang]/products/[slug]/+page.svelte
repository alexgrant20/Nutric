<script lang="ts">
	import { page } from '$app/state';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	import ProductCard from '$lib/components/site/ProductCard.svelte';
	let { data } = $props();
	const t = useT();
	const p = $derived(data.product);
	const images = $derived([p.mainImage, ...(p.gallery ?? [])].filter((x, i, a): x is string => !!x && a.indexOf(x) === i));
	let activeImage = $state(0);
	const contact = $derived(page.data.contact as string | null);
</script>

<svelte:head><title>{p.t.name}</title>{#if p.t.shortDescription}<meta name="description" content={p.t.shortDescription} />{/if}</svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
	<div class="grid gap-10 lg:grid-cols-2">
		<div>
			<div class="rounded-md bg-white p-6">
				<Img src={images[activeImage] ?? null} alt={p.t.imageAlt ?? p.t.name} loading="eager" class="mx-auto aspect-square w-full object-contain" />
			</div>
			{#if images.length > 1}
				<ul class="mt-3 flex gap-2">
					{#each images as src, i (src)}
						<li>
							<button onclick={() => (activeImage = i)} aria-label="{p.t.name} {i + 1}" aria-current={i === activeImage ? 'true' : undefined}
								class="size-16 rounded-sm bg-white p-1 {i === activeImage ? 'ring-2 ring-forest-700' : ''}">
								<Img {src} alt="" class="size-full object-contain" />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div>
			{#if data.collection}<a href="/{data.lang}/collections/{data.collection.slug}" class="text-sm text-stone-600 underline">{data.collection.t.name}</a>{/if}
			<h1 class="mt-1 font-serif text-4xl text-forest-700 sm:text-5xl">{p.t.name}</h1>
			{#if p.t.shortDescription}<p class="mt-3 text-lg text-stone-600">{p.t.shortDescription}</p>{/if}
			{#if p.t.benefits?.length}
				<h2 class="mt-8 text-lg font-semibold">{t('products.benefits')}</h2>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each p.t.benefits as b, i (i)}<li class="rounded-sm border border-forest-700/30 px-3 py-1 text-sm">{b}</li>{/each}
				</ul>
			{/if}
			{#if contact}
				<a href={contact} class="mt-8 inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-6 font-medium text-cream-100">{t('products.enquire')}</a>
			{/if}
		</div>
	</div>

	<div class="mt-16 space-y-12">
		{#if data.html.description}<section><h2 class="text-2xl font-semibold">{t('products.description')}</h2><div class="prose-md mt-3">{@html data.html.description}</div></section>{/if}
		{#if data.html.ingredients}<section><h2 class="text-2xl font-semibold">{t('products.ingredients')}</h2><div class="prose-md mt-3">{@html data.html.ingredients}</div></section>{/if}
		{#if data.html.howToUse}<section><h2 class="text-2xl font-semibold">{t('products.howToUse')}</h2><div class="prose-md mt-3">{@html data.html.howToUse}</div></section>{/if}
		{#if p.t.faqs?.length}
			<section>
				<h2 class="text-2xl font-semibold">{t('products.faqs')}</h2>
				<div class="mt-4 max-w-3xl divide-y divide-forest-700/20 border-y border-forest-700/20">
					{#each p.t.faqs as f, i (i)}
						<details class="group py-1">
							<summary class="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-medium">{f.q}</summary>
							<p class="pb-4 text-stone-600">{f.a}</p>
						</details>
					{/each}
				</div>
			</section>
		{/if}
		{#if p.t.regulatoryText}<p class="max-w-prose whitespace-pre-line text-sm text-stone-600">{p.t.regulatoryText}</p>{/if}
	</div>

	{#if data.related.length}
		<section class="mt-20">
			<h2 class="text-2xl font-semibold">{t('products.related')}</h2>
			<ul class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.related as r (r.id)}<li><ProductCard lang={data.lang} product={r} /></li>{/each}
			</ul>
		</section>
	{/if}
</div>
