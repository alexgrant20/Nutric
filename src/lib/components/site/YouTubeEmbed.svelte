<script lang="ts">
	import { onDestroy } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import Img from '../ui/Img.svelte';
	let { videoId, title, poster = null }: { videoId: string; title: string; poster?: string | null } = $props();
	const t = useT();
	let state: 'idle' | 'loading' | 'ready' | 'error' = $state('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;
	function start() {
		state = 'loading';
		timer = setTimeout(() => { if (state === 'loading') state = 'error'; }, 12000);
	}
	onDestroy(() => clearTimeout(timer));
	$effect(() => { videoId; state = 'idle'; });
</script>

<div class="relative aspect-video w-full overflow-hidden rounded-md bg-forest-900">
	{#if state === 'idle' || state === 'loading' || state === 'ready'}
		{#if state !== 'idle'}
			<iframe class="absolute inset-0 size-full" title={title} src="https://www.youtube-nocookie.com/embed/{videoId}?autoplay=1&rel=0"
				allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen onload={() => { state = 'ready'; clearTimeout(timer); }}></iframe>
		{/if}
		{#if state !== 'ready'}
			<button onclick={start} disabled={state === 'loading'} class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-cream-100">
				{#if poster}<Img src={poster} alt="" class="absolute inset-0 -z-10 size-full object-cover opacity-70" />{/if}
				<span class="flex size-16 items-center justify-center rounded-full bg-cream-100 text-forest-900" aria-hidden="true">
					<svg viewBox="0 0 24 24" class="size-7"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
				</span>
				<span class="px-4 text-center">{state === 'loading' ? t('testimonials.loading') : t('testimonials.play')}: {title}</span>
			</button>
		{/if}
	{:else}
		<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-cream-100" role="alert">
			<p>{t('testimonials.error')}</p>
			<a class="underline" href="https://www.youtube.com/watch?v={videoId}" target="_blank" rel="noopener noreferrer">{t('testimonials.openYoutube')}</a>
		</div>
	{/if}
</div>
