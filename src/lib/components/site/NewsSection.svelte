<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	import { scrollProgress, tilt } from '../ui/motion';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	let { lang, items }: { lang: Lang; items: any[] } = $props();
	const t = useT();
	const [featured, ...rest] = $derived(items);
	const year = (iso: string | null) => (iso ? iso.slice(0, 4) : '');
</script>

<section id="news" class="on-dark bg-forest-700 px-4 py-24 text-cream-100 sm:px-6 sm:py-32">
	<div class="mx-auto max-w-7xl" use:reveal>
		<h2 class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none">{t('news.title')}</h2>

		<div class="mt-14 grid gap-12 lg:grid-cols-12">
			{#if featured}
				<a href="/{lang}/news/{featured.slug}" class="group block lg:col-span-7" use:scrollProgress>
					<span class="relative block aspect-[16/10] overflow-hidden rounded-md bg-forest-900">
						<Img src={featured.coverImage} alt={featured.t.coverAlt ?? featured.t.title} class="news-parallax absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover" />
						{#if year(featured.eventDate)}
							<span class="absolute bottom-3 left-5 font-serif text-[clamp(3.5rem,9vw,7rem)] leading-none tabular-nums text-cream-100" aria-hidden="true">{year(featured.eventDate)}</span>
						{/if}
						<span class="news-scrim absolute inset-0" aria-hidden="true"></span>
					</span>
					<span class="mt-6 block text-sm text-cream-100/80">{formatDate(featured.eventDate, lang)}{featured.location ? `, ${featured.location}` : ''}</span>
					<span class="mt-2 block max-w-[28ch] font-serif text-[clamp(1.6rem,3vw,2.6rem)] leading-tight group-hover:underline">{featured.t.title}</span>
					{#if featured.t.excerpt}<span class="mt-3 block max-w-prose text-cream-100/85">{featured.t.excerpt}</span>{/if}
				</a>
			{/if}

			<div class="lg:col-span-5">
				<ul>
					{#each rest as item (item.id)}
						<li class="border-t border-cream-100/25">
							<a href="/{lang}/news/{item.slug}" use:tilt={{ max: 8 }} class="group grid grid-cols-[6rem_1fr] items-center gap-5 py-6">
								<span class="news-thumb block aspect-[4/3] overflow-hidden rounded-sm bg-forest-900">
									<Img src={item.coverImage} alt="" class="size-full object-cover" />
								</span>
								<span class="block">
									<span class="block text-sm text-cream-100/80">{formatDate(item.eventDate, lang)}</span>
									<span class="mt-1 line-clamp-3 block font-serif text-xl leading-snug group-hover:underline">{item.t.title}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
				<a href="/{lang}/news" class="mt-6 inline-flex min-h-12 items-center rounded-sm border border-cream-100/50 px-6 font-medium">{t('news.viewAll')}</a>
			</div>
		</div>
	</div>
</section>

<style>
	/* The cover drifts slowly against the frame while the section scrolls: a window onto a deeper picture. */
	:global(.news-parallax) {
		transform: translate3d(0, calc((var(--p, 0.5) - 0.5) * 8%), 0);
	}
	.news-scrim {
		background: linear-gradient(to top, color-mix(in srgb, var(--forest-900) 70%, transparent), transparent 55%);
	}
	.news-thumb {
		transform: perspective(600px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition: transform 0.3s ease-out;
	}
</style>
