<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	let { lang, html, hasFullAbout }: { lang: string; html: string; hasFullAbout: boolean } = $props();
	const t = useT();
</script>

<section id="about" class="bg-cream-100 px-4 py-28 sm:px-6">
	<div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12" use:reveal>
		<h2 class="text-sm font-semibold text-stone-600 lg:col-span-3">{t('about.title')}</h2>
		<div class="lg:col-span-8 lg:col-start-4">
			<div class="font-serif text-[clamp(1.5rem,3vw,2.5rem)] leading-snug text-forest-700 [&_p]:m-0">{@html html}</div>
			{#if hasFullAbout}
				<a href="/{lang}/about" class="mt-8 inline-flex min-h-12 items-center text-forest-700 underline underline-offset-4">{t('about.more')}</a>
			{/if}
		</div>
	</div>
</section>
