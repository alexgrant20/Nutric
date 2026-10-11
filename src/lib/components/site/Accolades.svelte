<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { tilt } from '../ui/motion';
	import { reveal } from '../ui/reveal';
	import Dialog from '../ui/Dialog.svelte';
	import Img from '../ui/Img.svelte';

	let { lang, items, expanded = false }: { lang: string; items: any[]; expanded?: boolean } = $props();
	const t = useT();
	let selected: any = $state(null);
	let dialog: Dialog | undefined = $state();

	// Newest year first: the cabinet opens on the latest recognition and the history runs to the right.
	const groups = $derived.by(() => {
		const map = new Map<number | null, any[]>();
		for (const it of items) map.set(it.year ?? null, [...(map.get(it.year ?? null) ?? []), it]);
		return [...map.entries()].sort((a, b) => (b[0] ?? -1) - (a[0] ?? -1));
	});
	function show(it: any) { selected = it; dialog?.show(); }
	// Titles generated from the file name carry no information, so they are not printed under the trophy.
	const hasCaption = (it: any) => !!(it.issuer || it.t.description);
</script>

<section id="accolades" class="relative overflow-hidden bg-cream-100 px-4 py-24 sm:px-6 sm:py-32">
	<div class="mx-auto max-w-7xl" use:reveal>
		<svelte:element this={expanded ? 'h1' : 'h2'} class="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none text-forest-700">{t('accolades.title')}</svelte:element>

		<div class="cabinet mt-14 overflow-x-auto pb-4" tabindex="-1">
			<ol class="flex min-w-max items-end gap-16 px-2">
				{#each groups as [year, list] (year)}
					<li>
						<ul class="flex items-end gap-10">
							{#each list as it (it.id)}
								<li class="trophy" use:tilt={{ max: 11 }}>
									<button type="button" onclick={() => show(it)} class="group relative block text-center" aria-label={it.t.title}>
										<Img src={it.image} alt={it.t.imageAlt ?? it.t.title} class="trophy-img" />
										<span class="trophy-shadow" aria-hidden="true"></span>
									</button>
									{#if hasCaption(it)}
										<p class="mt-4 max-w-[12rem] text-sm text-stone-600">
											{#if it.issuer}<span class="block font-medium text-forest-700">{it.issuer}</span>{/if}
											{#if expanded && it.t.description}{it.t.description}{/if}
										</p>
									{/if}
								</li>
							{/each}
						</ul>
						<div class="shelf" aria-hidden="true"></div>
						{#if year}<p class="mt-4 font-serif text-3xl tabular-nums text-forest-700">{year}</p>{/if}
					</li>
				{/each}
			</ol>
		</div>
		{#if !expanded}<a href="/{lang}/accolades" class="mt-8 inline-flex min-h-11 items-center text-forest-700 underline underline-offset-4">{t('accolades.title')}</a>{/if}
	</div>
</section>

<Dialog bind:this={dialog} label={selected?.t.title ?? t('accolades.title')}>
	{#if selected}
		<div class="flex justify-end">
			<button onclick={() => dialog?.close()} class="min-h-11 rounded-sm border border-forest-700/40 px-4">{t('accolades.close')}</button>
		</div>
		<Img src={selected.image} alt={selected.t.imageAlt ?? selected.t.title} class="mx-auto mt-2 max-h-[70vh] w-auto" />
		<h3 class="mt-4 font-serif text-2xl text-forest-700">{selected.year ? `${selected.year}` : selected.t.title}</h3>
		{#if selected.issuer}<p class="text-sm text-stone-600">{t('accolades.issuedBy', { issuer: selected.issuer })}</p>{/if}
		{#if selected.t.description}<p class="mt-2">{selected.t.description}</p>{/if}
	{/if}
</Dialog>

<style>
	/* Each trophy stands on the shelf, tilts toward the pointer and lifts a little: the images are flat renders,
	   so depth comes from perspective, a lift and a contact shadow, never from stretching them. */
	.trophy :global(.trophy-img) {
		display: block;
		width: auto;
		height: auto;
		max-height: 15rem;
		margin: 0 auto;
		transform: perspective(700px) rotateY(var(--ry, 0deg)) rotateX(calc(var(--rx, 0deg) * 0.35)) translateY(0);
		transition: transform 0.3s ease-out;
		will-change: transform;
	}
	.trophy:hover :global(.trophy-img),
	.trophy:focus-within :global(.trophy-img) {
		transform: perspective(700px) rotateY(var(--ry, 0deg)) rotateX(calc(var(--rx, 0deg) * 0.35)) translateY(-10px);
	}
	.trophy-shadow {
		position: absolute;
		left: 12%;
		right: 12%;
		bottom: -0.5rem;
		height: 0.9rem;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(0 0 0 / 0.38), transparent);
		filter: blur(4px);
		transition: transform 0.3s ease-out, opacity 0.3s ease-out;
	}
	.trophy:hover .trophy-shadow {
		transform: scale(0.82);
		opacity: 0.7;
	}
	.shelf {
		height: 0.75rem;
		margin-top: 0.1rem;
		border-radius: 0.125rem;
		background: linear-gradient(to bottom, color-mix(in srgb, var(--forest-700) 24%, var(--cream-100)), color-mix(in srgb, var(--forest-700) 10%, var(--cream-100)));
		box-shadow: 0 0.55rem 0.8rem -0.4rem rgb(0 0 0 / 0.18);
	}
</style>
