<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import VideoStage from '$lib/components/site/VideoStage.svelte';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('testimonials.title')}</title></svelte:head>

<div class="pt-16">
	{#if data.items.length}
		<VideoStage lang={data.lang} items={data.items} layout="gallery" page />
	{:else}
		<p class="px-4 pt-16 text-stone-600 sm:px-6">{t('common.empty')}</p>
	{/if}
</div>
