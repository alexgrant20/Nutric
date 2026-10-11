<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';
	let { lang, settings, nav, contact }: { lang: Lang; settings: any; nav: { key: string; labelKey: any; path: string }[]; contact: string | null } = $props();
	const t = useT();
	const labels: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube' };
	const socials = $derived((settings?.socialLinks ?? []).filter((s: any) => /^https:\/\//.test(s.url)));
</script>

<footer class="on-dark bg-forest-900 text-cream-100">
	<div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
		<div>
			<p class="font-serif text-2xl">{settings?.brandName}</p>
			{#if settings?.t?.footerNote}<p class="mt-3 max-w-prose text-sm text-cream-100/80">{settings.t.footerNote}</p>{/if}
		</div>
		<div class="grid gap-8 sm:grid-cols-3">
			{#if nav.length}
				<nav aria-label={t('footer.sections')}>
					<h2 class="text-sm font-semibold">{t('footer.sections')}</h2>
					<ul class="mt-3 space-y-1">
						{#each nav as item (item.key)}
							<li><a href="/{lang}{item.path}" class="inline-flex min-h-11 items-center text-sm hover:underline">{t(item.labelKey)}</a></li>
						{/each}
					</ul>
				</nav>
			{/if}
			{#if contact}
				<div>
					<h2 class="text-sm font-semibold">{t('footer.contact')}</h2>
					<a href={contact} class="mt-3 inline-flex min-h-11 items-center text-sm hover:underline">{contact.replace(/^(mailto:|tel:|https:\/\/)/, '')}</a>
				</div>
			{/if}
			{#if socials.length}
				<div>
					<h2 class="text-sm font-semibold">{t('footer.follow')}</h2>
					<ul class="mt-3 space-y-1">
						{#each socials as s, i (i)}
							<li><a href={s.url} rel="noopener noreferrer" target="_blank" class="inline-flex min-h-11 items-center text-sm hover:underline">{labels[s.platform] ?? s.platform}</a></li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
	<div class="flex flex-wrap items-center justify-center gap-x-6 border-t border-cream-100/15 px-4 py-2 text-sm text-cream-100/70">
		<p class="py-2">&copy; {new Date().getFullYear()} {settings?.brandName}</p>
		{#if settings?.t?.termsMd}<a href="/{lang}/terms" class="inline-flex min-h-11 items-center underline">{t('footer.terms')}</a>{/if}
	</div>
</footer>
