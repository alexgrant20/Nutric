<script lang="ts">
	import { formatDate } from '$lib/format';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	let { data } = $props();
	const t = useT();
	const n = $derived(data.item);
</script>

<svelte:head><title>{n.t.title}</title>{#if n.t.excerpt}<meta name="description" content={n.t.excerpt} />{/if}</svelte:head>

<article class="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6">
	<a href="/{data.lang}/news" class="inline-flex min-h-11 items-center text-sm underline">{t('news.back')}</a>
	<p class="mt-4 text-stone-600">{formatDate(n.eventDate, data.lang)}{n.location ? `, ${n.location}` : ''}</p>
	<h1 class="mt-2 font-serif text-4xl leading-tight text-forest-700 sm:text-5xl">{n.t.title}</h1>
	<Img src={n.coverImage} alt={n.t.coverAlt ?? n.t.title} loading="eager" class="mt-8 aspect-[16/9] w-full rounded-md object-cover" />
	<div class="prose-md mt-8 max-w-prose">{@html data.html}</div>
	<nav class="mt-12 flex flex-wrap justify-between gap-4 border-t border-forest-700/20 pt-6" aria-label="Articles">
		{#if data.prev}<a class="inline-flex min-h-11 items-center underline" href="/{data.lang}/news/{data.prev.slug}">{t('news.prev')}: {data.prev.t.title}</a>{:else}<span></span>{/if}
		{#if data.next}<a class="inline-flex min-h-11 items-center underline" href="/{data.lang}/news/{data.next.slug}">{t('news.next')}: {data.next.t.title}</a>{/if}
	</nav>
</article>

{#if data.others.length}
	<!-- Every other article, so each page is a door to all the news. -->
	<section class="bg-forest-700 px-4 py-16 text-cream-100 sm:px-6 on-dark" aria-labelledby="more-news">
		<div class="mx-auto max-w-7xl">
			<h2 id="more-news" class="font-serif text-3xl sm:text-4xl">{t('news.more')}</h2>
			<ul class="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.others as o (o.id)}
					<li>
						<a href="/{data.lang}/news/{o.slug}" class="group block">
							<Img src={o.coverImage} alt="" class="aspect-[16/10] w-full rounded-md object-cover" />
							<p class="mt-3 text-sm text-cream-100/80">{formatDate(o.eventDate, data.lang)}</p>
							<h3 class="mt-1 font-serif text-xl leading-snug group-hover:underline">{o.t.title}</h3>
							{#if o.t.excerpt}<p class="mt-2 line-clamp-3 text-cream-100/85">{o.t.excerpt}</p>{/if}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}
