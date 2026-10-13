<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { prefersReducedMotion } from '../ui/motion';
	import Dialog from '../ui/Dialog.svelte';
	import Img from '../ui/Img.svelte';

	let { lang, items, expanded = false }: { lang: string; items: any[]; expanded?: boolean } = $props();
	const t = useT();

	// Newest first: the gallery opens on the latest recognition and the history recedes down the corridor.
	const sorted = $derived([...items].sort((a, b) => (b.year ?? -1) - (a.year ?? -1) || a.sortOrder - b.sortOrder));
	let mode: 'loading' | 'webgl' | 'flat' = $state('loading');
	let station = $state(0);
	let selected: any = $state(null);
	let dialog: Dialog | undefined = $state();
	let host: HTMLElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();
	let scene: { goTo(i: number): void; step(d: number): void } | null = null;
	const current = $derived(sorted[Math.min(station, sorted.length - 1)]);

	function show(it: any) { selected = it; dialog?.show(); }
	const hasCaption = (it: any) => !!(it.issuer || it.t.description);

	function webglAvailable() {
		try {
			const c = document.createElement('canvas');
			return !!(c.getContext('webgl2') || c.getContext('webgl'));
		} catch {
			return false;
		}
	}
	function key(e: KeyboardEvent) {
		if (!scene) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); scene.step(1); }
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); scene.step(-1); }
		else if (e.key === 'Home') { e.preventDefault(); scene.goTo(0); }
		else if (e.key === 'End') { e.preventDefault(); scene.goTo(sorted.length - 1); }
		else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (current) show(current); }
	}

	let started = false;
	// Runs once the stage element exists (bind:this is set after mount).
	$effect(() => {
		if (!host || started) return;
		started = true;
		if (prefersReducedMotion() || !webglAvailable()) { mode = 'flat'; return; }
		let disposed = false;
		let starting = false;
		let live: { setVisible(v: boolean): void; resize(w: number, h: number): void; dispose(): void } | null = null;
		const fit = () => { if (live && host) live.resize(host.clientWidth, host.clientHeight); };

		// three.js is loaded only when the gallery is about to come into view.
		const io = new IntersectionObserver(async ([entry]) => {
			if (entry.isIntersecting && !live && !starting) {
				starting = true;
				try {
					const [three, mod] = await Promise.all([import('three'), import('./accolade-scene')]);
					if (disposed || !canvas) return;
					const css = getComputedStyle(document.documentElement);
					const val = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
					const built = new mod.AccoladeScene(
						three,
						canvas,
						sorted.map((it) => ({ id: it.id, image: it.image, year: it.year ?? null })),
						{
							colors: { cream: val('--cream-100', '#F4F1E8'), forest: val('--forest-700', '#1F3B2A'), forestDark: val('--forest-900', '#12241A') },
							onStation: (i) => { station = i; },
							onPick: (id) => { const it = sorted.find((x) => x.id === id); if (it) show(it); }
						}
					);
					live = built;
					scene = built;
					mode = 'webgl';
					fit();
					built.setVisible(true);
				} catch (err) {
					mode = 'flat';
				}
			}
			live?.setVisible(entry.isIntersecting);
		}, { rootMargin: '300px' });
		if (host) io.observe(host);
		const ro = new ResizeObserver(fit);
		if (host) ro.observe(host);
		return () => {
			disposed = true;
			io.disconnect();
			ro.disconnect();
			live?.dispose();
			scene = null;
		};
	});
</script>

