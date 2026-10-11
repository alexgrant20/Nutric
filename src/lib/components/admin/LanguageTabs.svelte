<script lang="ts">
	import type { Snippet } from 'svelte';
	let { languages, complete, children, active = $bindable('en') }: {
		languages: { code: string; label: string }[]; complete: Record<string, boolean>; children: Snippet<[string]>; active?: string;
	} = $props();
</script>

<div>
	<div role="tablist" aria-label="Language" class="flex flex-wrap gap-1 border-b border-forest-700/30">
		{#each languages as l (l.code)}
			<button type="button" role="tab" id="tab-{l.code}" aria-selected={active === l.code} aria-controls="panel-{l.code}" onclick={() => (active = l.code)}
				class="flex min-h-11 items-center gap-2 rounded-t-sm px-4 text-sm {active === l.code ? 'bg-forest-700 text-cream-100' : 'hover:bg-forest-700/10'}">
				<span aria-hidden="true" class="size-2 rounded-full {complete[l.code] ? 'bg-lime-400 ring-1 ring-forest-900' : 'ring-1 ring-current'}"></span>
				{l.label}
				<span class="sr-only">{complete[l.code] ? '(complete)' : '(missing)'}</span>
			</button>
		{/each}
	</div>
	{#each languages as l (l.code)}
		<div role="tabpanel" id="panel-{l.code}" aria-labelledby="tab-{l.code}" hidden={active !== l.code} class="space-y-5 pt-6">
			{@render children(l.code)}
		</div>
	{/each}
</div>
