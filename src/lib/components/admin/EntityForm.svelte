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
	const doneCount = $derived(languages.filter((l) => complete[l.code]).length);
</script>

<form method="post" action="?/save" enctype="multipart/form-data" class="max-w-5xl"
	use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }}>
	{#if Object.keys(errors).length}
		<div role="alert" class="adm-alert mb-2">Please fix {Object.keys(errors).length} field(s) below.</div>
	{/if}

	{#if baseFields.length}
		<section class="adm-section" aria-labelledby="details-h">
			<div>
				<h2 id="details-h" class="adm-section-title">Details</h2>
				<p class="adm-help">The same in every language.</p>
			</div>
			<div class="max-w-xl space-y-5">
				{#each baseFields as f (f.name)}
					{#if f.type === 'image' || f.type === 'imageList'}
						<ImageField name={f.name} label={f.label} value={initial.base[f.name] ?? null} multiple={f.type === 'imageList'} error={errors[`f.${f.name}`]} help={f.help} />
					{:else if f.type === 'boolean'}
						<label class="flex min-h-11 items-center gap-3 text-sm font-medium text-forest-700">
							<input type="checkbox" name="f.{f.name}" checked={!!initial.base[f.name]} class="size-5 accent-forest-700" /> {f.label}
							{#if f.help}<span class="font-normal text-stone-600">({f.help})</span>{/if}
						</label>
					{:else}
						<div>
							<label for="f-{f.name}" class="adm-label">{f.label}{f.required ? ' *' : ''}</label>
							{#if f.type === 'select'}
								<select id="f-{f.name}" name="f.{f.name}" class="adm-input">
									{#each f.options as o (o.value)}<option value={o.value} selected={initial.base[f.name] === o.value}>{o.label}</option>{/each}
								</select>
							{:else if f.type === 'relation'}
								<select id="f-{f.name}" name="f.{f.name}" class="adm-input">
									<option value="">None</option>
									{#each relations[f.relation] ?? [] as o (o.value)}<option value={o.value} selected={String(initial.base[f.name]) === o.value}>{o.label}</option>{/each}
								</select>
							{:else}
								<input id="f-{f.name}" name="f.{f.name}" class="adm-input"
									type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'}
									value={initial.base[f.name] ?? ''} />
							{/if}
							{#if f.help && f.type !== 'boolean'}<p class="adm-help">{f.help}</p>{/if}
							{#if errors[`f.${f.name}`]}<p role="alert" class="adm-error">{errors[`f.${f.name}`]}</p>{/if}
						</div>
					{/if}
				{/each}
			</div>
		</section>
	{/if}

	{#if trFields.length}
		<section class="adm-section" aria-labelledby="lang-h">
			<div>
				<h2 id="lang-h" class="adm-section-title">Text by language</h2>
				<p class="adm-help">{doneCount} of {languages.length} languages complete. A missing language shows the English text to visitors.</p>
			</div>
			<div class="min-w-0">
				<LanguageTabs {languages} {complete}>
					{#snippet children(code)}
						{#each trFields as f (f.name)}
							{@const key = `t.${code}.${f.name}`}
							{#if f.type === 'markdown'}
								<MarkdownField name={key} label={f.label} bind:value={tv[code][f.name]} error={errors[key]} />
							{:else}
								<div>
									<label for={key} class="adm-label">{f.label}{f.required && code === 'en' ? ' *' : ''}</label>
									{#if f.type === 'text'}
										<input id={key} name={key} bind:value={tv[code][f.name]} class="adm-input" />
									{:else}
										<textarea id={key} name={key} rows={f.type === 'faqs' ? 8 : 4} bind:value={tv[code][f.name]} class="adm-input"></textarea>
									{/if}
									{#if f.help}<p class="adm-help">{f.help}</p>{/if}
									{#if errors[key]}<p role="alert" class="adm-error">{errors[key]}</p>{/if}
								</div>
							{/if}
						{/each}
					{/snippet}
				</LanguageTabs>
			</div>
		</section>
	{/if}

	<div class="adm-savebar">
		<button disabled={busy} class="adm-btn">{busy ? 'Saving' : 'Save'}</button>
		<a href="/admin/{entity.key}" class="adm-btn-ghost">Cancel</a>
	</div>
</form>
