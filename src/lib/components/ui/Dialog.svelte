<script lang="ts">
	import type { Snippet } from 'svelte';
	let { open = $bindable(false), label, children }: { open: boolean; label: string; children: Snippet } = $props();
	let el: HTMLDialogElement | undefined = $state();
	$effect(() => {
		if (!el) return;
		if (open && !el.open) el.showModal();
		if (!open && el.open) el.close();
	});
</script>

<dialog bind:this={el} aria-label={label} onclose={() => (open = false)}
	onclick={(e) => { if (e.target === el) open = false; }}
	class="m-auto w-[min(92vw,56rem)] rounded-md bg-cream-100 p-0 text-ink-900 shadow-2xl backdrop:bg-forest-900/70">
	<div class="p-6">{@render children()}</div>
</dialog>
