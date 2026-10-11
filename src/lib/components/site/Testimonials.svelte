<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import YouTubeEmbed from './YouTubeEmbed.svelte';
	let { lang, items, showAll = true }: { lang: string; items: any[]; showAll?: boolean } = $props();
	const t = useT();
	let activeId = $state(items[0]?.id);
	const active = $derived(items.find((x) => x.id === activeId) ?? items[0]);
	const others = $derived(items.filter((x) => x.id !== active?.id));
</script>

<section id="testimonials" class="on-dark bg-forest-900 px-4 py-24 text-cream-100 sm:px-6">
	<div class="mx-auto max-w-7xl" use:reveal>
		<h2 class="font-serif text-3xl sm:text-4xl">{t('testimonials.title')}</h2>
		{#if active}
			<div class="mt-10 grid gap-8 lg:grid-cols-12">
				<div class="lg:col-span-8">
					<YouTubeEmbed videoId={active.videoId} title={active.t.title} poster={active.posterImage} />
					<h3 class="mt-4 text-lg font-semibold">{active.t.title}</h3>
					{#if active.t.quote}<p class="mt-2 max-w-prose font-serif text-xl">{active.t.quote}</p>{/if}
					{#if active.personName}<p class="mt-2 text-sm text-cream-100/80">{active.personName}{active.role ? `, ${active.role}` : ''}</p>{/if}
				</div>
				{#if others.length}
					<ul class="space-y-2 lg:col-span-4">
						{#each others as o (o.id)}
							<li>
								<button onclick={() => (activeId = o.id)} class="flex min-h-14 w-full items-center rounded-sm border border-cream-100/25 px-4 text-left hover:bg-cream-100/10">
									{o.t.title}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
		{#if showAll}<a href="/{lang}/testimonials" class="mt-8 inline-flex min-h-11 items-center underline underline-offset-4">{t('testimonials.title')}</a>{/if}
	</div>
</section>
