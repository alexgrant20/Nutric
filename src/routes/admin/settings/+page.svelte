<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import LanguageTabs from '$lib/components/admin/LanguageTabs.svelte';
	import Toast from '$lib/components/admin/Toast.svelte';
	import { COLOR_KEYS } from '$lib/theme/tokens';

	let { data, form } = $props();
	const errors = $derived(form?.errors ?? {});
	const b = $derived(data.base);
	const input = 'mt-1 w-full rounded-sm border border-stone-600 bg-white px-3 py-2';
	const trFields: [string, string, boolean][] = [
		['tagline', 'Tagline', false], ['headlineLine1', 'Hero headline, left part', false], ['headlineLine2', 'Hero headline, right part', false],
		['subheadline', 'Hero subheadline', true], ['ctaLabel', 'Hero button label (leave empty for the default)', false],
		['heroBadgeText', 'Hero badge text (leave empty for no badge; only enter a claim you can document)', false],
		['aboutTeaserMd', 'About teaser (Markdown)', true], ['aboutMd', 'About page (Markdown)', true], ['termsMd', 'Terms and privacy page (Markdown)', true], ['aboutImageAlt', 'About image description', false], ['footerNote', 'Footer note', true]
	];
	const complete = $derived(Object.fromEntries(data.languages.map((l: any) => [l.code, !!data.trs[l.code]])));
</script>

<svelte:head><title>Settings | Admin</title></svelte:head>
{#if form?.saved}<Toast message="Settings saved." />{/if}
<h1 class="font-serif text-3xl text-forest-700">Settings</h1>

<form method="post" action="?/save" enctype="multipart/form-data" use:enhance={() => async ({ update }) => update({ reset: false })} class="mt-6 max-w-3xl space-y-8">
	{#if Object.keys(errors).length}<div role="alert" class="rounded-sm border border-red-800 bg-red-50 p-3 text-sm text-red-900">Please fix the highlighted fields.</div>{/if}

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Brand</legend>
		<div><label for="brandName" class="text-sm font-medium">Brand name *</label><input id="brandName" name="f.brandName" value={b?.brandName ?? ''} class={input} />{#if errors['f.brandName']}<p role="alert" class="text-sm text-red-800">{errors['f.brandName']}</p>{/if}</div>
		<ImageField name="logoImage" label="Logo" value={b?.logoImage ?? null} error={errors['f.logoImage']} />
	</fieldset>

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Contact and social</legend>
		<div><label for="contactEmail" class="text-sm font-medium">Contact email</label><input id="contactEmail" name="f.contactEmail" value={b?.contactEmail ?? ''} class={input} />{#if errors['f.contactEmail']}<p role="alert" class="text-sm text-red-800">{errors['f.contactEmail']}</p>{/if}</div>
		<div><label for="contactPhone" class="text-sm font-medium">Contact phone</label><input id="contactPhone" name="f.contactPhone" value={b?.contactPhone ?? ''} class={input} /></div>
		<div><label for="whatsappUrl" class="text-sm font-medium">WhatsApp link</label><input id="whatsappUrl" name="f.whatsappUrl" value={b?.whatsappUrl ?? ''} class={input} />{#if errors['f.whatsappUrl']}<p role="alert" class="text-sm text-red-800">{errors['f.whatsappUrl']}</p>{/if}<p class="mt-1 text-xs text-stone-600">The contact buttons use WhatsApp first, then email, then phone. None are shown if all are empty.</p></div>
		<div><label for="socialLinks" class="text-sm font-medium">Social links (one per line: platform|https://link)</label><textarea id="socialLinks" name="f.socialLinks" rows="4" class={input}>{b?.socialLinks ?? ''}</textarea></div>
	</fieldset>

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Hero media</legend>
		<ImageField name="heroMedia" label="Hero image or video (image: JPG, PNG, WebP)" value={b?.heroMedia ?? null} error={errors['f.heroMedia']} />
		<div><label for="heroMediaType" class="text-sm font-medium">Hero media type</label>
			<select id="heroMediaType" name="f.heroMediaType" class={input}><option value="image" selected={b?.heroMediaType === 'image'}>Image</option><option value="video" selected={b?.heroMediaType === 'video'}>Video (keep the existing video file)</option></select></div>
		<ImageField name="heroProductImage" label="Hero product image (overrides the best seller image)" value={b?.heroProductImage ?? null} error={errors['f.heroProductImage']} />
	</fieldset>

	<fieldset class="space-y-4"><legend class="text-xl font-semibold">Theme</legend>
		<p class="text-sm text-stone-600">Saving is refused if any text/background pair falls below its contrast requirement.</p>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each COLOR_KEYS as k (k)}
				<div><label for="c-{k}" class="text-sm font-medium">{k}</label>
					<input id="c-{k}" name="theme.{k}" type="color" value={data.theme.colors[k]} class="mt-1 h-11 w-full rounded-sm border border-stone-600" /></div>
			{/each}
			<div><label for="fs" class="text-sm font-medium">Interface font</label><select id="fs" name="theme.fontSans" class={input}>{#each ['Poppins', 'Fraunces'] as f (f)}<option selected={data.theme.fonts.sans === f}>{f}</option>{/each}</select></div>
			<div><label for="fr" class="text-sm font-medium">Product-name font</label><select id="fr" name="theme.fontSerif" class={input}>{#each ['Poppins', 'Fraunces'] as f (f)}<option selected={data.theme.fonts.serif === f}>{f}</option>{/each}</select></div>
			<div><label for="rs" class="text-sm font-medium">Small radius (px)</label><input id="rs" name="theme.radiusSm" type="number" min="0" max="16" value={data.theme.radius.sm} class={input} /></div>
			<div><label for="rm" class="text-sm font-medium">Medium radius (px)</label><input id="rm" name="theme.radiusMd" type="number" min="0" max="32" value={data.theme.radius.md} class={input} /></div>
		</div>
		{#if errors.theme}<p role="alert" class="text-sm text-red-800">{errors.theme}</p>{/if}
	</fieldset>

	<fieldset><legend class="mb-3 text-xl font-semibold">Texts by language</legend>
		<LanguageTabs languages={data.languages} {complete}>
			{#snippet children(code)}
				{#each trFields as [name, label, long] (name)}
					<div><label for="t-{code}-{name}" class="text-sm font-medium">{label}</label>
						{#if long}<textarea id="t-{code}-{name}" name="t.{code}.{name}" rows="4" class={input}>{data.trs[code]?.[name] ?? ''}</textarea>
						{:else}<input id="t-{code}-{name}" name="t.{code}.{name}" value={data.trs[code]?.[name] ?? ''} class={input} />{/if}</div>
				{/each}
			{/snippet}
		</LanguageTabs>
	</fieldset>

	<button class="min-h-12 rounded-sm bg-forest-700 px-6 text-cream-100">Save settings</button>
</form>
