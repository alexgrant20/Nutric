<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	let { data } = $props();
	const t = useT();
	const [featured, ...rest] = $derived(data.items);
</script>

<svelte:head><title>{t('news.title')}</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('news.title')}</h1>
	{#if !data.items.length}<p class="mt-8 text-stone-600">{t('common.empty')}</p>{/if}
	{#if featured}
		<a href="/{data.lang}/news/{featured.slug}" class="group mt-10 grid gap-6 lg:grid-cols-2">
			<Img src={featured.coverImage} alt={featured.t.coverAlt ?? featured.t.title} class="aspect-[16/10] w-full rounded-md object-cover" />
			<div class="self-center">
				<p class="text-sm text-stone-600">{formatDate(featured.eventDate, data.lang)}{featured.location ? `, ${featured.location}` : ''}</p>
				<h2 class="mt-1 font-serif text-3xl text-forest-700 group-hover:underline">{featured.t.title}</h2>
				{#if featured.t.excerpt}<p class="mt-3 text-stone-600">{featured.t.excerpt}</p>{/if}
			</div>
		</a>
	{/if}
	<ul class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
		{#each rest as n (n.id)}
			<li>
				<a href="/{data.lang}/news/{n.slug}" class="group block">
					<Img src={n.coverImage} alt={n.t.coverAlt ?? n.t.title} class="aspect-[16/10] w-full rounded-md object-cover" />
					<p class="mt-3 text-sm text-stone-600">{formatDate(n.eventDate, data.lang)}</p>
					<h2 class="font-serif text-xl text-forest-700 group-hover:underline">{n.t.title}</h2>
				</a>
			</li>
		{/each}
	</ul>
	{#if data.pages > 1}
		<nav class="mt-12 flex items-center justify-between" aria-label="Pagination">
			{#if data.page > 1}<a class="inline-flex min-h-11 items-center underline" href="?page={data.page - 1}">{t('common.prevPage')}</a>{:else}<span></span>{/if}
			<span class="text-sm text-stone-600">{data.page} / {data.pages}</span>
			{#if data.page < data.pages}<a class="inline-flex min-h-11 items-center underline" href="?page={data.page + 1}">{t('common.nextPage')}</a>{:else}<span></span>{/if}
		</nav>
	{/if}
</div>
