<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import YouTubeEmbed from './YouTubeEmbed.svelte';

	// A speaker index: the names are the controls, the chosen person's words lead and their video follows.
	let { lang, items }: { lang: string; items: any[] } = $props();
	const t = useT();
	const shown = $derived(items.slice(0, 5));
	let index = $state(0);
	const active = $derived(shown[Math.min(index, shown.length - 1)]);
</script>

<section id="reviews" class="bg-cream-100 px-4 py-24 text-forest-700 sm:px-6 sm:py-32">
	<div class="mx-auto max-w-7xl" use:reveal>
		<div class="flex flex-wrap items-end justify-between gap-4">
			<h2 class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none">{t('reviews.title')}</h2>
			<a href="/{lang}/testimonials" class="inline-flex min-h-12 items-center rounded-sm border border-forest-700/50 px-6 font-medium">{t('reviews.viewAll')}</a>
		</div>

		{#if active}
			<div class="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
				<ol class="order-2 border-t border-forest-700/20 lg:order-1 lg:col-span-4">
					{#each shown as it, i (it.id)}
						<li class="border-b border-forest-700/20">
							<button type="button" onclick={() => (index = i)} aria-pressed={i === index}
								class="grid w-full grid-cols-[2.5rem_1fr] items-baseline gap-2 border-l-2 py-5 pl-3 text-left transition-colors {i === index ? 'border-forest-700' : 'border-transparent text-forest-700/70 hover:text-forest-700'}">
								<span class="text-sm tabular-nums">{String(i + 1).padStart(2, '0')}</span>
								<span>
									<span class="block font-serif text-xl leading-snug">{it.personName ?? it.t.title}</span>
									{#if it.personName && it.role}<span class="mt-0.5 block text-sm text-stone-600">{it.role}</span>{/if}
								</span>
							</button>
						</li>
					{/each}
				</ol>

				<div class="order-1 lg:order-2 lg:col-span-8" aria-live="polite">
					{#if active.t.quote}
						<blockquote class="max-w-[34ch] font-serif text-[clamp(1.6rem,3.2vw,2.75rem)] leading-tight">“{active.t.quote}”</blockquote>
					{:else}
						<p class="max-w-[34ch] font-serif text-[clamp(1.6rem,3.2vw,2.75rem)] leading-tight">{active.t.title}</p>
					{/if}
					<div class="mt-8">
						<YouTubeEmbed videoId={active.videoId} title={active.t.title} poster={active.posterImage} index={index} total={shown.length} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
