<script lang="ts">
	let { values, fields, languages, onbusy, onfields }: {
		values: Record<string, Record<string, string>>; fields: string[];
		languages: { code: string; label: string }[]; onbusy?: (busy: boolean) => void;
		onfields: (language: string, translated: Record<string, string>) => void;
	} = $props();
	let source = $state('en');
	let target = $state('all');
	let busy = $state(false);
	let message = $state('');
	let failure = $state(false);
	const uid = $props.id();
	async function translate() {
		busy = true; failure = false; message = ''; onbusy?.(true);
		let filled = 0;
		const skipped: string[] = [];
		const original = { ...values[source] };
		try {
			if (!fields.some((key) => original[key]?.trim())) throw new Error('Fill in the source language first.');
			const targets = languages.filter((l) => l.code !== source && (target === 'all' || l.code === target));
			if (!targets.length) throw new Error('Choose a different target language.');
			for (const language of targets) {
				const pending = fields.filter((key) => original[key]?.trim() && !values[language.code]?.[key]?.trim());
				if (!pending.length) continue;
				message = `Translating ${language.label}…`;
				const response = await fetch('/admin/translate', {
					method: 'POST', headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ source, target: language.code, fields: Object.fromEntries(pending.map((key) => [key, original[key]])) })
				});
				const result = await response.json();
				if (response.status === 422 && result.unsupported && target === 'all') { skipped.push(language.label); continue; }
				if (!response.ok) throw new Error(result.error || 'Translation failed.');
				const updates = Object.fromEntries(pending.filter((key) => !values[language.code][key]?.trim() && typeof result.fields?.[key] === 'string').map((key) => [key, result.fields[key] as string]));
				onfields(language.code, updates);
				filled += Object.keys(updates).length;
			}
			message = (filled ? `${filled} ${filled === 1 ? 'field' : 'fields'} translated. Review the language tabs, then Save.` : 'No empty fields to translate. Existing text was kept.')
				+ (skipped.length ? ` DeepL does not support: ${skipped.join(', ')}.` : '');
		} catch (e) { failure = true; message = `${e instanceof Error ? e.message : 'Translation failed.'}${filled ? ` ${filled} translated fields are still available for review.` : ''}`; }
		finally { busy = false; onbusy?.(false); }
	}
</script>

<fieldset disabled={busy} class="mb-6 border-b border-forest-700/20 pb-5">
	<legend class="adm-label">Automatic translation</legend>
	<p class="adm-help">DeepL fills empty fields only. Nothing is saved until you click Save.</p>
	<div class="mt-3 flex flex-wrap items-end gap-3">
		<label class="adm-label" for="{uid}-source">From
			<select id="{uid}-source" bind:value={source} class="adm-input"><option value="en">English</option><option value="id">Indonesia</option></select>
		</label>
		<label class="adm-label" for="{uid}-target">To
			<select id="{uid}-target" bind:value={target} class="adm-input"><option value="all">All other languages</option>{#each languages.filter((l) => l.code !== source) as l (l.code)}<option value={l.code}>{l.label}</option>{/each}</select>
		</label>
		<button type="button" class="adm-btn-ghost" onclick={translate}>{busy ? 'Translating…' : 'Translate empty fields'}</button>
	</div>
</fieldset>
{#if message}<p class="mb-5 {failure ? 'adm-error' : 'adm-help'}" role={failure ? 'alert' : 'status'}>{message}</p>{/if}
