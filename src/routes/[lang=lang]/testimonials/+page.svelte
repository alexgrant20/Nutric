<script lang="ts">
	import { tick } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import Img from '$lib/components/ui/Img.svelte';
	import YouTubeEmbed from '$lib/components/site/YouTubeEmbed.svelte';
	let { data } = $props();
	const t = useT();

	// One player up top, then a poster grid revealed a batch at a time, so 5 or 100 testimonials stay easy to scan.
	const BATCH = 12;
	let limit = $state(BATCH);
	let index = $state(0);
	let player: HTMLElement | undefined = $state();
	const items = $derived(data.items);
	const active = $derived(items[Math.min(index, items.length - 1)]);
	const visible = $derived(items.slice(0, limit));
	const num = (i: number) => String(i + 1).padStart(2, '0');

	async function pick(i: number) {
		index = i;
		await tick();
		player?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
	}
	async function more() {
		const first = limit;
		limit += BATCH;
		await tick();
		// Keyboard users land on the first newly shown card instead of the button that just moved down.
		document.getElementById(`review-${items[first]?.id}`)?.focus();
	}
</script>

<svelte:head><title>{t('reviews.title')}</title></svelte:head>

<section class="bg-cream-100 px-4 pb-24 pt-32 text-forest-700 sm:px-6 sm:pb-32">
	<div class="mx-auto max-w-7xl">
		<h1 class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none">{t('reviews.title')}</h1>

		{#if active}
			<div bind:this={player} class="mt-12 grid scroll-mt-24 gap-8 lg:grid-cols-12 lg:gap-12" aria-live="polite">
				<div class="lg:col-span-8">
					<YouTubeEmbed videoId={active.videoId!} title={active.t.title} poster={active.posterImage} {index} total={items.length} />
				</div>
				<div class="lg:col-span-4 lg:pt-2">
					<p class="text-sm tabular-nums text-stone-600">{num(index)} / {num(items.length - 1)}</p>
					{#if active.t.quote}
						<blockquote class="mt-3 font-serif text-[clamp(1.35rem,2.2vw,1.85rem)] leading-snug">“{active.t.quote}”</blockquote>
					{:else}
						<h2 class="mt-3 font-serif text-[clamp(1.35rem,2.2vw,1.85rem)] leading-snug">{active.t.title}</h2>
					{/if}
					{#if active.personName}
						<p class="mt-5 font-medium">{active.personName}</p>
						{#if active.role}<p class="text-sm text-stone-600">{active.role}</p>{/if}
					{/if}
				</div>
			</div>

			{#if items.length > 1}
				<div class="mt-20 border-t border-forest-700/20 pt-10">
					<h2 class="text-sm text-stone-600">{t('reviews.shown', { n: visible.length, total: items.length })}</h2>
					<ol class="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{#each visible as it, i (it.id)}
							<li>
								<button type="button" id="review-{it.id}" onclick={() => pick(i)} aria-current={i === index ? 'true' : undefined}
									class="group block w-full text-left">
									<span class="relative block aspect-video overflow-hidden rounded-md bg-forest-700/10 {i === index ? 'ring-2 ring-forest-700 ring-offset-2 ring-offset-cream-100' : ''}">
										<Img src={it.posterImage} alt="" class="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
										<span class="absolute bottom-2 left-2 rounded-sm bg-forest-900/80 px-2 py-0.5 text-xs tabular-nums text-cream-100">{i === index ? t('videos.nowShowing') : num(i)}</span>
									</span>
									<span class="mt-3 block font-medium group-hover:underline">{it.personName ?? it.t.title}</span>
									{#if it.personName && it.role}<span class="block text-sm text-stone-600">{it.role}</span>{/if}
									{#if it.t.quote}<span class="mt-2 line-clamp-2 block text-sm text-stone-700">“{it.t.quote}”</span>{/if}
								</button>
							</li>
						{/each}
					</ol>
					{#if limit < items.length}
						<div class="mt-12 flex justify-center">
							<button type="button" onclick={more} class="inline-flex min-h-12 items-center rounded-sm border border-forest-700/50 px-8 font-medium">
								{t('reviews.showMore')}
							</button>
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<p class="mt-10 text-stone-600">{t('common.empty')}</p>
		{/if}
	</div>
</section>
