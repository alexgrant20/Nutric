<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import Img from '../ui/Img.svelte';

	let { lang, settings, nav, languages, contact, overHero, pathRest }: {
		lang: Lang; settings: any; nav: { key: string; labelKey: any; path: string }[];
		languages: any[]; contact: string | null; overHero: boolean; pathRest: string;
	} = $props();
	const t = useT();
	let scrolled = $state(false);
	let menu: HTMLDialogElement | undefined = $state();
	const solid = $derived(scrolled || !overHero);
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 80)} />

<header class="on-dark fixed inset-x-0 top-0 z-40 text-cream-100 transition-colors duration-200 {solid ? 'bg-forest-900' : 'bg-transparent'}">
	<div class="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
		<nav class="hidden items-center gap-1 lg:flex" aria-label="Main">
			{#each nav as item (item.key)}
				<a href="/{lang}{item.path}" class="flex min-h-11 items-center rounded-sm px-3 text-sm hover:underline">{t(item.labelKey)}</a>
			{/each}
		</nav>
		<button class="flex size-11 items-center justify-center rounded-sm lg:hidden" aria-label={t('nav.menuOpen')} onclick={() => menu?.showModal()}>
			<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" /></svg>
		</button>

		<a href="/{lang}" class="flex items-center justify-self-center" aria-label={settings?.brandName}>
			{#if settings?.logoImage}
				<Img src={settings.logoImage} alt={settings.brandName} class="h-8 w-auto" loading="eager" />
			{:else}
				<span class="font-serif text-xl">{settings?.brandName}</span>
			{/if}
		</a>

		<div class="flex items-center justify-self-end gap-1">
			{#if contact}
				<a href={contact} class="hidden min-h-11 items-center rounded-sm px-3 text-sm hover:underline sm:flex">{t('nav.contact')}</a>
			{/if}
			<LanguageSwitcher {lang} {languages} {pathRest} onDark />
		</div>
	</div>
</header>

<dialog bind:this={menu} aria-label={t('nav.menuOpen')} class="on-dark m-0 h-full max-h-none w-[min(86vw,20rem)] bg-forest-900 p-0 text-cream-100 backdrop:bg-forest-900/60">
	<div class="flex h-full flex-col p-4">
		<button class="mb-4 flex size-11 items-center justify-center self-end rounded-sm" aria-label={t('nav.menuClose')} onclick={() => menu?.close()}>
			<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" /></svg>
		</button>
		<ul class="space-y-1">
			{#each nav as item (item.key)}
				<li><a href="/{lang}{item.path}" onclick={() => menu?.close()} class="flex min-h-12 items-center rounded-sm px-3 text-lg">{t(item.labelKey)}</a></li>
			{/each}
			{#if contact}
				<li><a href={contact} class="flex min-h-12 items-center rounded-sm px-3 text-lg">{t('nav.contact')}</a></li>
			{/if}
		</ul>
	</div>
</dialog>
