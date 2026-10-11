<script lang="ts">
	let { name, label, value = $bindable(''), error }: { name: string; label: string; value: string; error?: string } = $props();
	let preview = $state(false);
	let html = $state('');
	async function toggle() {
		preview = !preview;
		if (preview) {
			const res = await fetch('/admin/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ md: value }) });
			html = (await res.json()).html;
		}
	}
</script>

<div>
	<div class="flex items-center justify-between">
		<label for={name} class="text-sm font-medium">{label}</label>
		<button type="button" onclick={toggle} class="min-h-11 text-sm underline">{preview ? 'Edit' : 'Preview'}</button>
	</div>
	<textarea id={name} {name} rows="8" bind:value hidden={preview} class="mt-1 w-full rounded-sm border border-stone-600 bg-white p-3 font-mono text-sm"></textarea>
	{#if preview}<div class="prose-md mt-1 rounded-sm border border-stone-600/40 bg-white p-4">{@html html}</div>{/if}
	{#if error}<p role="alert" class="text-sm text-red-800">{error}</p>{/if}
</div>
