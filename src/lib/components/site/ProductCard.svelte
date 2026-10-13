<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	import { tilt } from '../ui/motion';
	let { lang, product }: { lang: string; product: any } = $props();
	const t = useT();
</script>

<a href="/{lang}/products/{product.slug}" lang={product.usedLang !== lang ? product.usedLang : undefined} use:tilt={{ max: 7 }}
	class="group block h-full rounded-md bg-cream-100 p-2 text-ink-900 sm:p-4">
	<div class="relative aspect-[4/5] overflow-hidden rounded-sm bg-white">
		<Img src={product.mainImage} alt={product.t.imageAlt ?? product.t.name} class="card-pack size-full object-contain p-2 sm:p-4" />
		{#if product.isBestSeller}
			<span class="absolute left-2 top-2 rounded-sm bg-lime-400 px-2 py-1 text-xs font-medium text-forest-900">{t('bestSeller.label')}</span>
		{/if}
	</div>
	<h3 class="mt-3 font-serif text-base leading-snug text-forest-700 sm:mt-4 sm:text-xl">{product.t.name}</h3>
</a>

<style>
	/* The pack turns toward the pointer; the card itself stays flat. */
	:global(.card-pack) {
		transform: perspective(700px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition: transform 0.3s ease-out;
	}
</style>
