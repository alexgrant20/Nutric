<script lang="ts">
	import { onMount } from 'svelte';
	let { message }: { message: string } = $props();
	let visible = $state(true);
	onMount(() => { const id = setTimeout(() => (visible = false), 4000); return () => clearTimeout(id); });
</script>

{#if visible}
	<p role="status" class="toast fixed bottom-20 right-6 z-50 flex items-center gap-3 rounded-sm bg-forest-900 px-5 py-3 text-cream-100 shadow-xl">
		<span class="size-2 rounded-full bg-lime-400" aria-hidden="true"></span>{message}
	</p>
{/if}

<style>
	@media (prefers-reduced-motion: no-preference) {
		.toast {
			animation: toast-in 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
		}
	}
	@keyframes toast-in {
		from { opacity: 0; transform: translateY(0.75rem); }
	}
</style>
