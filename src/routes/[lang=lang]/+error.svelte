<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import type { Lang } from '$lib/i18n/config';
	const lang = $derived(page.params.lang as Lang);
</script>

<div class="mx-auto flex min-h-[70svh] max-w-xl flex-col justify-center px-4 pt-28">
	<h1 class="font-serif text-4xl text-forest-700">{page.status === 404 ? t(lang, 'common.notFound') : t(lang, 'common.error')}</h1>
	<a href="/{lang}" class="mt-6 text-forest-700 underline">{t(lang, 'common.backHome')}</a>
</div>
