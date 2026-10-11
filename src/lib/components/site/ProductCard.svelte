<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	let { lang, product }: { lang: string; product: any } = $props();
	const t = useT();
</script>

<a href="/{lang}/products/{product.slug}" lang={product.usedLang !== lang ? product.usedLang : undefined}
	class="group block h-full rounded-md bg-cream-100 p-4 text-ink-900">
	<div class="relative aspect-[4/5] overflow-hidden rounded-sm bg-white">
		<Img src={product.mainImage} alt={product.t.imageAlt ?? product.t.name} class="size-full object-contain p-4 transition-transform duration-200 group-hover:scale-[1.03]" />
		{#if product.isBestSeller}
			<span class="absolute left-2 top-2 rounded-sm bg-lime-400 px-2 py-1 text-xs font-medium text-forest-900">{t('bestSeller.label')}</span>
		{/if}
	</div>
	<h3 class="mt-4 font-serif text-xl text-forest-700">{product.t.name}</h3>
	{#if product.t.shortDescription}<p class="mt-1 line-clamp-2 text-sm text-stone-600">{product.t.shortDescription}</p>{/if}
</a>
