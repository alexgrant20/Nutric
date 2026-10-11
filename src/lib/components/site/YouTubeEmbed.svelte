<script lang="ts">
	import { onDestroy } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';

	let { videoId, title, poster = null, index = 0, total = 1, onplay }: {
		videoId: string; title: string; poster?: string | null; index?: number; total?: number; onplay?: () => void;
	} = $props();
	const t = useT();
	let phase: 'idle' | 'loading' | 'ready' | 'error' = $state('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	function start() {
		phase = 'loading';
		onplay?.();
		timer = setTimeout(() => { if (phase === 'loading') phase = 'error'; }, 12000);
	}
	onDestroy(() => clearTimeout(timer));
	$effect(() => { videoId; phase = 'idle'; });
</script>

<div class="relative aspect-video w-full overflow-hidden rounded-md border border-cream-100/15 bg-forest-900">
	{#if phase === 'loading' || phase === 'ready'}
		<iframe class="absolute inset-0 size-full" title={title} src="https://www.youtube-nocookie.com/embed/{videoId}?autoplay=1&rel=0"
			allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen onload={() => { phase = 'ready'; clearTimeout(timer); }}></iframe>
	{/if}

	{#if phase === 'idle' || phase === 'loading'}
		<button onclick={start} disabled={phase === 'loading'} aria-label="{t('testimonials.play')}: {title}"
			class="group absolute inset-0 block text-left text-cream-100">
			<Img src={poster} alt="" class="yt-poster absolute inset-0 size-full bg-forest-700 object-cover" />
			<span class="poster-scrim absolute inset-0"></span>

			<span class="absolute left-1/2 top-[44%] flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cream-100 text-forest-900 ring-4 ring-cream-100/25 transition-transform duration-200 group-hover:scale-105 sm:top-1/2 sm:size-20 sm:ring-8 lg:size-24" aria-hidden="true">
				<svg viewBox="0 0 24 24" class="ml-0.5 size-6 sm:ml-1 sm:size-8 lg:size-9"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
			</span>

			<span class="yt-caption absolute inset-x-0 bottom-0 block p-3 sm:p-8">
				<span class="hidden text-sm tabular-nums text-cream-100/80 sm:block">{t('videos.count', { n: index + 1, total })}</span>
				<span class="block max-w-[28ch] font-serif text-[clamp(0.95rem,2.6vw+0.4rem,2.5rem)] leading-tight sm:mt-2 sm:max-w-[36ch]">{title}</span>
				{#if phase === 'loading'}<span class="mt-3 block text-sm" role="status">{t('testimonials.loading')}</span>{/if}
			</span>
		</button>
	{/if}

	{#if phase === 'error'}
		<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-cream-100" role="alert">
			<p>{t('testimonials.error')}</p>
			<a class="inline-flex min-h-11 items-center underline" href="https://www.youtube.com/watch?v={videoId}" target="_blank" rel="noopener noreferrer">{t('testimonials.openYoutube')}</a>
		</div>
	{/if}
</div>

<style>
	/* The poster, play button and caption sit at different depths: the pointer slides them against each other. */
	:global(.yt-poster) {
		transform: translate3d(calc(var(--px, 0) * -16px), calc(var(--py, 0) * -10px), 0) scale(1.1);
		transition: transform 0.35s ease-out;
	}
	.yt-caption {
		transform: translate3d(calc(var(--px, 0) * 12px), calc(var(--py, 0) * 8px), 0);
		transition: transform 0.35s ease-out;
	}
</style>
