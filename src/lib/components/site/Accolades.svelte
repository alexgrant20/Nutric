<script lang="ts">
	import { useT } from '$lib/i18n/context';
	import { reveal } from '../ui/reveal';
	import Dialog from '../ui/Dialog.svelte';
	import Img from '../ui/Img.svelte';
	let { lang, items, expanded = false }: { lang: string; items: any[]; expanded?: boolean } = $props();
	const t = useT();
	let selected: any = $state(null);
	let dialog: Dialog | undefined = $state();
	const groups = $derived.by(() => {
		const map = new Map<number | null, any[]>();
		for (const it of items) map.set(it.year ?? null, [...(map.get(it.year ?? null) ?? []), it]);
		return [...map.entries()].sort((a, b) => (a[0] ?? 9999) - (b[0] ?? 9999));
	});
	const hasYears = $derived(items.some((i) => i.year != null));
	function show(it: any) { selected = it; dialog?.show(); }
</script>

<section id="accolades" class="bg-cream-100 px-4 py-24 sm:px-6">
	<div class="mx-auto max-w-7xl" use:reveal>
		<svelte:element this={expanded ? 'h1' : 'h2'} class="font-serif text-3xl text-forest-700 sm:text-4xl">{t('accolades.title')}</svelte:element>
		<div class="mt-10 flex gap-10 overflow-x-auto pb-6">
			{#each groups as [year, list] (year)}
				<div class="shrink-0">
					{#if hasYears}
						<div class="flex items-center gap-3">
							<span class="font-serif text-2xl text-forest-700">{year ?? ''}</span>
							<span class="h-px w-24 bg-forest-700/40"></span>
						</div>
					{/if}
					<ul class="mt-4 flex gap-4">
						{#each list as it (it.id)}
							<li class="w-56 shrink-0">
								<button onclick={() => show(it)} class="group block w-full text-left">
									<Img src={it.image} alt={it.t.imageAlt ?? it.t.title} class="aspect-[3/4] w-full rounded-sm bg-white object-contain transition-transform duration-200 group-hover:scale-[1.03]" />
									<span class="mt-2 block text-sm font-medium">{it.t.title}</span>
									{#if expanded && it.t.description}<span class="mt-1 block text-sm text-stone-600">{it.t.description}</span>{/if}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
		{#if !expanded}<a href="/{lang}/accolades" class="inline-flex min-h-11 items-center text-forest-700 underline underline-offset-4">{t('accolades.title')}</a>{/if}
	</div>
</section>

<Dialog bind:this={dialog} label={selected?.t.title ?? t('accolades.title')}>
	{#if selected}
		<div class="flex justify-end">
			<button onclick={() => dialog?.close()} class="min-h-11 rounded-sm border border-forest-700/40 px-4">{t('accolades.close')}</button>
		</div>
		<Img src={selected.image} alt={selected.t.imageAlt ?? selected.t.title} class="mx-auto mt-2 max-h-[70vh] w-auto" />
		<h3 class="mt-4 font-serif text-2xl text-forest-700">{selected.t.title}</h3>
		{#if selected.issuer}<p class="text-sm text-stone-600">{t('accolades.issuedBy', { issuer: selected.issuer })}</p>{/if}
		{#if selected.t.description}<p class="mt-2">{selected.t.description}</p>{/if}
	{/if}
</Dialog>
