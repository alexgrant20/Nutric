<script lang="ts">
	import { onMount } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	import { scrollProgress, tilt } from '../ui/motion';
	let { lang, settings, bestSeller }: { lang: string; settings: any; bestSeller: any } = $props();
	const t = useT();
	const tr = $derived(settings?.t);
	const line1 = $derived(tr?.headlineLine1 ?? tr?.tagline ?? settings?.brandName);
	const line2 = $derived(tr?.headlineLine2);
	const productImage = $derived(settings?.heroProductImage ?? bestSeller?.mainImage);
	let video: HTMLVideoElement | undefined = $state();
	onMount(() => {
		if (settings?.heroMediaType === 'video' && matchMedia('(prefers-reduced-motion: reduce)').matches && video) {
			const stop = () => video?.pause();
			video.autoplay = false;
			stop();
			video.addEventListener('canplay', stop, { once: true });
		}
	});
</script>

<section id="hero" use:tilt={{ max: 6 }} use:scrollProgress={{ mode: 'leave' }} class="on-dark relative isolate flex min-h-[100svh] flex-col overflow-hidden text-cream-100">
	<div class="depth-plane absolute inset-0 -z-20">
		{#if settings?.heroMedia && settings.heroMediaType === 'video'}
			<video bind:this={video} class="hero-media size-full object-cover" src={settings.heroMedia} autoplay muted loop playsinline preload="metadata"></video>
		{:else if settings?.heroMedia}
			<img src={settings.heroMedia} alt="" class="hero-media size-full object-cover" />
		{:else}
			<div class="size-full bg-forest-700"></div>
		{/if}
	</div>
	<div class="hero-scrim absolute inset-0 -z-10"></div>
	<div class="hero-floor absolute inset-x-0 bottom-0 -z-10 h-[38%]" aria-hidden="true"></div>

	<div class="flex flex-1 items-center">
	<div class="mx-auto grid w-full max-w-7xl items-center gap-4 px-4 pb-10 pt-28 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
		<h1 class="depth-text-l relative z-20 text-[clamp(2.5rem,7.4vw,6.6rem)] font-semibold leading-[0.95] lg:-mr-[4vw] lg:text-right">{line1}</h1>

		{#if productImage}
			<div class="relative z-10 mx-auto w-fit">
				<div class="depth-bottle">
					<Img src={productImage} alt={bestSeller?.t.imageAlt ?? bestSeller?.t.name ?? settings?.brandName} loading="eager"
						class="h-[40svh] w-auto object-contain lg:h-[56svh]" />
				</div>
				<div class="contact-shadow" aria-hidden="true"></div>
				{#if tr?.heroBadgeText}
					<div class="absolute -right-[4.5rem] top-2 grid size-24 sm:size-28 place-items-center rounded-full border border-cream-100/60 bg-forest-900/75 p-3 text-center text-sm lg:-right-24">
						{tr.heroBadgeText}
					</div>
				{/if}
			</div>
		{/if}

		<div class="depth-text-r max-w-md">
			{#if line2}<p class="text-[clamp(2.5rem,7vw,6rem)] font-semibold leading-none">{line2}</p>{/if}
			{#if tr?.subheadline}<p class="mt-5 text-cream-100/90">{tr.subheadline}</p>{/if}
			{#if bestSeller}
				<a href="/{lang}/products/{bestSeller.slug}" class="mt-7 inline-flex min-h-12 items-center rounded-full bg-lime-400 px-8 font-medium text-forest-900">
					{tr?.ctaLabel ?? t('hero.cta', { name: bestSeller.t.name })}
				</a>
			{/if}
		</div>
	</div>
	</div>
</section>
