<script lang="ts">
	import { enhance } from '$app/forms';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Toast from './Toast.svelte';
	let { entity, rows, q, saved }: { entity: any; rows: any[]; q: string; saved: boolean } = $props();
	let confirmRow: any = $state(null);
	let dialog: Dialog | undefined = $state();
	function ask(row: any) { confirmRow = row; dialog?.show(); }
	const hasOrder = $derived(rows.some((r) => r.sortOrder !== null));
</script>

{#if saved}<Toast message="Saved." />{/if}

<header class="adm-head">
	<div>
		<h1 class="adm-title">{entity.label}</h1>
		<p class="adm-sub">{rows.length} {rows.length === 1 ? entity.singular : entity.label.toLowerCase()}{q ? ` matching "${q}"` : ''}</p>
	</div>
	<a href="/admin/{entity.key}/new" class="adm-btn">Add {entity.singular}</a>
</header>

<form method="get" class="mt-6 max-w-sm" role="search">
	<label for="q" class="adm-label">Search</label>
	<input id="q" name="q" value={q} type="search" placeholder="Search by name" class="adm-input" />
</form>

{#if !rows.length}
	<p class="mt-10 max-w-prose text-stone-600">
		{q ? `No ${entity.label.toLowerCase()} match "${q}". Try a shorter word, or clear the search.` : `No ${entity.label.toLowerCase()} yet.`}
		<a class="text-forest-700 underline underline-offset-4" href="/admin/{entity.key}/new">Add the first {entity.singular}</a>.
	</p>
{:else}
	<div class="mt-6 overflow-x-auto">
		<table class="adm-table">
			<thead>
				<tr>
					<th class="w-20">Image</th><th>Name</th><th>Status</th>{#if hasOrder}<th class="w-20">Order</th>{/if}<th>Missing languages</th><th><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r (r.id)}
					<tr>
						<td><span class="adm-thumb">{#if r.thumb}<img src={r.thumb} alt="" />{/if}</span></td>
						<td><a class="font-medium text-forest-700 underline-offset-4 hover:underline" href="/admin/{entity.key}/{r.id}">{r.title}</a></td>
						<td>
							<div class="flex gap-2">
								{#if r.published !== null}
									<form method="post" action="?/toggle" use:enhance class="inline">
										<input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value={entity.publish.name} />
										<button class="adm-state" data-on={r.published} title="Click to switch">{r.published ? 'Published' : 'Draft'}</button>
									</form>
								{/if}
								{#if r.bestSeller !== null}
									<form method="post" action="?/toggle" use:enhance class="inline">
										<input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value="isBestSeller" />
										<button aria-pressed={r.bestSeller} class="adm-state" data-on={r.bestSeller} title="Click to switch">{r.bestSeller ? 'Best seller' : 'Not best seller'}</button>
									</form>
								{/if}
							</div>
						</td>
						{#if hasOrder}<td class="tabular-nums text-stone-600">{r.sortOrder ?? ''}</td>{/if}
						<td>
							{#if r.missing.length}
								<span class="flex flex-wrap gap-1">{#each r.missing as l (l)}<span class="adm-code">{l}</span>{/each}</span>
							{:else}<span class="text-sm text-stone-600">All translated</span>{/if}
						</td>
						<td class="text-right"><button class="adm-link-danger" onclick={() => ask(r)}>Delete</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<Dialog bind:this={dialog} label="Confirm delete">
	{#if confirmRow}
		<h2 class="font-serif text-2xl text-forest-700">Delete "{confirmRow.title}"?</h2>
		<p class="mt-2 text-stone-600">This removes it and all its translations. This cannot be undone.</p>
		<form method="post" action="?/delete" use:enhance={() => async ({ update }) => { await update(); dialog?.close(); }} class="mt-6 flex gap-3">
			<input type="hidden" name="id" value={confirmRow.id} />
			<button class="min-h-12 rounded-sm bg-red-800 px-5 font-medium text-white hover:bg-red-900">Delete</button>
			<button type="button" class="adm-btn-ghost" onclick={() => dialog?.close()}>Cancel</button>
		</form>
	{/if}
</Dialog>
