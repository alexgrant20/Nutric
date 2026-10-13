<script lang="ts">
	import { page } from '$app/state';
	import { useT } from '$lib/i18n/context';
	import Img from '$lib/components/ui/Img.svelte';
	import { scrollProgress, tilt } from '$lib/components/ui/motion';
	import { reveal } from '$lib/components/ui/reveal';
	import ProductCard from '$lib/components/site/ProductCard.svelte';
	import FaqAccordion from '$lib/components/site/FaqAccordion.svelte';
	let { data } = $props();
	const t = useT();
	const p = $derived(data.product);
	const images = $derived([p.mainImage, ...(p.gallery ?? [])].filter((x, i, a): x is string => !!x && a.indexOf(x) === i));
	let activeImage = $state(0);
	const contact = $derived(page.data.contact as string | null);
	// The brand word of the name is set huge behind the pack; each registered mark is a small raised sign.
	const word = $derived(String(p.t.name).split(/\s+/)[0].replace(/[®™]/g, ''));
	const nameParts = $derived(String(p.t.name).split(/([®™])/));
	const num = (i: number) => String(i + 1).padStart(2, '0');
</script>

<svelte:head><title>{p.t.name}</title>{#if p.t.shortDescription}<meta name="description" content={p.t.shortDescription} />{/if}</svelte:head>

<!-- The product: its pack on a lit stage in front of its own name, and what it does as a numbered list. -->
<section use:scrollProgress class="relative overflow-hidden bg-cream-100 px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
	<p aria-hidden="true" class="giant-word pointer-events-none absolute inset-x-0 top-[44%] select-none whitespace-nowrap text-center font-serif leading-none">{word}</p>

	<div class="relative mx-auto grid max-w-7xl items-center gap-8 sm:gap-12 lg:grid-cols-12">
		<div class="lg:col-span-6 lg:order-2">
			<div class="stage-3d mx-auto w-fit" use:tilt={{ max: 8 }}>
				<div class="pack-3d">
					<Img src={images[activeImage] ?? null} alt={p.t.imageAlt ?? p.t.name} loading="eager" class="mx-auto h-72 w-auto object-contain sm:h-[30rem] lg:h-[36rem]" />
				</div>
				<div class="contact-shadow" aria-hidden="true"></div>
			</div>
			{#if images.length > 1}
				<ul class="mt-6 flex justify-center gap-2">
					{#each images as src, i (src)}
						<li>
							<button onclick={() => (activeImage = i)} aria-label="{p.t.name} {i + 1}" aria-current={i === activeImage ? 'true' : undefined}
								class="size-16 rounded-sm bg-white p-1 {i === activeImage ? 'ring-2 ring-forest-700' : ''}">
								<Img {src} alt="" class="size-full object-contain" />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="lg:col-span-6 lg:order-1">
			{#if data.collection}<a href="/{data.lang}/collections/{data.collection.slug}" class="inline-flex min-h-11 items-center text-sm text-forest-700 underline underline-offset-4">{data.collection.t.name}</a>{/if}
			<h1 class="mt-1 font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.05] text-forest-700">{#each nameParts as part, i (i)}{#if part === '®' || part === '™'}<sup class="mark">{part}</sup>{:else}{part}{/if}{/each}</h1>
			{#if p.t.shortDescription}<p class="mt-4 max-w-prose text-base text-stone-600 sm:text-lg">{p.t.shortDescription}</p>{/if}

			{#if p.t.benefits?.length}
				<h2 class="mt-8 text-sm font-semibold text-stone-600">{t('products.benefits')}</h2>
				<ol class="mt-2 grid border-t border-forest-700/25 sm:grid-cols-2 sm:gap-x-8">
					{#each p.t.benefits as b, i (i)}
						<li class="flex items-baseline gap-4 border-b border-forest-700/25 py-3">
							<span class="font-serif text-lg tabular-nums text-stone-600">{num(i)}</span>
							<span class="text-forest-700">{b}</span>
						</li>
					{/each}
				</ol>
			{/if}

			{#if contact}
				<a href={contact} class="mt-8 inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-7 font-medium text-cream-100">{t('products.enquire')}</a>
			{/if}
		</div>
	</div>
</section>

{#if data.html.description || data.html.ingredients || data.html.howToUse}
	<!-- What it is: the first paragraph is the statement, the rest reads as a document. -->
	<section class="bg-white px-4 py-16 sm:px-6 sm:py-24">
		<div class="mx-auto max-w-7xl space-y-16 sm:space-y-24">
			{#each [
				{ key: 'description', title: t('products.description'), html: data.html.description },
				{ key: 'ingredients', title: t('products.ingredients'), html: data.html.ingredients },
				{ key: 'howToUse', title: t('products.howToUse'), html: data.html.howToUse }
			].filter((s) => s.html) as s, i (s.key)}
				<div class="grid gap-6 lg:grid-cols-12" use:reveal>
					<h2 class="text-sm font-semibold text-stone-600 lg:col-span-3">{s.title}</h2>
					<div class="body-copy lg:col-span-9" class:statement={i === 0}>{@html s.html}</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

{#if p.t.faqs?.length}
	<section class="on-dark bg-forest-900 px-4 py-16 text-cream-100 sm:px-6 sm:py-24" aria-labelledby="faq-title">
		<div class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
			<div class="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
				<h2 id="faq-title" class="font-serif text-[clamp(2rem,4vw,3.25rem)] leading-tight">{t('products.faqs')}</h2>
			</div>
			<div class="lg:col-span-8">
				<FaqAccordion items={p.t.faqs} />
			</div>
		</div>
	</section>
{/if}

{#if p.t.regulatoryText}
	<div class="bg-cream-100 px-4 pt-10 sm:px-6"><p class="mx-auto max-w-7xl whitespace-pre-line text-sm text-stone-600">{p.t.regulatoryText}</p></div>
{/if}

{#if data.related.length}
	<section class="bg-cream-100 px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
		<div class="mx-auto max-w-7xl">
			<h2 class="font-serif text-3xl text-forest-700">{t('products.related')}</h2>
			<ul class="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
				{#each data.related as r (r.id)}<li><ProductCard lang={data.lang} product={r} /></li>{/each}
			</ul>
		</div>
	</section>
{:else}
	<div class="bg-cream-100 pb-16"></div>
{/if}

<style>
	.giant-word {
		font-size: clamp(5rem, 19vw, 17rem);
		color: color-mix(in srgb, var(--forest-700) 8%, transparent);
		transform: translate3d(calc((var(--p, 0.5) - 0.5) * -12%), -50%, 0);
	}
	.stage-3d {
		perspective: 1200px;
	}
	.pack-3d {
		transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition: transform 0.3s ease-out;
		will-change: transform;
	}
	.mark {
		font-size: 0.4em;
		vertical-align: super;
		line-height: 0;
		margin-right: 0.15em;
	}
	.body-copy :global(p) {
		margin-block: 1em;
		max-width: 66ch;
		line-height: 1.7;
	}
	.body-copy :global(p:first-child) {
		margin-top: 0;
	}
	.body-copy :global(ul) {
		list-style: disc;
		padding-left: 1.4em;
		margin-block: 1em;
	}
	.statement :global(p:first-child) {
		font-family: var(--font-serif-stack);
		font-size: clamp(1.4rem, 2.6vw, 2.25rem);
		line-height: 1.3;
		color: var(--forest-700);
		max-width: 46ch;
	}
</style>
