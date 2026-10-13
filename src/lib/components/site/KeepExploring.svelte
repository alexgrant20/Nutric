<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import type { DictKey } from '$lib/i18n';
	let { lang, nav, currentPath, counts }: {
		lang: string;
		nav: { key: string; labelKey: DictKey; path: string }[];
		currentPath: string;
		counts: Record<string, number | undefined>;
	} = $props();
	const t = useT();
	const links = $derived(nav.filter((item) => item.path !== currentPath && counts[item.path] !== 0));
</script>

{#if links.length}
	<nav class="bg-forest-700 px-4 py-16 text-cream-100 on-dark sm:px-6" aria-label={t('about.explore')}>
		<div class="mx-auto max-w-7xl">
			<h2 class="font-serif text-3xl">{t('about.explore')}</h2>
			<ul class="explore-links mt-8 grid border-t border-cream-100/25" style="--columns: {Math.min(links.length, 4)}">
				{#each links as item (item.key)}
					<li>
						<a href="/{lang}{item.path}" class="group flex min-h-24 items-baseline justify-between gap-4 px-1 py-6 lg:px-6">
							<span class="font-serif text-2xl group-hover:underline">{t(item.labelKey)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</nav>
{/if}

<style>
	li { border-bottom: 1px solid color-mix(in srgb, var(--cream-100) 25%, transparent); }
	@media (min-width: 640px) { .explore-links { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (min-width: 1024px) {
		.explore-links { grid-template-columns: repeat(var(--columns), minmax(0, 1fr)); }
		li { border-bottom: 0; border-right: 1px solid color-mix(in srgb, var(--cream-100) 25%, transparent); }
		li:last-child { border-right: 0; }
	}
</style>
