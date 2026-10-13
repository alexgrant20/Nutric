<script lang="ts">
	let { data } = $props();
	const labels: Record<string, string> = { products: 'products', collections: 'collections', news: 'news items', testimonials: 'videos', accolades: 'accolades' };
	// Only real problems are listed: unpublished items and missing translations.
	const attention = $derived(
		data.content.flatMap((c) => [
			...(c.hidden ? [{ key: `${c.key}-h`, href: `/admin/${c.key}`, text: `${c.hidden} ${labels[c.key]} ${c.hidden === 1 ? 'is' : 'are'} hidden from visitors`, action: 'Review' }] : []),
			...(c.untranslated ? [{ key: `${c.key}-t`, href: `/admin/${c.key}`, text: `${c.untranslated} ${labels[c.key]} ${c.untranslated === 1 ? 'is' : 'are'} missing a translation`, action: 'Open list' }] : [])
		])
	);
</script>

<svelte:head><title>Dashboard | Admin</title></svelte:head>

<header class="adm-head">
	<div>
		<h1 class="adm-title">Dashboard</h1>
		<p class="adm-sub">What is on the site, and what still needs a look.</p>
	</div>
	<a href="/" target="_blank" rel="noopener" class="adm-btn-ghost">View the site</a>
</header>

<div class="mt-10 grid gap-12 xl:grid-cols-12">
	<section class="xl:col-span-7" aria-labelledby="content-h">
		<h2 id="content-h" class="adm-section-title">Content</h2>
		<ul class="mt-4 border-t border-forest-700/30">
			{#each data.content as c (c.key)}
				<li class="border-b border-forest-700/15">
					<a href="/admin/{c.key}" class="group grid min-h-16 grid-cols-[4rem_1fr_auto] items-center gap-4 px-1 hover:bg-white/60">
						<span class="font-serif text-3xl tabular-nums text-forest-700">{c.total}</span>
						<span>
							<span class="block font-medium text-forest-700 group-hover:underline">{c.label}</span>
							<span class="block text-sm text-stone-600">
								{#if c.total === 0}None yet. Add the first one.{:else}{c.total - c.hidden} visible{c.hidden ? `, ${c.hidden} hidden` : ''}{/if}
							</span>
						</span>
						<span class="text-sm text-forest-700 underline underline-offset-4 group-hover:no-underline">Open</span>
					</a>
				</li>
			{/each}
			<li class="border-b border-forest-700/15">
				<a href="/admin/subscribers" class="group grid min-h-16 grid-cols-[4rem_1fr_auto] items-center gap-4 px-1 hover:bg-white/60">
					<span class="font-serif text-3xl tabular-nums text-forest-700">{data.subscribers}</span>
					<span>
						<span class="block font-medium text-forest-700 group-hover:underline">Subscribers</span>
						<span class="block text-sm text-stone-600">{data.subscribers ? 'Newsletter sign-ups' : 'None yet. They appear when visitors use the newsletter form.'}</span>
					</span>
					<span class="text-sm text-forest-700 underline underline-offset-4 group-hover:no-underline">Open</span>
				</a>
			</li>
		</ul>
	</section>

	<section class="xl:col-span-5" aria-labelledby="todo-h">
		<h2 id="todo-h" class="adm-section-title">Needs attention</h2>
		{#if attention.length || data.drafts.length}
			<ul class="mt-4 border-t border-forest-700/30">
				{#each data.drafts as d (d.id)}
					<li class="flex items-center justify-between gap-4 border-b border-forest-700/15 py-3">
						<span class="min-w-0"><span class="block text-sm text-stone-600">News draft</span><span class="block truncate font-medium text-forest-700">{d.slug}</span></span>
						<a class="adm-btn-ghost shrink-0" href="/admin/news/{d.id}">Finish</a>
					</li>
				{/each}
				{#each attention as a (a.key)}
					<li class="flex items-center justify-between gap-4 border-b border-forest-700/15 py-3">
						<span class="text-forest-700">{a.text}</span>
						<a class="adm-btn-ghost shrink-0" href={a.href}>{a.action}</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-4 border-t border-forest-700/30 pt-4 text-stone-600">Nothing is waiting. Every item is published and translated.</p>
		{/if}
	</section>
</div>
