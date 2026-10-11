<script lang="ts">
	import { onMount } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	let { lang, settings, bestSeller, testimonial }: { lang: string; settings: any; bestSeller: any; testimonial: any } = $props();
	const t = useT();
	const tr = $derived(settings?.t);
	const line1 = $derived(tr?.headlineLine1 ?? tr?.tagline ?? settings?.brandName);
	const line2 = $derived(tr?.headlineLine2);
	const productImage = $derived(settings?.heroProductImage ?? bestSeller?.mainImage);
	let video: HTMLVideoElement | undefined = $state();
	let paused = $state(false);
	onMount(() => {
		if (settings?.heroMediaType === 'video' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
			video?.pause();
			paused = true;
		}
	});
	function toggle() {
		if (!video) return;
		if (video.paused) { video.play(); paused = false; } else { video.pause(); paused = true; }
	}
</script>

<section id="hero" class="on-dark relative isolate flex min-h-[100svh] items-center overflow-hidden text-cream-100">
	{#if settings?.heroMedia && settings.heroMediaType === 'video'}
		<video bind:this={video} class="hero-media absolute inset-0 -z-20 size-full object-cover" src={settings.heroMedia} autoplay muted loop playsinline preload="metadata"></video>
	{:else if settings?.heroMedia}
		<img src={settings.heroMedia} alt="" class="hero-media absolute inset-0 -z-20 size-full object-cover" />
	{:else}
		<div class="absolute inset-0 -z-20 bg-forest-700"></div>
	{/if}
	<div class="hero-scrim absolute inset-0 -z-10"></div>

	<div class="mx-auto grid w-full max-w-7xl items-center gap-4 px-4 pb-40 pt-28 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
		<h1 class="text-[clamp(2.5rem,7vw,6rem)] font-semibold leading-none lg:text-right">{line1}</h1>

		{#if productImage}
			<div class="relative mx-auto">
				<Img src={productImage} alt={bestSeller?.t.imageAlt ?? bestSeller?.t.name ?? settings?.brandName} loading="eager"
					class="h-[44svh] w-auto object-contain lg:h-[62svh]" />
				{#if tr?.heroBadgeText}
					<div class="absolute -right-4 top-6 grid size-28 place-items-center rounded-full border border-cream-100/60 bg-forest-900/70 p-3 text-center text-sm lg:-right-16">
						{tr.heroBadgeText}
					</div>
				{/if}
			</div>
		{/if}

		<div class="max-w-md">
			{#if line2}<p class="text-[clamp(2.5rem,7vw,6rem)] font-semibold leading-none">{line2}</p>{/if}
			{#if tr?.subheadline}<p class="mt-5 text-cream-100/90">{tr.subheadline}</p>{/if}
			{#if bestSeller}
				<a href="/{lang}/products/{bestSeller.slug}" class="mt-7 inline-flex min-h-12 items-center rounded-full bg-lime-400 px-8 font-medium text-forest-900">
					{tr?.ctaLabel ?? t('hero.cta', { name: bestSeller.t.name })}
				</a>
			{/if}
		</div>
	</div>

	{#if testimonial}
		<a href="/{lang}/testimonials" class="absolute bottom-8 left-4 w-[min(20rem,calc(100%-2rem))] rounded-md border border-cream-100/25 bg-cream-100/10 p-4 backdrop-blur-md sm:left-6">
			<span class="text-xs text-cream-100/80">{t('nav.testimonials')}</span>
			<span class="mt-1 block font-serif text-lg leading-snug">{testimonial.t.title}</span>
			<span class="mt-2 inline-block text-sm underline">{t('testimonials.play')}</span>
		</a>
	{/if}

	{#if settings?.heroMedia && settings.heroMediaType === 'video'}
		<button onclick={toggle} class="absolute bottom-8 right-4 min-h-11 rounded-sm border border-cream-100/40 px-4 text-sm sm:right-6">
			{paused ? t('hero.play') : t('hero.pause')}
		</button>
	{/if}
</section>
