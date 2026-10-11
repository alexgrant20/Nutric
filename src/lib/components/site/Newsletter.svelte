<script lang="ts">
	import { page } from '$app/state';
	import { useT } from '$lib/i18n/context';
	import type { Lang } from '$lib/i18n/config';

	let { lang, enabled }: { lang: Lang; enabled: boolean } = $props();
	const t = useT();
	type Status = 'idle' | 'sending' | 'ok' | 'invalid' | 'duplicate' | 'failed';
	const fromUrl = page.url.searchParams.get('newsletter');
	let status: Status = $state((['ok', 'invalid', 'duplicate', 'failed'] as string[]).includes(fromUrl ?? '') ? (fromUrl as Status) : 'idle');
	const messages: Record<string, 'newsletter.success' | 'newsletter.invalid' | 'newsletter.duplicate' | 'newsletter.failed'> = {
		ok: 'newsletter.success', invalid: 'newsletter.invalid', duplicate: 'newsletter.duplicate', failed: 'newsletter.failed'
	};

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		status = 'sending';
		try {
			const res = await fetch('/api/subscribe', { method: 'POST', body: new FormData(e.currentTarget as HTMLFormElement), headers: { accept: 'application/json' } });
			status = ((await res.json()).status as Status) ?? 'failed';
		} catch {
			status = 'failed';
		}
	}
</script>

<section id="newsletter" class="on-dark bg-forest-900 py-16 text-cream-100">
	<div class="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_28rem] lg:items-end">
		<h2 class="font-serif text-3xl sm:text-4xl">{t('newsletter.title')}</h2>
		{#if enabled}
			<form method="post" action="/api/subscribe" onsubmit={submit} novalidate>
				<input type="hidden" name="lang" value={lang} />
				<label for="nl-email" class="text-sm">{t('newsletter.label')}</label>
				<div class="mt-2 flex flex-col gap-3 sm:flex-row">
					<input id="nl-email" name="email" type="email" required autocomplete="email" placeholder={t('newsletter.placeholder')}
						aria-describedby="nl-msg" aria-invalid={status === 'invalid' || status === 'duplicate' ? 'true' : undefined}
						class="min-h-12 w-full rounded-sm border border-cream-100/40 bg-forest-700 px-3 text-cream-100 placeholder:text-cream-100/60" />
					<button disabled={status === 'sending'} class="min-h-12 rounded-sm bg-cream-100 px-5 font-medium text-forest-900 disabled:opacity-60">
						{status === 'sending' ? t('newsletter.sending') : t('newsletter.submit')}
					</button>
				</div>
				<p id="nl-msg" role={status === 'ok' ? 'status' : 'alert'} class="mt-2 min-h-6 text-sm">
					{#if messages[status]}{t(messages[status])}{/if}
				</p>
			</form>
		{:else}
			<p class="text-cream-100/80">{t('newsletter.unavailable')}</p>
		{/if}
	</div>
</section>
