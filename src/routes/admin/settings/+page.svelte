<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import LanguageTabs from '$lib/components/admin/LanguageTabs.svelte';
	import TranslateControls from '$lib/components/admin/TranslateControls.svelte';
	import Toast from '$lib/components/admin/Toast.svelte';
	import { COLOR_KEYS } from '$lib/theme/tokens';

	let { data, form } = $props();
	const errors = $derived(form?.errors ?? {});
	const b = $derived(data.base);
	let busy = $state(false);
	let translating = $state(false);
	const trFields: [string, string, boolean][] = [
		['tagline', 'Tagline', false], ['headlineLine1', 'Hero headline, left part', false], ['headlineLine2', 'Hero headline, right part', false],
		['subheadline', 'Hero subheadline', true], ['ctaLabel', 'Hero button label (leave empty for the default)', false],
		['heroBadgeText', 'Hero badge text (leave empty for no badge; only enter a claim you can document)', false],
		['aboutTeaserMd', 'About teaser (Markdown)', true], ['aboutMd', 'About page (Markdown)', true], ['termsMd', 'Terms and privacy page (Markdown)', true], ['aboutImageAlt', 'About image description', false], ['footerNote', 'Footer note', true]
	];
	const tv: Record<string, Record<string, string>> = $state(Object.fromEntries(data.languages.map((l: any) => [l.code,
		Object.fromEntries(trFields.map(([name]) => [name, String((data.trs[l.code] as Record<string, unknown> | undefined)?.[name] ?? '')]))
	])));
	const complete = $derived(Object.fromEntries(data.languages.map((l: any) => [l.code, Object.values(tv[l.code]).some((value) => value.trim())])));
	// Colour tokens read as plain words, not code names.
	const colorLabel = (k: string) => k.replace(/([a-z])([0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
</script>

<svelte:head><title>Settings | Admin</title></svelte:head>
{#if form?.saved}<Toast message="Settings saved." />{/if}

<header class="adm-head max-w-5xl">
	<div>
		<h1 class="adm-title">Settings</h1>
		<p class="adm-sub">Brand, contact details, the hero, the colour theme and the page texts in every language.</p>
	</div>
</header>

<form method="post" action="?/save" enctype="multipart/form-data" use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }} class="max-w-5xl">
	{#if Object.keys(errors).length}<div role="alert" class="adm-alert mb-2">Please fix the highlighted fields.</div>{/if}

	<section class="adm-section" aria-labelledby="s-brand">
		<div><h2 id="s-brand" class="adm-section-title">Brand</h2><p class="adm-help">The name in the header and page titles, and the logo.</p></div>
		<div class="max-w-xl space-y-5">
			<div><label for="brandName" class="adm-label">Brand name *</label><input id="brandName" name="f.brandName" value={b?.brandName ?? ''} class="adm-input" />{#if errors['f.brandName']}<p role="alert" class="adm-error">{errors['f.brandName']}</p>{/if}</div>
			<ImageField name="logoImage" label="Logo" value={b?.logoImage ?? null} error={errors['f.logoImage']} />
		</div>
	</section>

	<section class="adm-section" aria-labelledby="s-contact">
		<div><h2 id="s-contact" class="adm-section-title">Contact and social</h2><p class="adm-help">The contact buttons use WhatsApp first, then email, then phone. None are shown if all are empty.</p></div>
		<div class="max-w-xl space-y-5">
			<div><label for="contactEmail" class="adm-label">Contact email</label><input id="contactEmail" name="f.contactEmail" value={b?.contactEmail ?? ''} class="adm-input" placeholder="email@example.com" />{#if errors['f.contactEmail']}<p role="alert" class="adm-error">{errors['f.contactEmail']}</p>{/if}</div>
			<div><label for="contactPhone" class="adm-label">Contact phone</label><input id="contactPhone" name="f.contactPhone" value={b?.contactPhone ?? ''} class="adm-input" placeholder="+60 ..." /></div>
			<div><label for="whatsappUrl" class="adm-label">WhatsApp link</label><input id="whatsappUrl" name="f.whatsappUrl" value={b?.whatsappUrl ?? ''} class="adm-input" placeholder="https://wa.me/..." />{#if errors['f.whatsappUrl']}<p role="alert" class="adm-error">{errors['f.whatsappUrl']}</p>{/if}</div>
			<div><label for="socialLinks" class="adm-label">Social links</label><textarea id="socialLinks" name="f.socialLinks" rows="4" class="adm-input font-mono text-sm" placeholder="platform|https://link">{b?.socialLinks ?? ''}</textarea><p class="adm-help">One per line: platform|https://link</p></div>
		</div>
	</section>

	<section class="adm-section" aria-labelledby="s-hero">
		<div><h2 id="s-hero" class="adm-section-title">Hero media</h2><p class="adm-help">What fills the top of the landing page.</p></div>
		<div class="max-w-xl space-y-5">
			<ImageField name="heroMedia" label="Hero image or video (image: JPG, PNG, WebP)" value={b?.heroMedia ?? null} error={errors['f.heroMedia']} />
			<div><label for="heroMediaType" class="adm-label">Hero media type</label>
				<select id="heroMediaType" name="f.heroMediaType" class="adm-input"><option value="image" selected={b?.heroMediaType === 'image'}>Image</option><option value="video" selected={b?.heroMediaType === 'video'}>Video (keep the existing video file)</option></select></div>
			<ImageField name="heroProductImage" label="Hero product image (overrides the best seller image)" value={b?.heroProductImage ?? null} error={errors['f.heroProductImage']} />
		</div>
	</section>

	<section class="adm-section" aria-labelledby="s-theme">
		<div><h2 id="s-theme" class="adm-section-title">Theme</h2><p class="adm-help">Saving is refused if any text and background pair falls below its contrast requirement.</p></div>
		<div class="max-w-2xl">
			<div class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
				{#each COLOR_KEYS as k (k)}
					<div><label for="c-{k}" class="adm-label">{colorLabel(k)}</label>
						<input id="c-{k}" name="theme.{k}" type="color" value={data.theme.colors[k]} class="adm-input h-11 cursor-pointer p-1" /></div>
				{/each}
				<div><label for="fs" class="adm-label">Interface font</label><select id="fs" name="theme.fontSans" class="adm-input">{#each ['Poppins', 'Fraunces'] as f (f)}<option selected={data.theme.fonts.sans === f}>{f}</option>{/each}</select></div>
				<div><label for="fr" class="adm-label">Product-name font</label><select id="fr" name="theme.fontSerif" class="adm-input">{#each ['Poppins', 'Fraunces'] as f (f)}<option selected={data.theme.fonts.serif === f}>{f}</option>{/each}</select></div>
				<div><label for="rs" class="adm-label">Small radius (px)</label><input id="rs" name="theme.radiusSm" type="number" min="0" max="16" value={data.theme.radius.sm} class="adm-input" /></div>
				<div><label for="rm" class="adm-label">Medium radius (px)</label><input id="rm" name="theme.radiusMd" type="number" min="0" max="32" value={data.theme.radius.md} class="adm-input" /></div>
			</div>
			{#if errors.theme}<p role="alert" class="adm-error">{errors.theme}</p>{/if}
		</div>
	</section>

	<section class="adm-section" aria-labelledby="s-texts">
		<div><h2 id="s-texts" class="adm-section-title">Texts by language</h2><p class="adm-help">Hero lines, the About page, Terms and the footer note. A language left empty shows the English text.</p></div>
		<div class="min-w-0">
			<TranslateControls values={tv} fields={trFields.map(([name]) => name)} languages={data.languages} onbusy={(value) => translating = value}
				onfields={(language, translated) => Object.assign(tv[language], translated)} />
			<LanguageTabs languages={data.languages} {complete}>
				{#snippet children(code)}
					{#each trFields as [name, label, long] (name)}
						<div><label for="t-{code}-{name}" class="adm-label">{label}</label>
							{#if long}<textarea id="t-{code}-{name}" name="t.{code}.{name}" rows="4" class="adm-input" bind:value={tv[code][name]}></textarea>
							{:else}<input id="t-{code}-{name}" name="t.{code}.{name}" bind:value={tv[code][name]} class="adm-input" />{/if}</div>
					{/each}
				{/snippet}
			</LanguageTabs>
		</div>
	</section>

	<div class="adm-savebar"><button disabled={busy || translating} class="adm-btn">{busy ? 'Saving' : 'Save settings'}</button></div>
</form>
