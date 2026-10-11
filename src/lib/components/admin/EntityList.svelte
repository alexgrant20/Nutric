<script lang="ts">
	import { enhance } from '$app/forms';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Toast from './Toast.svelte';
	let { entity, rows, q, saved }: { entity: any; rows: any[]; q: string; saved: boolean } = $props();
	let confirmRow: any = $state(null);
	let dialog: Dialog | undefined = $state();
	function ask(row: any) { confirmRow = row; dialog?.show(); }
</script>

{#if saved}<Toast message="Saved." />{/if}

<div class="flex flex-wrap items-center justify-between gap-4">
	<h1 class="font-serif text-3xl text-forest-700">{entity.label}</h1>
	<a href="/admin/{entity.key}/new" class="inline-flex min-h-12 items-center rounded-sm bg-forest-700 px-5 text-cream-100">Add {entity.singular}</a>
</div>

<form method="get" class="mt-6 max-w-sm">
	<label for="q" class="text-sm">Search</label>
	<input id="q" name="q" value={q} class="mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2" />
</form>

{#if !rows.length}
	<p class="mt-10 text-stone-600">{q ? `No ${entity.label.toLowerCase()} match "${q}".` : `No ${entity.label.toLowerCase()} yet.`} <a class="underline" href="/admin/{entity.key}/new">Add the first {entity.singular}</a>.</p>
{:else}
	<div class="mt-6 overflow-x-auto">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead><tr class="border-b border-forest-700/30"><th class="p-2">Image</th><th class="p-2">Name</th><th class="p-2">Status</th><th class="p-2">Order</th><th class="p-2">Missing</th><th class="p-2"><span class="sr-only">Actions</span></th></tr></thead>
			<tbody>
				{#each rows as r (r.id)}
					<tr class="border-b border-forest-700/15">
						<td class="p-2">{#if r.thumb}<img src={r.thumb} alt="" class="size-12 rounded-sm bg-white object-contain" />{/if}</td>
						<td class="p-2"><a class="font-medium underline" href="/admin/{entity.key}/{r.id}">{r.title}</a></td>
						<td class="p-2">
							{#if r.published !== null}
								<form method="post" action="?/toggle" use:enhance class="inline">
									<input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value={entity.publish.name} />
									<button class="min-h-11 rounded-sm border border-forest-700/40 px-3">{r.published ? 'Published' : 'Draft'}</button>
								</form>
							{/if}
							{#if r.bestSeller !== null}
								<form method="post" action="?/toggle" use:enhance class="inline">
									<input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value="isBestSeller" />
									<button aria-pressed={r.bestSeller} class="min-h-11 rounded-sm border border-forest-700/40 px-3">{r.bestSeller ? 'Best seller' : 'Not best seller'}</button>
								</form>
							{/if}
						</td>
						<td class="p-2">{r.sortOrder ?? ''}</td>
						<td class="p-2 text-xs text-stone-600">{r.missing.join(', ')}</td>
						<td class="p-2 text-right"><button class="min-h-11 px-3 text-red-800 underline" onclick={() => ask(r)}>Delete</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<Dialog bind:this={dialog} label="Confirm delete">
	{#if confirmRow}
		<h2 class="font-serif text-2xl">Delete "{confirmRow.title}"?</h2>
		<p class="mt-2 text-stone-600">This removes it and all its translations. This cannot be undone.</p>
		<form method="post" action="?/delete" use:enhance={() => async ({ update }) => { await update(); dialog?.close(); }} class="mt-6 flex gap-3">
			<input type="hidden" name="id" value={confirmRow.id} />
			<button class="min-h-12 rounded-sm bg-red-800 px-5 text-white">Delete</button>
			<button type="button" class="min-h-12 px-4 underline" onclick={() => dialog?.close()}>Cancel</button>
		</form>
	{/if}
</Dialog>
