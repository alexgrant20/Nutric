<script lang="ts">
	let { src, alt, class: cls = '', width, height, loading = 'lazy' }: {
		src: string | null; alt: string; class?: string; width?: number; height?: number; loading?: 'lazy' | 'eager';
	} = $props();
	let failed = $state(false);
</script>

{#if src && !failed}
	<img {src} {alt} {width} {height} {loading} class={cls} onerror={() => (failed = true)} />
{:else}
	<div role="img" aria-label={alt} class="flex items-center justify-center bg-stone-600/10 p-3 text-center text-sm text-stone-600 {cls}">
		{alt}
	</div>
{/if}
