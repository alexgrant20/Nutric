<script lang="ts">
	let { name, label, value, multiple = false, error, help }: {
		name: string; label: string; value: string | string[] | null; multiple?: boolean; error?: string; help?: string;
	} = $props();
	let kept = $state<string[]>(Array.isArray(value) ? [...value] : value ? [value] : []);
</script>

<fieldset class="space-y-2">
	<legend class="text-sm font-medium">{label}</legend>
	{#if help}<p class="text-sm text-stone-600">{help}</p>{/if}
	<ul class="flex flex-wrap gap-3">
		{#each kept as src (src)}
			<li class="w-28">
				<img {src} alt="" class="aspect-square w-full rounded-sm bg-white object-contain" />
				<input type="hidden" name="f.{name}" value={src} />
				<button type="button" class="mt-1 min-h-11 w-full text-sm underline" onclick={() => (kept = kept.filter((k) => k !== src))}>Remove</button>
			</li>
		{/each}
	</ul>
	<input type="file" name="file.{name}" aria-label={label} accept="image/jpeg,image/png,image/webp" {multiple} class="block text-sm" aria-describedby={error ? `${name}-err` : undefined} />
	<p class="text-xs text-stone-600">JPG, PNG or WebP, up to 5 MB.</p>
	{#if error}<p id="{name}-err" role="alert" class="text-sm text-red-800">{error}</p>{/if}
</fieldset>
