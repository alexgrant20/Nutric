import { expect, test } from '@playwright/test';
import { LANGS } from './helpers';

const ROUTES = ['', '/products', '/news', '/about', '/accolades', '/testimonials'];
const WIDTHS = [360, 768, 1280];

for (const lang of LANGS) {
	for (const width of WIDTHS) {
		test(`no horizontal overflow: ${lang} at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			for (const r of ROUTES) {
				await page.goto(`/${lang}${r}`);
				const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
				expect(over, `${lang}${r} @${width}`).toBeLessThanOrEqual(0);
			}
		});
	}
}
