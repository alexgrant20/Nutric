<script lang="ts">
	import { useT } from '$lib/i18n/context';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('about.title')}</title></svelte:head>

<div class="mx-auto grid max-w-7xl gap-10 px-4 pb-28 pt-32 sm:px-6 lg:grid-cols-12">
	<h1 class="font-serif text-[clamp(2.5rem,6vw,5rem)] leading-none text-forest-700 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">{t('about.title')}</h1>
	<div class="about-prose lg:col-span-8">{@html data.html}</div>
</div>

<style>
	/* The opening paragraph is the statement; the sections that follow read as a document. */
	.about-prose :global(> p:first-child) {
		font-family: var(--font-serif-stack);
		font-size: clamp(1.5rem, 2.6vw, 2.1rem);
		line-height: 1.3;
		color: var(--forest-700);
		max-width: 34ch;
	}
	.about-prose :global(p) {
		margin-block: 1em;
		max-width: 68ch;
	}
	.about-prose :global(h2) {
		margin-top: 3.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid color-mix(in srgb, var(--forest-700) 25%, transparent);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--forest-700);
	}
</style>
