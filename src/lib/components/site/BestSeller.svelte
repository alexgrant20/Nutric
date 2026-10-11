<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	let { lang, product }: { lang: string; product: any } = $props();
	const t = useT();
</script>

<section id="best-seller" class="bg-cream-100 px-4 py-24 sm:px-6">
	<div class="relative mx-auto max-w-7xl rounded-md bg-white p-8 shadow-xl lg:p-14" use:reveal>
		<div class="grid items-center gap-10 lg:grid-cols-12">
			<div class="lg:col-span-6">
				<p class="inline-block rounded-sm bg-lime-400 px-2 py-1 text-xs font-medium text-forest-900">{t('bestSeller.label')}</p>
				<h2 class="mt-4 font-serif text-[clamp(2rem,4vw,3.5rem)] text-forest-700">{product.t.name}</h2>
				{#if product.t.shortDescription}<p class="mt-4 max-w-prose text-stone-600">{product.t.shortDescription}</p>{/if}
				{#if product.t.benefits?.length}
					<ul class="mt-6 flex flex-wrap gap-2">
						{#each product.t.benefits.slice(0, 3) as b, i (i)}
							<li class="rounded-sm border border-forest-700/30 px-3 py-1 text-sm">{b}</li>
						{/each}
					</ul>
				{/if}
				<a href="/{lang}/products/{product.slug}" class="mt-8 inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-6 font-medium text-cream-100">{t('bestSeller.view')}</a>
			</div>
			<div class="lg:col-span-6">
				<Img src={product.mainImage} alt={product.t.imageAlt ?? product.t.name}
					class="mx-auto h-[26rem] w-auto object-contain lg:-my-20 lg:h-[34rem] lg:translate-x-10" />
			</div>
		</div>
	</div>
</section>
