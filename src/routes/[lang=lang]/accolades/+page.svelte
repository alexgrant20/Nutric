<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import Accolades from '$lib/components/site/Accolades.svelte';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('accolades.title')}</title></svelte:head>

<div class="pt-16">
	{#if data.items.length}
		<Accolades lang={data.lang} items={data.items} expanded />
	{:else}
		<p class="px-4 pt-16 text-stone-600 sm:px-6">{t('common.empty')}</p>
	{/if}
</div>
