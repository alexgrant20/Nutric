<script lang="ts">
	let { name, label, value, multiple = false, error, help }: {
		name: string; label: string; value: string | string[] | null; multiple?: boolean; error?: string; help?: string;
	} = $props();
	let kept = $state<string[]>(Array.isArray(value) ? [...value] : value ? [value] : []);
	let picked = $state('');
</script>

<fieldset>
	<legend class="adm-label">{label}</legend>
	{#if help}<p class="adm-help">{help}</p>{/if}
	{#if kept.length}
		<ul class="mt-3 flex flex-wrap gap-3">
			{#each kept as src (src)}
				<li class="w-32">
					<span class="grid aspect-square place-items-center overflow-hidden rounded-sm border border-forest-700/20 bg-white"><img {src} alt="" class="size-full object-contain p-1" /></span>
					<input type="hidden" name="f.{name}" value={src} />
					<button type="button" class="adm-link-danger mt-1 w-full" onclick={() => (kept = kept.filter((k) => k !== src))}>Remove</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="adm-help">No image yet.</p>
	{/if}
	<label class="mt-3 flex min-h-12 cursor-pointer items-center gap-3 rounded-sm border border-dashed border-forest-700/50 bg-white/60 px-4 text-sm text-forest-700 hover:border-forest-700 hover:bg-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest-700">
		<span class="font-medium">{kept.length ? 'Add or replace' : 'Choose a file'}</span>
		<span class="min-w-0 flex-1 truncate text-stone-600">{picked || 'JPG, PNG or WebP, up to 5 MB'}</span>
		<input type="file" name="file.{name}" aria-label={label} accept="image/jpeg,image/png,image/webp" {multiple} class="sr-only"
			aria-describedby={error ? `${name}-err` : undefined}
			onchange={(e) => (picked = Array.from((e.currentTarget as HTMLInputElement).files ?? []).map((f) => f.name).join(', '))} />
	</label>
	{#if error}<p id="{name}-err" role="alert" class="adm-error">{error}</p>{/if}
</fieldset>
