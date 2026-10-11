<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	import YouTubeEmbed from './YouTubeEmbed.svelte';

	// layout "rail": stage plus a numbered playlist beside it (landing).
	// layout "gallery": large stage plus a poster gallery of every video below it (Videos page).
	let { lang, items, layout = 'rail', page = false }: { lang: string; items: any[]; layout?: 'rail' | 'gallery'; page?: boolean } = $props();
	const t = useT();
	let activeId = $state(items[0]?.id);
	let stage: HTMLElement | undefined = $state();
	const activeIndex = $derived(Math.max(0, items.findIndex((x) => x.id === activeId)));
	const active = $derived(items[activeIndex]);

	function select(id: number, bring = false) {
		activeId = id;
		if (bring) {
			const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
			stage?.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
		}
	}
	const num = (i: number) => String(i + 1).padStart(2, '0');
</script>

<section id="testimonials" class="on-dark bg-forest-900 px-4 py-24 text-cream-100 sm:px-6 sm:py-32">
	<div class="mx-auto max-w-7xl" use:reveal>
		<svelte:element this={page ? 'h1' : 'h2'} class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none">{t('testimonials.title')}</svelte:element>

		{#if active}
			<div class="mt-10 grid gap-8 {layout === 'rail' ? 'lg:grid-cols-12' : ''}">
				<div bind:this={stage} class={layout === 'rail' ? 'lg:col-span-8' : 'mx-auto w-full max-w-5xl'}>
					<YouTubeEmbed videoId={active.videoId} title={active.t.title} poster={active.posterImage} index={activeIndex} total={items.length} />
					{#if active.t.quote || active.personName}
						<div class="mt-5 max-w-prose">
							{#if active.t.quote}<p class="font-serif text-xl">{active.t.quote}</p>{/if}
							{#if active.personName}<p class="mt-2 text-sm text-cream-100/80">{active.personName}{active.role ? `, ${active.role}` : ''}</p>{/if}
						</div>
					{/if}
				</div>

				{#if layout === 'rail'}
					<ol class="max-h-[34rem] space-y-1 overflow-y-auto pr-1 lg:col-span-4" aria-label={t('videos.all')}>
						{#each items as it, i (it.id)}
							<li>
								<button onclick={() => select(it.id)} aria-current={it.id === activeId ? 'true' : undefined}
									class="group grid min-h-14 w-full grid-cols-[6.5rem_1fr] items-center gap-3 rounded-sm p-2 text-left transition-colors {it.id === activeId ? 'bg-cream-100/12' : 'hover:bg-cream-100/8'}">
									<span class="relative block aspect-video overflow-hidden rounded-sm bg-forest-700">
										<Img src={it.posterImage} alt="" class="size-full object-cover {it.id === activeId ? '' : 'opacity-75 transition-opacity duration-200 group-hover:opacity-100'}" />
									</span>
									<span class="block min-w-0">
										<span class="block text-xs tabular-nums text-cream-100/70">{num(i)}{it.id === activeId ? ` · ${t('videos.nowShowing')}` : ''}</span>
										<span class="mt-0.5 line-clamp-2 block text-sm leading-snug">{it.t.title}</span>
									</span>
								</button>
							</li>
						{/each}
					</ol>
				{/if}
			</div>

			{#if layout === 'gallery'}
				<h2 class="mt-16 text-sm text-cream-100/70">{t('videos.all')}</h2>
				<ol class="mt-4 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
					{#each items as it, i (it.id)}
						<li>
							<button onclick={() => select(it.id, true)} aria-current={it.id === activeId ? 'true' : undefined} class="group block w-full text-left">
								<span class="relative block aspect-video overflow-hidden rounded-md bg-forest-700 {it.id === activeId ? 'ring-2 ring-cream-100' : ''}">
									<Img src={it.posterImage} alt="" class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
								</span>
								<span class="mt-3 block text-xs tabular-nums text-cream-100/70">{num(i)}{it.id === activeId ? ` · ${t('videos.nowShowing')}` : ''}</span>
								<span class="mt-1 block font-serif text-xl leading-snug">{it.t.title}</span>
							</button>
						</li>
					{/each}
				</ol>
			{/if}
		{/if}
	</div>
</section>
