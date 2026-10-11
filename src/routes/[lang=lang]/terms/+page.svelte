<script lang="ts">
	import { useT } from '$lib/i18n/context';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('footer.terms')}</title></svelte:head>

<div class="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('footer.terms')}</h1>
	<div class="prose-md mt-8">{@html data.html}</div>
</div>
