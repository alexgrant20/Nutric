<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	let { lang, languages, pathRest, onDark = false }: {
		lang: Lang; languages: readonly { code: string; label: string; htmlLang: string }[]; pathRest: string; onDark?: boolean;
	} = $props();
	const t = useT();
	let details: HTMLDetailsElement | undefined = $state();
	const current = $derived(languages.find((l) => l.code === lang));
</script>

<details bind:this={details} class="relative" onkeydown={(e) => { if (e.key === 'Escape' && details) details.open = false; }}>
	<summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm px-3 text-sm" aria-label={t('nav.language')}>
		{current?.label}
	</summary>
	<ul class="absolute right-0 z-50 mt-2 min-w-44 rounded-md bg-cream-100 p-1 text-ink-900 shadow-xl">
		{#each languages as l (l.code)}
			<li>
				<a href="/{l.code}{pathRest}" hreflang={l.htmlLang} lang={l.htmlLang} data-sveltekit-reload
					aria-current={l.code === lang ? 'true' : undefined}
					class="flex min-h-11 items-center rounded-sm px-3 text-sm hover:bg-forest-700/10 {l.code === lang ? 'bg-forest-700 text-lime-400' : ''}">
					{l.label}
				</a>
			</li>
		{/each}
	</ul>
</details>
