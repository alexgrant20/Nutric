<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { scrollProgress } from '../ui/motion';
	let { lang, text, hasFullAbout }: { lang: string; text: string; hasFullAbout: boolean } = $props();
	const t = useT();
	// Chinese and Thai are written without spaces, so they light up character by character.
	const spaceless = $derived(['zh', 'zh-tw', 'th'].includes(lang));
	const pieces = $derived(spaceless ? Array.from(text.replace(/\s+/g, '')) : text.split(/\s+/));
</script>

<section id="about" use:scrollProgress={{ mode: 'sticky' }} class="about bg-cream-100">
	<div class="about-pin flex items-center px-4 py-24 sm:px-6">
		<div class="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-12">
			<h2 class="text-sm font-semibold text-stone-600 lg:col-span-2">{t('about.title')}</h2>
			<div class="lg:col-span-9 lg:col-start-3">
				<p class="font-serif text-[clamp(1.9rem,4.4vw,3.8rem)] leading-[1.18] text-forest-700">
					{#each pieces as piece, i (i)}<span class="word" style="--t: {(i / Math.max(1, pieces.length)).toFixed(4)}">{piece}</span>{spaceless ? '' : ' '}{/each}
				</p>
				{#if hasFullAbout}
					<a href="/{lang}/about" class="mt-10 inline-flex min-h-12 items-center rounded-sm border border-forest-700 px-6 font-medium text-forest-700">{t('about.more')}</a>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	/* The paragraph is pinned while it is read: each word lights up as the section scrolls. */
	.word {
		/* The unread floor keeps 4.5:1 against the page (R-25): the paragraph is always readable. */
		opacity: clamp(0.7, calc(0.7 + ((var(--p) - 0.02) * 1.6 - var(--t)) * 1.5), 1);
	}
	@media (prefers-reduced-motion: no-preference) {
		.about {
			min-height: 180svh;
		}
		.about-pin {
			position: sticky;
			top: 0;
			min-height: 100svh;
		}
	}
</style>
