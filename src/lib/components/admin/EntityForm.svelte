<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageField from './ImageField.svelte';
	import MarkdownField from './MarkdownField.svelte';
	import LanguageTabs from './LanguageTabs.svelte';

	let { entity, initial, errors = {}, relations, languages }: {
		entity: any; initial: { base: Record<string, any>; trs: Record<string, Record<string, any>> };
		errors?: Record<string, string>; relations: Record<string, { value: string; label: string }[]>; languages: { code: string; label: string }[];
	} = $props();

	const baseFields = $derived(entity.fields.filter((f: any) => !f.translatable));
	const trFields = $derived(entity.fields.filter((f: any) => f.translatable));
	let busy = $state(false);
	const tv: Record<string, Record<string, any>> = $state(
		Object.fromEntries(languages.map((l) => [l.code, Object.fromEntries(entity.fields.filter((f: any) => f.translatable).map((f: any) => [f.name, initial.trs[l.code]?.[f.name] ?? '']))]))
	);
	const complete = $derived(Object.fromEntries(languages.map((l) => [l.code,
		trFields.filter((f: any) => f.required).every((f: any) => String(tv[l.code][f.name] ?? '').trim() !== '')
		&& trFields.some((f: any) => String(tv[l.code][f.name] ?? '').trim() !== '')])));
	const input = 'mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2';
</script>

<form method="post" action="?/save" enctype="multipart/form-data" class="max-w-3xl space-y-6"
	use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }}>
	{#if Object.keys(errors).length}
		<div role="alert" class="rounded-sm border border-red-800 bg-red-50 p-3 text-sm text-red-900">Please fix {Object.keys(errors).length} field(s) below.</div>
	{/if}

	{#each baseFields as f (f.name)}
		{#if f.type === 'image' || f.type === 'imageList'}
			<ImageField name={f.name} label={f.label} value={initial.base[f.name] ?? null} multiple={f.type === 'imageList'} error={errors[`f.${f.name}`]} help={f.help} />
		{:else if f.type === 'boolean'}
			<label class="flex min-h-11 items-center gap-3 text-sm">
				<input type="checkbox" name="f.{f.name}" checked={!!initial.base[f.name]} class="size-5" /> {f.label}
				{#if f.help}<span class="text-stone-600">({f.help})</span>{/if}
			</label>
		{:else}
			<div>
				<label for="f-{f.name}" class="text-sm font-medium">{f.label}{f.required ? ' *' : ''}</label>
				{#if f.type === 'select'}
					<select id="f-{f.name}" name="f.{f.name}" class={input}>
						{#each f.options as o (o.value)}<option value={o.value} selected={initial.base[f.name] === o.value}>{o.label}</option>{/each}
					</select>
				{:else if f.type === 'relation'}
					<select id="f-{f.name}" name="f.{f.name}" class={input}>
						<option value="">None</option>
						{#each relations[f.relation] ?? [] as o (o.value)}<option value={o.value} selected={String(initial.base[f.name]) === o.value}>{o.label}</option>{/each}
					</select>
				{:else}
					<input id="f-{f.name}" name="f.{f.name}" class={input}
						type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'}
						value={initial.base[f.name] ?? ''} />
				{/if}
				{#if f.help && f.type !== 'boolean'}<p class="mt-1 text-xs text-stone-600">{f.help}</p>{/if}
				{#if errors[`f.${f.name}`]}<p role="alert" class="text-sm text-red-800">{errors[`f.${f.name}`]}</p>{/if}
			</div>
		{/if}
	{/each}

	<LanguageTabs {languages} {complete}>
		{#snippet children(code)}
			{#each trFields as f (f.name)}
				{@const key = `t.${code}.${f.name}`}
				{#if f.type === 'markdown'}
					<MarkdownField name={key} label={f.label} bind:value={tv[code][f.name]} error={errors[key]} />
				{:else}
					<div>
						<label for={key} class="text-sm font-medium">{f.label}{f.required && code === 'en' ? ' *' : ''}</label>
						{#if f.type === 'text'}
							<input id={key} name={key} bind:value={tv[code][f.name]} class={input} />
						{:else}
							<textarea id={key} name={key} rows={f.type === 'faqs' ? 8 : 4} bind:value={tv[code][f.name]} class={input}></textarea>
						{/if}
						{#if f.help}<p class="mt-1 text-xs text-stone-600">{f.help}</p>{/if}
						{#if errors[key]}<p role="alert" class="text-sm text-red-800">{errors[key]}</p>{/if}
					</div>
				{/if}
			{/each}
		{/snippet}
	</LanguageTabs>

	<div class="flex gap-3">
		<button disabled={busy} class="min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100 disabled:opacity-60">{busy ? 'Saving' : 'Save'}</button>
		<a href="/admin/{entity.key}" class="inline-flex min-h-12 items-center px-4 underline">Cancel</a>
	</div>
</form>
