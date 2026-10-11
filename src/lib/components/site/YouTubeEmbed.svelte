<script lang="ts">
	import { onDestroy } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';

	let { videoId, title, poster = null, index = 0, total = 1 }: {
		videoId: string; title: string; poster?: string | null; index?: number; total?: number;
	} = $props();
	const t = useT();
	let phase: 'idle' | 'loading' | 'ready' | 'error' = $state('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	function start() {
		phase = 'loading';
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
			<Img src={poster} alt="" class="absolute inset-0 size-full bg-forest-700 object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
			<span class="poster-scrim absolute inset-0"></span>

			<span class="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cream-100 text-forest-900 ring-8 ring-cream-100/25 transition-transform duration-200 group-hover:scale-105 sm:size-24" aria-hidden="true">
				<svg viewBox="0 0 24 24" class="ml-1 size-8 sm:size-9"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
			</span>

			<span class="absolute inset-x-0 bottom-0 block p-5 sm:p-8">
				<span class="block text-sm tabular-nums text-cream-100/80">{t('videos.count', { n: index + 1, total })}</span>
				<span class="mt-2 block max-w-[28ch] font-serif text-[clamp(1.35rem,3vw,2.5rem)] leading-tight sm:max-w-[36ch]">{title}</span>
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
