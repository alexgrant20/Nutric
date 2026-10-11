import { expect, test } from '@playwright/test';
import { LANGS, collectConsoleErrors } from './helpers';

const HTML_LANG: Record<string, string> = { en: 'en', ms: 'ms', id: 'id', zh: 'zh-CN', 'zh-tw': 'zh-TW', th: 'th' };

for (const lang of LANGS) {
	test(`landing renders in ${lang}`, async ({ page }) => {
		const errors = collectConsoleErrors(page);
		await page.goto(`/${lang}`);
		await expect(page.locator('html')).toHaveAttribute('lang', HTML_LANG[lang]);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.locator('footer')).toBeVisible();
		expect(errors).toEqual([]);
	});

	test(`every nav link in ${lang} reaches a real page`, async ({ page, request }) => {
		await page.goto(`/${lang}`);
		const hrefs = await page.locator('header nav a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!));
		expect(hrefs.length).toBeGreaterThan(0);
		for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
	});
}

test('unsupported language redirects to English keeping the path', async ({ page }) => {
	await page.goto('/xx/products');
	await expect(page).toHaveURL(/\/en\/products$/);
});

test('language-less path redirects by Accept-Language', async ({ browser }) => {
	const ctx = await browser.newContext({ locale: 'zh-TW', extraHTTPHeaders: { 'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8' } });
	const page = await ctx.newPage();
	await page.goto('/');
	await expect(page).toHaveURL(/\/zh-tw$/);
	await ctx.close();
});

test('an unknown path under a language is a 404, not a redirect loop', async ({ request }) => {
	const res = await request.get('/en/zzz', { maxRedirects: 0 });
	expect(res.status()).toBe(404);
});

test('unknown slug shows the translated 404 page', async ({ page }) => {
	const res = await page.goto('/ms/products/does-not-exist');
	expect(res?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'Halaman tidak ditemui' })).toBeVisible();
});

test('detail pages load', async ({ page }) => {
	await page.goto('/en/products');
	await page.locator('main a[href*="/en/products/"]').first().click();
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await page.goto('/en/news');
	await page.locator('main a[href*="/en/news/"]').first().click();
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('newsletter accepts an address, then reports a duplicate', async ({ page }) => {
	await page.goto('/en#newsletter');
	const email = `visitor-${Date.now()}@example.com`;
	await page.getByLabel('Email address').fill(email);
	await page.getByRole('button', { name: 'Subscribe to event updates' }).click();
	await expect(page.getByText('Thank you. You are subscribed.')).toBeVisible();
	await page.getByLabel('Email address').fill(email.toUpperCase());
	await page.getByRole('button', { name: 'Subscribe to event updates' }).click();
	await expect(page.getByText('This address is already subscribed.')).toBeVisible();
	await page.getByLabel('Email address').fill('not-an-email');
	await page.getByRole('button', { name: 'Subscribe to event updates' }).click();
	await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});

test('terms page loads and the footer links to it', async ({ page }) => {
	await page.goto('/en');
	await page.getByRole('link', { name: 'Terms of use and privacy' }).click();
	await expect(page).toHaveURL(/\/en\/terms$/);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('uploads route blocks path traversal', async ({ request }) => {
	for (const p of ['/uploads/../package.json', '/uploads/%2e%2e/package.json', '/uploads/..%2fpackage.json']) {
		expect([400, 404], p).toContain((await request.get(p)).status());
	}
});
