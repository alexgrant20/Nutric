<script lang="ts">
	import { onMount } from 'svelte';
	import { useT } from '$lib/i18n/context';
	import { prefersReducedMotion } from '../ui/motion';
	import Img from '../ui/Img.svelte';
	import ProductCard from './ProductCard.svelte';

	let { lang, products }: { lang: string; products: any[] } = $props();
	const t = useT();
	let index = $state(0);
	let flat = $state(false);
	let startX = 0;
	let dragged = false;

	// A new collection starts again at its first product.
	$effect(() => { products; index = 0; });
	onMount(() => { flat = prefersReducedMotion(); });

	const active = $derived(products[Math.min(index, products.length - 1)]);
	const go = (to: number) => { index = Math.max(0, Math.min(products.length - 1, to)); };
	const num = (n: number) => String(n).padStart(2, '0');

	function key(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
		if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
		if (e.key === 'Home') { e.preventDefault(); go(0); }
		if (e.key === 'End') { e.preventDefault(); go(products.length - 1); }
	}
	function down(e: PointerEvent) { startX = e.clientX; dragged = false; }
	function up(e: PointerEvent) {
		const dx = e.clientX - startX;
		if (Math.abs(dx) > 48) { dragged = true; go(index + (dx < 0 ? 1 : -1)); }
	}
	// A drag must not also follow the link under the pointer.
	function swallow(e: MouseEvent) { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }
</script>

{#if flat}
	<ul class="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
		{#each products as p (p.id)}
			<li class="w-64 shrink-0 snap-start sm:w-72"><ProductCard {lang} product={p} /></li>
		{/each}
	</ul>
{:else if active}
	<div role="group" aria-roledescription="carousel" aria-label={t('coverflow.label')}>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div class="cf-stage" tabindex="0" onkeydown={key} onpointerdown={down} onpointerup={up} onclickcapture={swallow} role="presentation">
			{#each products as p, i (p.id)}
				{@const d = i - index}
				<div class="cf-item" data-far={Math.abs(d) > 3} style="--d: {d}; --abs: {Math.abs(d)}">
					{#if d === 0}
						<a href="/{lang}/products/{p.slug}" aria-label={p.t.name} draggable="false">
							<Img src={p.mainImage} alt="" class="cf-img" />
						</a>
					{:else}
						<button type="button" onclick={() => go(i)} aria-label={p.t.name} tabindex={Math.abs(d) <= 2 ? 0 : -1}>
							<Img src={p.mainImage} alt="" class="cf-img" />
						</button>
					{/if}
					<span class="cf-shadow" aria-hidden="true"></span>
				</div>
			{/each}
		</div>

		<div class="mx-auto mt-8 flex max-w-2xl flex-col items-center text-center" aria-live="polite">
			<p class="text-sm tabular-nums text-cream-100/70">{t('coverflow.count', { n: num(index + 1), total: num(products.length) })}</p>
			<h3 class="mt-2 font-serif text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight">{active.t.name}</h3>
			{#if active.t.shortDescription}<p class="mt-3 line-clamp-2 max-w-prose text-cream-100/85">{active.t.shortDescription}</p>{/if}
		</div>
		<div class="mt-6 flex items-center justify-center gap-3">
			<button type="button" class="size-12 rounded-sm border border-cream-100/40 disabled:opacity-40" aria-label={t('coverflow.prev')} disabled={index === 0} onclick={() => go(index - 1)}>
				<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
			</button>
			<a href="/{lang}/products/{active.slug}" class="inline-flex min-h-12 items-center rounded-sm bg-cream-100 px-7 font-medium text-forest-900">{t('bestSeller.view')}</a>
			<button type="button" class="size-12 rounded-sm border border-cream-100/40 disabled:opacity-40" aria-label={t('coverflow.next')} disabled={index === products.length - 1} onclick={() => go(index + 1)}>
				<svg viewBox="0 0 20 20" class="mx-auto size-5" aria-hidden="true"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.cf-stage {
		position: relative;
		height: clamp(21rem, 54vw, 31rem);
		container-type: inline-size;
		perspective: 1500px;
		touch-action: pan-y;
		cursor: grab;
		border-radius: 0.25rem;
	}
	.cf-stage:active {
		cursor: grabbing;
	}
	.cf-item {
		--w: clamp(8.5rem, 24cqw, 16rem);
		position: absolute;
		top: 0;
		bottom: 1.6rem;
		left: 50%;
		width: var(--w);
		margin-left: calc(var(--w) / -2);
		z-index: calc(10 - var(--abs));
		transform: translate3d(calc(var(--d) * 22cqw), 0, calc(var(--abs) * -180px)) rotateY(calc(var(--d) * -30deg))
			scale(calc(1 - var(--abs) * 0.03));
		opacity: calc(1 - var(--abs) * 0.26);
		transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.5s ease;
		will-change: transform;
	}
	.cf-item[data-far='true'] {
		opacity: 0;
		pointer-events: none;
	}
	.cf-item :global(a),
	.cf-item :global(button) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.cf-item :global(.cf-img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: bottom;
		user-select: none;
		-webkit-user-drag: none;
	}
	.cf-shadow {
		position: absolute;
		left: 6%;
		right: 6%;
		bottom: -0.55rem;
		height: 1.3rem;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(0 0 0 / 0.55), transparent);
		filter: blur(5px);
		pointer-events: none;
	}
</style>
