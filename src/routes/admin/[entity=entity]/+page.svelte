<script lang="ts">
	import EntityList from '$lib/components/admin/EntityList.svelte';
	let { data } = $props();
</script>
<svelte:head><title>{data.entity.label} | Admin</title></svelte:head>
<EntityList entity={data.entity} rows={data.rows} q={data.q} saved={data.saved} />
