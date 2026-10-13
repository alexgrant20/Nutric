<script lang="ts">
	import EntityForm from '$lib/components/admin/EntityForm.svelte';
	let { data, form } = $props();
</script>
<svelte:head><title>{data.id === null ? 'Add' : 'Edit'} {data.entity.singular} | Admin</title></svelte:head>
<header class="adm-head max-w-5xl">
	<div>
		<h1 class="adm-title">{data.id === null ? 'Add' : 'Edit'} {data.entity.singular}</h1>
		<p class="adm-sub"><a href="/admin/{data.entity.key}" class="underline underline-offset-4">Back to {data.entity.label.toLowerCase()}</a></p>
	</div>
</header>
{#key form?.initial ?? data.initial}
	<EntityForm entity={data.entity} initial={form?.initial ?? data.initial} errors={form?.errors ?? {}} relations={data.relations} languages={data.languages} />
{/key}
