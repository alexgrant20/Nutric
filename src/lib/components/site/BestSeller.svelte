<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { scrollProgress, tilt } from '../ui/motion';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	let { lang, product }: { lang: string; product: any } = $props();
	const t = useT();
	// The brand word of the product name is set huge behind the pack, so the product stands in front of its own name.
	const word = $derived(String(product.t.name).split(/\s+/)[0]);
	const benefits = $derived((product.t.benefits ?? []).slice(0, 3));
</script>

<section id="best-seller" use:tilt={{ max: 9 }} use:scrollProgress class="relative overflow-hidden bg-cream-100 px-4 py-28 sm:px-6 sm:py-36">
	<p aria-hidden="true" class="giant-word pointer-events-none absolute inset-x-0 top-1/2 select-none whitespace-nowrap text-center font-serif leading-none">{word}</p>

	<div class="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12" use:reveal>
		<div class="lg:col-span-5">
			<p class="inline-block rounded-sm bg-lime-400 px-2 py-1 text-xs font-medium text-forest-900">{t('bestSeller.label')}</p>
			<h2 class="mt-5 font-serif text-[clamp(2.25rem,4.6vw,4.25rem)] leading-[1.05] text-forest-700">{product.t.name}</h2>
			{#if product.t.shortDescription}<p class="mt-5 max-w-prose text-lg text-stone-600">{product.t.shortDescription}</p>{/if}
			{#if benefits.length}
				<ul class="mt-6 flex flex-wrap gap-2 sm:hidden">
					{#each benefits as b, i (i)}<li class="rounded-sm border border-forest-700/30 px-3 py-1 text-sm text-forest-700">{b}</li>{/each}
				</ul>
			{/if}
			<a href="/{lang}/products/{product.slug}" class="mt-9 inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-7 font-medium text-cream-100">{t('bestSeller.view')}</a>
		</div>

		<div class="relative lg:col-span-7">
			<div class="stage-3d relative mx-auto w-fit">
				<div class="pack-3d">
					<Img src={product.mainImage} alt={product.t.imageAlt ?? product.t.name} class="mx-auto h-[26rem] w-auto object-contain sm:h-[32rem] lg:h-[38rem]" />
				</div>
				<div class="contact-shadow" aria-hidden="true"></div>

				{#each benefits as b, i (i)}
					<p class="benefit-3d benefit-{i} absolute max-w-[11rem] rounded-sm border border-forest-700/25 bg-cream-100 px-3 py-2 text-sm leading-snug text-forest-700 shadow-lg">{b}</p>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.giant-word {
		font-size: clamp(5.5rem, 17.5vw, 17rem);
		color: color-mix(in srgb, var(--forest-700) 8%, transparent);
		transform: translate3d(calc((var(--p, 0.5) - 0.5) * -14%), -50%, 0);
	}
	.stage-3d {
		perspective: 1200px;
	}
	.pack-3d {
		transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition: transform 0.3s ease-out;
		will-change: transform;
	}
	.benefit-3d {
		transition: transform 0.3s ease-out;
	}
	.benefit-0 {
		right: calc(100% - 1.5rem);
		top: 16%;
		transform: translate3d(calc(var(--px, 0) * 26px), calc(var(--py, 0) * 12px), 0);
	}
	.benefit-1 {
		left: calc(100% - 1.5rem);
		top: 40%;
		transform: translate3d(calc(var(--px, 0) * 40px), calc(var(--py, 0) * 18px), 0);
	}
	.benefit-2 {
		right: calc(100% - 3rem);
		bottom: 14%;
		transform: translate3d(calc(var(--px, 0) * 18px), calc(var(--py, 0) * 8px), 0);
	}
	@media (max-width: 640px) {
		.benefit-3d {
			display: none;
		}
	}
</style>
