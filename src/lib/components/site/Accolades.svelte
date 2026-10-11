<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import { prefersReducedMotion, tilt } from '../ui/motion';
	import Dialog from '../ui/Dialog.svelte';
	import Img from '../ui/Img.svelte';

	let { lang, items, expanded = false }: { lang: string; items: any[]; expanded?: boolean } = $props();
	const t = useT();
	let selected: any = $state(null);
	let dialog: Dialog | undefined = $state();

	let pinned = $state(false);
	let travel = $state(0);
	let currentYear: number | null = $state(null);
	let section: HTMLElement | undefined = $state();
	let viewport: HTMLElement | undefined = $state();
	let track: HTMLElement | undefined = $state();
	let els: HTMLElement[] = $state([]);
	let raf = 0;

	// Newest year first: the cabinet opens on the latest recognition and the history runs to the right.
	const groups = $derived.by(() => {
		const map = new Map<number | null, any[]>();
		for (const it of items) map.set(it.year ?? null, [...(map.get(it.year ?? null) ?? []), it]);
		return [...map.entries()].sort((a, b) => (b[0] ?? -1) - (a[0] ?? -1));
	});
	const flat = $derived(groups.flatMap(([year, list]) => list.map((it) => ({ it, year }))));
	const indexOf = (id: number) => flat.findIndex((x) => x.it.id === id);
	function show(it: any) { selected = it; dialog?.show(); }
	// Titles generated from the file name carry no information, so they are not printed under the trophy.
	const hasCaption = (it: any) => !!(it.issuer || it.t.description);
	const clamp = (v: number) => Math.min(1, Math.max(0, v));

	function measure() {
		if (!track || !viewport) return;
		travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
	}
	/* Scroll drives a camera along the cabinet: the section is pinned, the track slides sideways, and every trophy
	   turns toward the viewer and comes forward as it passes the centre. */
	function frame() {
		raf = 0;
		if (!pinned || !section || !viewport) return;
		const r = section.getBoundingClientRect();
		const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
		section.style.setProperty('--p', p.toFixed(4));
		const vw = viewport.clientWidth;
		let best = Infinity;
		let year: number | null = currentYear;
		flat.forEach((entry, i) => {
			const el = els[i];
			if (!el) return;
			const center = el.offsetLeft + el.offsetWidth / 2 - p * travel;
			const c = (center - vw / 2) / (vw / 2);
			el.style.setProperty('--c', Math.max(-1.6, Math.min(1.6, c)).toFixed(3));
			el.style.setProperty('--a', Math.min(1, Math.abs(c)).toFixed(3));
			if (Math.abs(c) < best) { best = Math.abs(c); year = entry.year; }
		});
		if (year !== currentYear) currentYear = year;
	}
	const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

	onMount(() => {
		pinned = !prefersReducedMotion();
		if (!pinned) return;
		tick().then(() => { measure(); frame(); });
		addEventListener('scroll', schedule, { passive: true });
		const onResize = () => { measure(); schedule(); };
		addEventListener('resize', onResize);
		return () => {
			cancelAnimationFrame(raf);
			removeEventListener('scroll', schedule);
			removeEventListener('resize', onResize);
		};
	});

	// A keyboard user tabbing to an off-screen trophy brings it to the centre by scrolling the page to its position.
	function bring(i: number) {
		if (!pinned || !section || !viewport || !travel) return;
		const el = els[i];
		const p = clamp((el.offsetLeft + el.offsetWidth / 2 - viewport.clientWidth / 2) / travel);
		const top = section.getBoundingClientRect().top + window.scrollY;
		window.scrollTo({ top: top + p * (section.offsetHeight - window.innerHeight), behavior: 'auto' });
	}
</script>

