<script lang="ts">
	import { onMount } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import { prefersReducedMotion, scrollProgress, tilt } from '../ui/motion';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	import YouTubeEmbed from './YouTubeEmbed.svelte';

	// A cinema carousel: the chosen video is the large centre screen, the others recede on an arc in perspective.
	// layout "gallery" (Videos page) adds a poster gallery of every video below the carousel.
	let { lang, items, layout = 'rail', page = false }: { lang: string; items: any[]; layout?: 'rail' | 'gallery'; page?: boolean } = $props();
	const t = useT();
	let index = $state(0);
	let playing = $state(false);
	let flat = $state(false);
	let stage: HTMLElement | undefined = $state();
	let startX = 0;
	let dragged = false;
	onMount(() => { flat = prefersReducedMotion(); });

	const active = $derived(items[Math.min(index, items.length - 1)]);
	const go = (to: number) => {
		const next = Math.max(0, Math.min(items.length - 1, to));
		if (next !== index) { index = next; playing = false; }
	};
	const num = (i: number) => String(i + 1).padStart(2, '0');

	function key(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
		if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
		if (e.key === 'Home') { e.preventDefault(); go(0); }
		if (e.key === 'End') { e.preventDefault(); go(items.length - 1); }
	}
	function down(e: PointerEvent) { startX = e.clientX; dragged = false; }
	function up(e: PointerEvent) {
		const dx = e.clientX - startX;
		if (!playing && Math.abs(dx) > 56) { dragged = true; go(index + (dx < 0 ? 1 : -1)); }
	}
	function swallow(e: MouseEvent) { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }
	function pick(i: number) {
		go(i);
		const calm = prefersReducedMotion();
		stage?.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
	}
</script>

