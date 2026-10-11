import { expect, test } from '@playwright/test';

test('skip link is the first focus stop and every focused element shows a visible indicator', async ({ page }) => {
	await page.goto('/en');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
	for (let i = 0; i < 12; i++) {
		await page.keyboard.press('Tab');
		const outline = await page.evaluate(() => {
			const el = document.activeElement as HTMLElement;
			const cs = getComputedStyle(el);
			return { w: parseFloat(cs.outlineWidth), style: cs.outlineStyle, tag: el.tagName };
		});
		expect(outline.style !== 'none' && outline.w >= 2, JSON.stringify(outline)).toBe(true);
	}
});

test('mobile menu opens and Escape closes it', async ({ page }) => {
	await page.setViewportSize({ width: 360, height: 800 });
	await page.goto('/en');
	await page.getByRole('button', { name: 'Open menu' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('reduced motion removes entrance transforms and pauses the hero video', async ({ browser }) => {
	const ctx = await browser.newContext({ reducedMotion: 'reduce' });
	const page = await ctx.newPage();
	await page.goto('/en');
	const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-media')!).animationName);
	expect(anim).toBe('none');
	const paused = await page.evaluate(() => document.querySelector('video')?.paused ?? true);
	expect(paused).toBe(true);
	await ctx.close();
});
