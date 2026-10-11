<script lang="ts">
	import { onMount } from 'svelte';
	let { message }: { message: string } = $props();
	let visible = $state(true);
	onMount(() => { const id = setTimeout(() => (visible = false), 4000); return () => clearTimeout(id); });
</script>

{#if visible}
	<p role="status" class="fixed bottom-6 right-6 z-50 rounded-md bg-forest-700 px-5 py-3 text-cream-100 shadow-xl">{message}</p>
{/if}