<section id="testimonials" use:scrollProgress class="on-dark relative overflow-hidden bg-forest-900 px-4 py-24 text-cream-100 sm:px-6 sm:py-32">
	<div class="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4" use:reveal>
		<svelte:element this={page ? 'h1' : 'h2'} class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none">{t('testimonials.title')}</svelte:element>
		{#if !page}<a href="/{lang}/videos" class="inline-flex min-h-12 items-center rounded-sm border border-cream-100/50 px-6 font-medium">{t('videos.viewAll')}</a>{/if}
	</div>

	{#if active}
		<div class="vc-wrap mx-auto mt-12 max-w-7xl">
			{#if flat}
				<!-- Reduced motion: one flat screen, previous and next buttons only. -->
				<div class="mx-auto max-w-5xl">
					<YouTubeEmbed videoId={active.videoId} title={active.t.title} poster={active.posterImage} index={index} total={items.length} />
				</div>
			{:else}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div bind:this={stage} use:tilt={{ max: 5 }} class="vc-stage" role="group" aria-roledescription="carousel" aria-label={t('videos.all')}
					tabindex="0" onkeydown={key} onpointerdown={down} onpointerup={up} onclickcapture={swallow}>
					{#each items as it, i (it.id)}
						{@const d = i - index}
						<div class="vc-card" class:vc-dim={playing && d !== 0} data-far={Math.abs(d) > 2} style="--d: {d}; --abs: {Math.abs(d)}">
							{#if d === 0}
								<div class="vc-screen">
									<YouTubeEmbed videoId={it.videoId} title={it.t.title} poster={it.posterImage} index={i} total={items.length} onplay={() => (playing = true)} />
								</div>
							{:else}
								<button type="button" onclick={() => go(i)} tabindex={Math.abs(d) <= 2 ? 0 : -1} aria-label={it.t.title} class="vc-side">
									<Img src={it.posterImage} alt="" class="size-full object-cover" />
									<span class="vc-side-scrim" aria-hidden="true"></span>
									<span class="vc-side-num" aria-hidden="true">{num(i)}</span>
								</button>
							{/if}
							<span class="vc-floor" aria-hidden="true"></span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- The explanation for the chosen video, so each one says what it is about before it is played. -->
			<div class="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-12" aria-live="polite">
				<p class="text-sm tabular-nums text-cream-100/80 lg:col-span-3">{num(index)} · {t('videos.about')}</p>
				<div class="lg:col-span-9">
					<h3 class="font-serif text-2xl leading-snug sm:text-3xl">{active.t.title}</h3>
					{#if active.t.quote}<p class="mt-3 max-w-prose text-lg text-cream-100/90">{active.t.quote}</p>{/if}
					{#if active.personName}<p class="mt-2 text-sm text-cream-100/80">{active.personName}{active.role ? `, ${active.role}` : ''}</p>{/if}
				</div>
			</div>

			<div class="mt-8 flex items-center justify-center gap-3">
				<button type="button" class="size-12 rounded-sm border border-cream-100/40 disabled:opacity-40" aria-label={t('videos.prev')} disabled={index === 0} onclick={() => go(index - 1)}>
					<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
				</button>
				<p class="min-w-28 text-center text-sm tabular-nums text-cream-100/80">{t('videos.count', { n: index + 1, total: items.length })}</p>
				<button type="button" class="size-12 rounded-sm border border-cream-100/40 disabled:opacity-40" aria-label={t('videos.next')} disabled={index === items.length - 1} onclick={() => go(index + 1)}>
					<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
				</button>
			</div>
		</div>

		{#if layout === 'gallery'}
			<div class="mx-auto mt-20 max-w-7xl">
				<h2 class="text-sm text-cream-100/70">{t('videos.all')}</h2>
				<ol class="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
					{#each items as it, i (it.id)}
						<li use:reveal style="--d: {(i % 3) * 90}ms">
							<button type="button" onclick={() => pick(i)} aria-current={i === index ? 'true' : undefined} class="vg-card group block w-full text-left" use:tilt={{ max: 7 }}>
								<span class="vg-poster relative block aspect-video overflow-hidden rounded-md bg-forest-700 {i === index ? 'ring-2 ring-cream-100' : ''}">
									<Img src={it.posterImage} alt="" class="size-full object-cover" />
								</span>
								<span class="mt-3 block text-xs tabular-nums text-cream-100/70">{num(i)}{i === index ? ` · ${t('videos.nowShowing')}` : ''}</span>
								<span class="mt-1 block font-serif text-xl leading-snug">{it.t.title}</span>
								{#if it.t.quote}<span class="mt-2 line-clamp-3 block text-sm text-cream-100/80">{it.t.quote}</span>{/if}
							</button>
						</li>
					{/each}
				</ol>
			</div>
		{/if}
	{/if}
</section>

<style>
	/* The whole stage tips up into place as the section scrolls into view. */
	.vc-wrap {
		transform: perspective(1500px) rotateX(calc((1 - min(1, var(--p, 1) / 0.42)) * 12deg));
		transform-origin: 50% 100%;
	}
	.vc-stage {
		position: relative;
		container-type: inline-size;
		perspective: 1700px;
		height: clamp(16rem, 36cqw + 4rem, 38rem);
		touch-action: pan-y;
		cursor: grab;
		border-radius: 0.25rem;
	}
	.vc-stage:active {
		cursor: grabbing;
	}
	.vc-card {
		--w: min(62cqw, 56rem);
		position: absolute;
		left: 50%;
		top: 0;
		width: var(--w);
		margin-left: calc(var(--w) / -2);
		z-index: calc(10 - var(--abs));
		transform: translate3d(calc(var(--d) * 41cqw), 0, calc(var(--abs) * -240px)) rotateY(calc(var(--d) * -30deg))
			scale(calc(1 - var(--abs) * 0.02));
		opacity: calc(1 - var(--abs) * 0.32);
		transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.5s ease;
		will-change: transform;
	}
	/* Phones: the centre screen takes most of the width and the neighbours peek in from the sides. */
	@container (max-width: 40rem) {
		.vc-card {
			--w: 84cqw;
			transform: translate3d(calc(var(--d) * 62cqw), 0, calc(var(--abs) * -200px)) rotateY(calc(var(--d) * -26deg))
				scale(calc(1 - var(--abs) * 0.02));
		}
		.vc-stage {
			height: calc(84cqw * 0.5625 + 1.25rem);
		}
	}
	.vc-card[data-far='true'] {
		opacity: 0;
		pointer-events: none;
	}
	.vc-dim {
		opacity: 0.18 !important;
	}
	/* The active screen leans toward the pointer; the side screens stay put. */
	.vc-screen {
		transform: perspective(1400px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition: transform 0.3s ease-out;
		transform-style: preserve-3d;
	}
	.vc-side {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: 0.75rem;
		background: var(--forest-700);
	}
	.vc-side-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, color-mix(in srgb, var(--forest-900) 80%, transparent), color-mix(in srgb, var(--forest-900) 25%, transparent));
	}
	.vc-side-num {
		position: absolute;
		left: 1rem;
		bottom: 0.75rem;
		font-family: var(--font-serif-stack);
		font-size: clamp(1.75rem, 4cqw, 3rem);
		line-height: 1;
		color: var(--cream-100);
	}
	/* Each screen casts a soft shadow on the floor under it. */
	.vc-floor {
		position: absolute;
		left: 8%;
		right: 8%;
		bottom: -1.4rem;
		height: 1.6rem;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(0 0 0 / 0.55), transparent);
		filter: blur(6px);
		pointer-events: none;
	}
	.vg-card {
		transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition: transform 0.3s ease-out;
	}
	.vg-poster :global(img) {
		transition: transform 0.5s ease-out;
	}
	.vg-card:hover .vg-poster :global(img) {
		transform: scale(1.06);
	}
</style>