<section id="accolades" class="relative overflow-hidden bg-cream-100 px-4 py-24 sm:px-6 sm:py-32">
	<div class="mx-auto max-w-7xl">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<svelte:element this={expanded ? 'h1' : 'h2'} class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none text-forest-700">{t('accolades.title')}</svelte:element>
			{#if !expanded}<a href="/{lang}/accolades" class="inline-flex min-h-12 items-center rounded-sm border border-forest-700/50 px-6 font-medium text-forest-700">{t('accolades.viewAll')}</a>{/if}
		</div>

		{#if mode === 'flat'}
			<!-- No WebGL, or reduced motion: a plain shelf of the same trophies. -->
			<ul class="mt-12 flex items-end gap-10 overflow-x-auto pb-8">
				{#each sorted as it (it.id)}
					<li class="shrink-0 text-center">
						<button type="button" onclick={() => show(it)} class="block" aria-label={it.t.title}>
							<Img src={it.image} alt={it.t.imageAlt ?? it.t.title} class="mx-auto h-auto max-h-60 w-auto max-w-[78vw]" />
						</button>
						{#if it.year}<p class="mt-3 font-serif text-xl tabular-nums text-forest-700">{it.year}</p>{/if}
						{#if hasCaption(it)}<p class="mx-auto mt-1 max-w-[12rem] text-sm text-stone-600">{it.issuer ?? ''}{expanded && it.t.description ? ` ${it.t.description}` : ''}</p>{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div bind:this={host} tabindex="0" role="group" aria-roledescription="carousel" aria-label={t('accolades.gallery')} onkeydown={key}
				class="stage relative mt-12 overflow-hidden rounded-md border border-forest-700/15">
				<canvas bind:this={canvas} class="block size-full touch-pan-y cursor-grab" aria-hidden="true"></canvas>

				{#if mode === 'loading'}
					<p class="absolute inset-0 flex items-center justify-center text-stone-600" role="status">{t('accolades.loading')}</p>
				{:else if current}
					<div class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-6">
						<div>
							{#if current.year}<p class="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-none tabular-nums text-forest-700">{current.year}</p>{/if}
							<p class="mt-1 text-sm tabular-nums text-stone-600">{t('accolades.count', { n: station + 1, total: sorted.length })}</p>
						</div>
						<div class="pointer-events-auto flex items-center gap-2">
							<button type="button" class="size-12 rounded-sm border border-forest-700/40 bg-cream-100 text-forest-700 disabled:opacity-40" aria-label={t('accolades.prev')} disabled={station === 0} onclick={() => scene?.step(-1)}>
								<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
							</button>
							<button type="button" class="min-h-12 rounded-sm bg-forest-700 px-5 font-medium text-cream-100" onclick={() => show(current)}>{t('accolades.view')}</button>
							<button type="button" class="size-12 rounded-sm border border-forest-700/40 bg-cream-100 text-forest-700 disabled:opacity-40" aria-label={t('accolades.next')} disabled={station === sorted.length - 1} onclick={() => scene?.step(1)}>
								<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
							</button>
						</div>
					</div>
					<p class="pointer-events-none absolute left-4 top-4 hidden text-sm text-stone-600 sm:block">{t('accolades.hint')}</p>
				{/if}
				<p class="sr-only" aria-live="polite">{current ? `${current.year ?? ''} ${t('accolades.count', { n: station + 1, total: sorted.length })}` : ''}</p>
			</div>

			{#if current && mode === 'webgl'}
				<div class="mt-6 grid gap-2 lg:grid-cols-12" aria-live="polite">
					<p class="font-serif text-2xl tabular-nums text-forest-700 lg:col-span-2">{current.year ?? ''}</p>
					<div class="lg:col-span-8">
						<h3 class="font-serif text-xl text-forest-700 sm:text-2xl">{current.t.title}</h3>
						{#if current.issuer}<p class="mt-1 text-sm text-stone-600">{t('accolades.issuedBy', { issuer: current.issuer })}</p>{/if}
						{#if current.t.description}<p class="mt-2 max-w-prose text-stone-700">{current.t.description}</p>{/if}
					</div>
				</div>
			{/if}

			<ol class="sr-only">
				{#each sorted as it (it.id)}
					<li><button type="button" onclick={() => show(it)}>{it.year ?? ''} {it.t.title}</button></li>
				{/each}
			</ol>
		{/if}

		{#if expanded}
			<!-- The full record: every accolade with its explanation, newest first. -->
			<div class="mt-20 border-t border-forest-700/25 pt-10">
				<h2 class="font-serif text-3xl text-forest-700">{t('accolades.record')}</h2>
				<ol class="mt-8">
					{#each sorted as it (it.id)}
						<li class="grid gap-4 border-t border-forest-700/15 py-8 sm:grid-cols-[5.5rem_9rem_1fr] sm:gap-8 lg:grid-cols-[7rem_11rem_1fr]">
							<p class="font-serif text-3xl tabular-nums text-forest-700">{it.year ?? ''}</p>
							<button type="button" onclick={() => show(it)} class="block self-start rounded-sm bg-white/60 p-3" aria-label="{t('accolades.view')}: {it.t.title}">
								<Img src={it.image} alt={it.t.imageAlt ?? it.t.title} class="mx-auto max-h-44 w-auto" />
							</button>
							<div>
								<h3 class="font-serif text-xl text-forest-700 sm:text-2xl">{it.t.title}</h3>
								{#if it.issuer}<p class="mt-1 text-sm text-stone-600">{t('accolades.issuedBy', { issuer: it.issuer })}</p>{/if}
								{#if it.t.description}<p class="mt-3 max-w-prose text-stone-700">{it.t.description}</p>{/if}
							</div>
						</li>
					{/each}
				</ol>
			</div>
		{/if}
	</div>
</section>

<Dialog bind:this={dialog} label={selected?.t.title ?? t('accolades.title')}>
	{#if selected}
		<div class="flex justify-end">
			<button onclick={() => dialog?.close()} class="min-h-11 rounded-sm border border-forest-700/40 px-4">{t('accolades.close')}</button>
		</div>
		<Img src={selected.image} alt={selected.t.imageAlt ?? selected.t.title} class="mx-auto mt-2 max-h-[70vh] w-auto" />
		<h3 class="mt-4 font-serif text-2xl text-forest-700">{selected.t.title}</h3>
		{#if selected.year}<p class="text-sm tabular-nums text-stone-600">{selected.year}</p>{/if}
		{#if selected.issuer}<p class="text-sm text-stone-600">{t('accolades.issuedBy', { issuer: selected.issuer })}</p>{/if}
		{#if selected.t.description}<p class="mt-2">{selected.t.description}</p>{/if}
	{/if}
</Dialog>

<style>
	/* A lit studio: soft light falls from above onto the corridor. */
	.stage {
		height: clamp(28rem, 78svh, 48rem);
		background:
			radial-gradient(ellipse 70% 55% at 50% 12%, color-mix(in srgb, white 70%, var(--cream-100)), transparent 70%),
			var(--cream-100);
		touch-action: pan-y;
	}
</style>
