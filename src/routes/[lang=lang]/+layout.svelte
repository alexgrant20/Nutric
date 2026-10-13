<script lang="ts">
	import { page } from '$app/state';
	import { provideT } from '$lib/i18n/context';
	import Navbar from '$lib/components/site/Navbar.svelte';
	import Footer from '$lib/components/site/Footer.svelte';
	import KeepExploring from '$lib/components/site/KeepExploring.svelte';

	let { data, children } = $props();
	const t = provideT(() => data.lang);
	const rest = $derived(page.url.pathname.replace(/^\/[^/]+/, ''));
	const overHero = $derived(rest === '' || rest === '/');
	const currentSection = $derived('/' + rest.split('/')[1]);
	const showExplore = $derived(['/about', '/products', '/news', '/accolades', '/videos', '/testimonials'].includes(currentSection));
</script>

<svelte:head>
	{#each data.languages as l (l.code)}
		<link rel="alternate" hreflang={l.htmlLang} href={`${page.url.origin}/${l.code}${rest}`} />
	{/each}
</svelte:head>

<a href="#main" class="sr-only z-50 rounded-sm bg-lime-400 px-4 py-2 text-forest-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
	{t('nav.skip')}
</a>
<Navbar lang={data.lang} settings={data.settings} nav={data.nav} languages={data.languages} contact={data.contact} {overHero} pathRest={rest} />
<main id="main">
	{@render children()}
	{#if showExplore}
		<KeepExploring lang={data.lang} nav={data.nav} currentPath={currentSection} counts={data.exploreCounts} />
	{/if}
</main>
<Footer lang={data.lang} settings={data.settings} nav={data.nav} contact={data.contact} />
