<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	let { data } = $props();
	const t = useT();
	const n = $derived(data.item);
</script>

<svelte:head><title>{n.t.title}</title>{#if n.t.excerpt}<meta name="description" content={n.t.excerpt} />{/if}</svelte:head>

<article class="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
	<a href="/{data.lang}/news" class="inline-flex min-h-11 items-center text-sm underline">{t('news.back')}</a>
	<h1 class="mt-2 font-serif text-4xl text-forest-700 sm:text-5xl">{n.t.title}</h1>
	<p class="mt-3 text-stone-600">{formatDate(n.eventDate, data.lang)}{n.location ? `, ${n.location}` : ''}</p>
	<Img src={n.coverImage} alt={n.t.coverAlt ?? n.t.title} loading="eager" class="mt-8 aspect-[16/9] w-full rounded-md object-cover" />
	<div class="prose-md mt-8">{@html data.html}</div>
	<nav class="mt-12 flex flex-wrap justify-between gap-4 border-t border-forest-700/20 pt-6" aria-label="Articles">
		{#if data.prev}<a class="inline-flex min-h-11 items-center underline" href="/{data.lang}/news/{data.prev.slug}">{t('news.prev')}: {data.prev.t.title}</a>{:else}<span></span>{/if}
		{#if data.next}<a class="inline-flex min-h-11 items-center underline" href="/{data.lang}/news/{data.next.slug}">{t('news.next')}: {data.next.t.title}</a>{/if}
	</nav>
</article>
