<script lang="ts">
	import '../app.css';
	let { data, children } = $props();
</script>

<svelte:head>
	{@html `<style>${data.themeCss}</style>`}
</svelte:head>

{@render children()}
