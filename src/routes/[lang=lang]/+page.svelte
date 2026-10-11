<script lang="ts">
	import Hero from '$lib/components/site/Hero.svelte';
	import BestSeller from '$lib/components/site/BestSeller.svelte';
	import Collections from '$lib/components/site/Collections.svelte';
	import AboutTeaser from '$lib/components/site/AboutTeaser.svelte';
	import Testimonials from '$lib/components/site/Testimonials.svelte';
	import Accolades from '$lib/components/site/Accolades.svelte';
	import NewsSection from '$lib/components/site/NewsSection.svelte';
	import Newsletter from '$lib/components/site/Newsletter.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.settings?.brandName}{data.settings?.t?.tagline ? `, ${data.settings.t.tagline}` : ''}</title>
	{#if data.settings?.t?.subheadline}<meta name="description" content={data.settings.t.subheadline} />{/if}
</svelte:head>

<div class={data.visible[0] === 'hero' ? '' : 'pt-16'}>
{#each data.visible as key (key)}
	{#if key === 'hero'}
		<Hero lang={data.lang} settings={data.settings} bestSeller={data.bestSeller} testimonial={data.testimonials[0] ?? null} />
	{:else if key === 'best_seller' && data.bestSeller}
		<BestSeller lang={data.lang} product={data.bestSeller} />
	{:else if key === 'collections'}
		<Collections lang={data.lang} collections={data.collections} products={data.products} />
	{:else if key === 'about'}
		<AboutTeaser lang={data.lang} html={data.aboutHtml} hasFullAbout={!!data.settings?.t?.aboutMd} />
	{:else if key === 'testimonials' && data.testimonials.length}
		<Testimonials lang={data.lang} items={data.testimonials} />
	{:else if key === 'accolades'}
		<Accolades lang={data.lang} items={data.accolades} />
	{:else if key === 'news'}
		<NewsSection lang={data.lang} items={data.news} />
	{:else if key === 'newsletter'}
		<Newsletter lang={data.lang} enabled={data.newsletterEnabled} />
	{/if}
{/each}
</div>
