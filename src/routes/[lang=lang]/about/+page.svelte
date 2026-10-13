<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '$lib/components/ui/reveal';
	let { data } = $props();
	const t = useT();

	// Consecutive short sections (motto, mission, vision) read side by side; long ones read as a document.
	type Block = { kind: 'group'; items: typeof data.sections } | { kind: 'long'; item: (typeof data.sections)[number]; n: number };
	const blocks = $derived.by(() => {
		const out: Block[] = [];
		let n = 0;
		for (const s of data.sections) {
			n++;
			const last = out[out.length - 1];
			if (s.short) {
				if (last?.kind === 'group') last.items.push(s);
				else out.push({ kind: 'group', items: [s] });
			} else out.push({ kind: 'long', item: s, n });
		}
		return out;
	});
	const cols: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' };
	const stats = $derived(
		[
			{ n: data.stats.products, label: t('about.stat.products') },
			{ n: data.stats.collections, label: t('about.stat.collections') },
			{ n: data.stats.accolades, label: t('about.stat.accolades') },
			{ n: data.stats.videos, label: t('about.stat.videos') }
		].filter((x) => x.n > 0)
	);
</script>

<svelte:head><title>{t('about.title')}</title></svelte:head>

<!-- The statement: the opening paragraph at display size, with the real counts beside it. -->
<header class="bg-forest-900 px-4 pb-20 pt-32 text-cream-100 on-dark sm:px-6 sm:pb-28">
	<div class="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
		<div class="lg:col-span-8">
			<h1 class="text-sm font-semibold text-cream-100/80">{t('about.title')}</h1>
			<div class="statement mt-6" use:reveal>{@html data.intro}</div>
		</div>
		{#if stats.length}
			<dl class="grid grid-cols-2 gap-x-6 gap-y-8 self-end lg:col-span-4 lg:grid-cols-1">
				{#each stats as s (s.label)}
					<div class="border-t border-cream-100/25 pt-3">
						<dd class="font-serif text-5xl tabular-nums leading-none">{s.n}</dd>
						<dt class="mt-2 text-sm text-cream-100/80">{s.label}</dt>
					</div>
				{/each}
			</dl>
		{/if}
	</div>
</header>

<div class="bg-cream-100 px-4 py-20 sm:px-6 sm:py-28">
	<div class="mx-auto max-w-7xl space-y-24">
		{#each blocks as b, i (i)}
			{#if b.kind === 'group'}
				<div class="grid gap-x-12 gap-y-14 {cols[Math.min(b.items.length, 3)]}" use:reveal>
					{#each b.items as s (s.title)}
						<section class="border-t-2 border-forest-700 pt-5">
							<h2 class="font-serif text-3xl text-forest-700">{s.title}</h2>
							<div class="prose-about mt-4">{@html s.html}</div>
						</section>
					{/each}
				</div>
			{:else}
				<section class="grid gap-8 lg:grid-cols-12" use:reveal>
					<div class="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
						<p class="font-serif text-6xl leading-none tabular-nums text-stone-600" aria-hidden="true">{String(b.n).padStart(2, '0')}</p>
						<h2 class="mt-3 font-serif text-3xl text-forest-700 sm:text-4xl">{b.item.title}</h2>
					</div>
					<div class="prose-about lg:col-span-8">{@html b.item.html}</div>
				</section>
			{/if}
		{/each}
	</div>
</div>

<style>
	.statement :global(p:first-child) {
		font-family: var(--font-serif-stack);
		font-size: clamp(1.9rem, 4.2vw, 3.6rem);
		line-height: 1.15;
	}
	.statement :global(p + p) {
		margin-top: 1.5rem;
		max-width: 52ch;
		font-size: 1.125rem;
		line-height: 1.6;
		color: color-mix(in srgb, var(--cream-100) 85%, transparent);
	}
	.prose-about :global(p) {
		margin-block: 0.9em;
		max-width: 66ch;
		line-height: 1.7;
	}
	.prose-about :global(p:first-child) {
		margin-top: 0;
	}
</style>
