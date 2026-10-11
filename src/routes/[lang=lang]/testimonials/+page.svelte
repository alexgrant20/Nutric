<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import YouTubeEmbed from '$lib/components/site/YouTubeEmbed.svelte';
	let { data } = $props();
	const t = useT();
</script>

<svelte:head><title>{t('testimonials.title')}</title></svelte:head>

<div class="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
	<h1 class="font-serif text-4xl text-forest-700 sm:text-5xl">{t('testimonials.title')}</h1>
	{#if !data.items.length}<p class="mt-8 text-stone-600">{t('common.empty')}</p>{/if}
	<ul class="mt-10 space-y-14">
		{#each data.items as x (x.id)}
			<li>
				<YouTubeEmbed videoId={x.videoId} title={x.t.title} poster={x.posterImage} />
				<h2 class="mt-4 text-xl font-semibold">{x.t.title}</h2>
				{#if x.t.quote}<p class="mt-2 font-serif text-xl">{x.t.quote}</p>{/if}
				{#if x.personName}<p class="mt-1 text-sm text-stone-600">{x.personName}{x.role ? `, ${x.role}` : ''}</p>{/if}
			</li>
		{/each}
	</ul>
</div>
