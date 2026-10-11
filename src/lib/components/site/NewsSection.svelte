<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	import { reveal } from '../ui/reveal';
	import Img from '../ui/Img.svelte';
	import NewsRow from './NewsRow.svelte';
	let { lang, items }: { lang: Lang; items: any[] } = $props();
	const t = useT();
	const [featured, ...rest] = $derived(items);
</script>

<section id="news" class="border-t border-forest-700/15 bg-cream-100 px-4 py-24 sm:px-6">
	<div class="mx-auto max-w-7xl" use:reveal>
		<h2 class="font-serif text-3xl text-forest-700 sm:text-4xl">{t('news.title')}</h2>
		<div class="mt-10 grid gap-10 lg:grid-cols-12">
			{#if featured}
				<a href="/{lang}/news/{featured.slug}" class="group block lg:col-span-7">
					<Img src={featured.coverImage} alt={featured.t.coverAlt ?? featured.t.title} class="aspect-[16/10] w-full rounded-md object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
					<p class="mt-4 text-sm text-stone-600">{formatDate(featured.eventDate, lang)}{featured.location ? `, ${featured.location}` : ''}</p>
					<h3 class="mt-1 font-serif text-2xl text-forest-700">{featured.t.title}</h3>
					{#if featured.t.excerpt}<p class="mt-2 max-w-prose text-stone-600">{featured.t.excerpt}</p>{/if}
				</a>
			{/if}
			<div class="lg:col-span-5">
				{#each rest as item (item.id)}<NewsRow {lang} {item} />{/each}
				<a href="/{lang}/news" class="mt-6 inline-flex min-h-11 items-center text-forest-700 underline underline-offset-4">{t('news.viewAll')}</a>
			</div>
		</div>
	</div>
</section>
