import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { login } from './helpers';

// Sections fade in on scroll; audit them in their final visible state so axe does not measure mid-fade opacity.
const SHOW_ALL = '.reveal { opacity: 1 !important; transform: none !important; transition: none !important; }';

const PUBLIC = ['/en', '/en/products', '/en/news', '/en/about', '/en/accolades', '/zh/news', '/th/products'];

for (const path of PUBLIC) {
	test(`no serious axe violations on ${path}`, async ({ page }) => {
		await page.goto(path);
		await page.addStyleTag({ content: SHOW_ALL });
		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
		const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(bad.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
	});
}

test('product detail, news detail and admin have no serious axe violations', async ({ page }) => {
	const check = async (path: string) => {
		await page.goto(path);
		await page.addStyleTag({ content: SHOW_ALL });
		const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
		expect(r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${path} ${v.id}`)).toEqual([]);
	};
	await page.goto('/en/products');
	await check(await page.locator('main a[href*="/en/products/"]').first().getAttribute('href') as string);
	await page.goto('/en/news');
	await check(await page.locator('main a[href*="/en/news/"]').first().getAttribute('href') as string);
	await login(page);
	await check('/admin/products');
	await check('/admin/products/new');
	await check('/admin/settings');
});
