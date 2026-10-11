<script lang="ts">
	import EntityForm from '$lib/components/admin/EntityForm.svelte';
	let { data, form } = $props();
</script>
<svelte:head><title>{data.id === null ? 'Add' : 'Edit'} {data.entity.singular} | Admin</title></svelte:head>
<h1 class="mb-6 font-serif text-3xl text-forest-700">{data.id === null ? 'Add' : 'Edit'} {data.entity.singular}</h1>
{#key form?.initial ?? data.initial}
	<EntityForm entity={data.entity} initial={form?.initial ?? data.initial} errors={form?.errors ?? {}} relations={data.relations} languages={data.languages} />
{/key}
