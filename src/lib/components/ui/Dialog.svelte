<script lang="ts">
	import type { Snippet } from 'svelte';
	let { label, children }: { label: string; children: Snippet } = $props();
	let el: HTMLDialogElement | undefined = $state();
	export function show() {
		if (el && !el.open) el.showModal();
	}
	export function close() {
		if (el?.open) el.close();
	}
</script>

<dialog bind:this={el} aria-label={label}
	onclick={(e) => { if (e.target === el) close(); }}
	class="m-auto w-[min(92vw,56rem)] rounded-md bg-cream-100 p-0 text-ink-900 shadow-2xl backdrop:bg-forest-900/70">
	<div class="p-6">{@render children()}</div>
</dialog>
