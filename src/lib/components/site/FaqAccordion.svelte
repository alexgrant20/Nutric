<script lang="ts">
	import { useT } from '$lib/i18n/context';
	let { items }: { items: { q: string; a: string }[] } = $props();
	const t = useT();
	// One answer open at a time: the list stays short and the eye follows a single movement.
	let open = $state<number | null>(0);
	const num = (i: number) => String(i + 1).padStart(2, '0');
	const uid = $props.id();

	function key(e: KeyboardEvent, i: number) {
		const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null;
		if (to == null) return;
		e.preventDefault();
		document.getElementById(`${uid}-q-${(to + items.length) % items.length}`)?.focus();
	}
</script>

<ol class="faq border-t border-cream-100/25" aria-label={t('products.faqs')}>
	{#each items as f, i (i)}
		{@const isOpen = open === i}
		<li class="faq-item border-b border-cream-100/25" class:is-open={isOpen}>
			<h3>
				<button type="button" id="{uid}-q-{i}" aria-expanded={isOpen} aria-controls="{uid}-a-{i}"
					onclick={() => (open = isOpen ? null : i)} onkeydown={(e) => key(e, i)}
					class="faq-q flex min-h-16 w-full items-center gap-4 py-5 text-left sm:gap-6">
					<span class="w-8 shrink-0 font-serif text-lg tabular-nums text-cream-100/60 sm:w-10 sm:text-xl">{num(i)}</span>
					<span class="flex-1 font-serif text-lg leading-snug sm:text-2xl">{f.q}</span>
					<span class="faq-icon relative size-9 shrink-0 rounded-full border border-cream-100/40" aria-hidden="true">
						<span class="absolute left-1/2 top-1/2 h-0.5 w-3.5 -translate-x-1/2 -translate-y-1/2 bg-current"></span>
						<span class="faq-bar absolute left-1/2 top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-current"></span>
					</span>
				</button>
			</h3>
			<div id="{uid}-a-{i}" role="region" aria-labelledby="{uid}-q-{i}" class="faq-panel" inert={!isOpen}>
				<div class="faq-clip">
					<p class="faq-a max-w-prose pb-7 pl-12 pr-2 text-cream-100/90 sm:pl-16">{f.a}</p>
				</div>
			</div>
		</li>
	{/each}
</ol>

<style>
	/* The panel grows from 0 to its natural height: no measured pixel values, so any answer length works. */
	.faq-panel {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.is-open .faq-panel {
		grid-template-rows: 1fr;
	}
	.faq-clip {
		overflow: hidden;
		min-height: 0;
	}
	.faq-a {
		opacity: 0;
		transform: translateY(-0.5rem);
		transition: opacity 0.3s ease, transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.is-open .faq-a {
		opacity: 1;
		transform: none;
		transition-delay: 0.1s;
	}
	.faq-icon {
		transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1), background-color 0.25s ease, color 0.25s ease;
	}
	.faq-bar {
		transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	/* The vertical bar folds flat, so + becomes −, while the whole mark turns. */
	.is-open .faq-icon {
		transform: rotate(180deg);
		background: var(--lime-400);
		color: var(--forest-900);
		border-color: var(--lime-400);
	}
	.is-open .faq-bar {
		transform: translate(-50%, -50%) scaleY(0);
	}
	.faq-q:hover .faq-icon {
		border-color: var(--cream-100);
	}
	@media (prefers-reduced-motion: reduce) {
		.faq-panel,
		.faq-a,
		.faq-icon,
		.faq-bar {
			transition: none;
		}
	}
</style>
