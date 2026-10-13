<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { scrollProgress, tilt } from '../ui/motion';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	let { lang, product }: { lang: string; product: any } = $props();
	const t = useT();
	// The brand word of the product name is set huge behind the pack, so the product stands in front of its own name.
	const word = $derived(String(product.t.name).split(/\s+/)[0].replace(/[®™]/g, ''));
	// Each registered mark is a small raised sign after its word, so the name reads cleanly.
	const nameParts = $derived(String(product.t.name).split(/([®™])/));
	const benefits = $derived((product.t.benefits ?? []).slice(0, 3));
</script>

<section id="best-seller" use:tilt={{ max: 9 }} use:scrollProgress class="relative overflow-hidden bg-cream-100 px-4 py-28 sm:px-6 sm:py-36">
	<p aria-hidden="true" class="giant-word pointer-events-none absolute inset-x-0 top-1/2 select-none whitespace-nowrap text-center font-serif leading-none">{word}</p>

	<div class="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12" use:reveal>
		<div class="lg:col-span-5">
			<p class="inline-block rounded-sm bg-lime-400 px-2 py-1 text-xs font-medium text-forest-900">{t('bestSeller.label')}</p>
			<h2 class="mt-5 font-serif text-[clamp(2.25rem,4.6vw,4.25rem)] leading-[1.05] text-forest-700">{#each nameParts as part, i (i)}{#if part === '®' || part === '™'}<sup class="mark">{part}</sup>{:else}{part}{/if}{/each}</h2>
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
					<p class="benefit-3d benefit-{i} absolute flex items-center gap-3 whitespace-nowrap rounded-full border border-forest-700/25 bg-cream-100 py-1.5 pl-1.5 pr-4 text-sm leading-snug text-forest-700 shadow-lg">
						<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest-700 text-lime-400" aria-hidden="true">
							{#if i === 0}
								<!-- Renewal: a cell that divides, with a ring of regrowth around it -->
								<svg viewBox="0 0 32 32" class="size-7"><path d="M26 11a11 11 0 0 0-19-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /><path d="M6 21a11 11 0 0 0 19 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /><path d="M7.5 3.5 6.5 9.5l6-.8M24.5 28.5l1-6-6 .8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /><circle cx="13.5" cy="16" r="3.6" fill="currentColor" /><circle cx="19.5" cy="16" r="3.6" fill="currentColor" opacity=".55" /></svg>
							{:else if i === 1}
								<!-- Strength: a shield with a rising core -->
								<svg viewBox="0 0 32 32" class="size-7"><path d="M16 3 6 7v8c0 7 4.2 11.6 10 14 5.8-2.4 10-7 10-14V7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" /><path d="M16 22V11m0 0-4.5 4.5M16 11l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
							{:else}
								<!-- Quality of life: a sunrise over open ground -->
								<svg viewBox="0 0 32 32" class="size-7"><path d="M5 22h22M9 22a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /><path d="M16 6v4M5.5 11.5l2.8 2.8M26.5 11.5l-2.8 2.8M3 17h3M26 17h3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /><path d="M10 27h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
							{/if}
						</span>
						<span>{b}</span>
					</p>
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
	.mark {
		font-size: 0.4em;
		vertical-align: super;
		line-height: 0;
		margin-right: 0.15em;
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