<section id="accolades" bind:this={section} class="acc relative bg-cream-100" class:acc-pinned={pinned} style="--travel: {travel}px">
	<div class="acc-pin relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24">
		<div class="relative mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-4">
			<svelte:element this={expanded ? 'h1' : 'h2'} class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none text-forest-700">{t('accolades.title')}</svelte:element>
			{#if !expanded}<a href="/{lang}/accolades" class="inline-flex min-h-11 items-center text-forest-700 underline underline-offset-4">{t('accolades.title')}</a>{/if}
		</div>

		{#if pinned && currentYear}
			<p class="acc-year pointer-events-none absolute inset-x-0 top-1/2 select-none text-center font-serif tabular-nums leading-none" aria-hidden="true">{currentYear}</p>
		{/if}
		<div class="acc-floor" aria-hidden="true"></div>

		<div bind:this={viewport} class="acc-viewport relative mt-12" class:overflow-x-auto={!pinned}>
			<ol bind:this={track} class="acc-track relative flex min-w-max items-end gap-14 pb-12">
				{#each groups as [year, list] (year)}
					<li class="flex flex-col gap-4">
						{#if year}<p class="font-serif text-2xl tabular-nums text-forest-700">{year}</p>{/if}
						<ul class="flex items-end gap-10">
							{#each list as it (it.id)}
								<li class="trophy" bind:this={els[indexOf(it.id)]} use:tilt={{ max: 11 }}>
									<button type="button" onclick={() => show(it)} onfocus={() => bring(indexOf(it.id))} class="group relative block text-center" aria-label={it.t.title}>
										<img src={it.image} alt={it.t.imageAlt ?? it.t.title} class="trophy-img" loading="lazy" draggable="false"
											onload={(e) => { const i = e.currentTarget; i.style.width = `${Math.round(i.naturalWidth * 1.4)}px`; }} />
										<span class="trophy-shadow" aria-hidden="true"></span>
									</button>
									{#if hasCaption(it)}
										<p class="mt-4 max-w-[12rem] text-sm text-stone-600">
											{#if it.issuer}<span class="block font-medium text-forest-700">{it.issuer}</span>{/if}
											{#if expanded && it.t.description}{it.t.description}{/if}
										</p>
									{/if}
								</li>
							{/each}
						</ul>
					</li>
				{/each}
				<li class="acc-shelf" aria-hidden="true"></li>
			</ol>
		</div>
	</div>
</section>

<Dialog bind:this={dialog} label={selected?.t.title ?? t('accolades.title')}>
	{#if selected}
		<div class="flex justify-end">
			<button onclick={() => dialog?.close()} class="min-h-11 rounded-sm border border-forest-700/40 px-4">{t('accolades.close')}</button>
		</div>
		<Img src={selected.image} alt={selected.t.imageAlt ?? selected.t.title} class="mx-auto mt-2 max-h-[70vh] w-auto" />
		<h3 class="mt-4 font-serif text-2xl text-forest-700">{selected.year ? `${selected.year}` : selected.t.title}</h3>
		{#if selected.issuer}<p class="text-sm text-stone-600">{t('accolades.issuedBy', { issuer: selected.issuer })}</p>{/if}
		{#if selected.t.description}<p class="mt-2">{selected.t.description}</p>{/if}
	{/if}
</Dialog>

<style>
	.acc-pinned {
		height: calc(100svh + var(--travel) * 0.5);
	}
	.acc-pinned .acc-pin {
		position: sticky;
		top: 0;
		height: 100svh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.acc-pinned .acc-track {
		/* The first and last trophies can reach the centre of the screen. */
		padding-inline: calc(50vw - 8rem);
		transform: translate3d(calc(var(--p, 0) * var(--travel) * -1), 0, 0);
		will-change: transform;
	}
	/* The year in play stands behind the trophies like a gallery wall number. */
	.acc-year {
		font-size: clamp(9rem, 30vw, 26rem);
		color: color-mix(in srgb, var(--forest-700) 7%, transparent);
		transform: translate3d(0, -62%, 0);
	}
	.acc-floor {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 34%;
		background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--forest-700) 11%, var(--cream-100)));
		pointer-events: none;
	}
	.acc-shelf {
		position: absolute;
		left: -50vw;
		right: -50vw;
		bottom: 2rem;
		height: 0.8rem;
		border-radius: 0.125rem;
		background: linear-gradient(to bottom, color-mix(in srgb, var(--forest-700) 26%, var(--cream-100)), color-mix(in srgb, var(--forest-700) 12%, var(--cream-100)));
		box-shadow: 0 0.6rem 0.9rem -0.4rem rgb(0 0 0 / 0.2);
		pointer-events: none;
	}
	.acc-pinned .acc-shelf {
		left: 0;
		right: 0;
	}
	/* Trophies stand on the shelf. Near the centre they face the viewer and rise; further out they turn away and recede. */
	.trophy {
		position: relative;
		transform-origin: 50% 100%;
		transform: perspective(1000px) translate3d(0, calc((1 - var(--a, 1)) * -16px), calc(var(--a, 1) * -150px))
			rotateY(calc(var(--c, 0) * -30deg)) scale(calc(1 + (1 - var(--a, 1)) * 0.12));
		transition: transform 0.12s linear;
	}
	.trophy :global(.trophy-img) {
		display: block;
		max-width: min(78vw, 26rem);
		width: auto;
		height: auto;
		object-fit: contain;
		max-height: min(24rem, 44svh);
		margin: 0 auto;
		transform: perspective(700px) rotateY(var(--ry, 0deg)) rotateX(calc(var(--rx, 0deg) * 0.35));
		transition: transform 0.3s ease-out;
		will-change: transform;
	}
	.trophy-shadow {
		position: absolute;
		left: 12%;
		right: 12%;
		bottom: -0.5rem;
		height: 0.9rem;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(0 0 0 / 0.4), transparent);
		filter: blur(4px);
	}
</style>
