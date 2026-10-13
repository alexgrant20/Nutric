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
		<label for={name} class="adm-label">{label}</label>
		<button type="button" onclick={toggle} class="min-h-11 px-1 text-sm text-forest-700 underline underline-offset-4">{preview ? 'Back to editing' : 'Preview'}</button>
	</div>
	<textarea id={name} {name} rows="10" bind:value hidden={preview} class="adm-input font-mono text-sm"></textarea>
	{#if preview}<div class="prose-md mt-1 rounded-sm border border-forest-700/30 bg-white p-5">{@html html}</div>{/if}
	{#if error}<p role="alert" class="adm-error">{error}</p>{/if}
</div>
