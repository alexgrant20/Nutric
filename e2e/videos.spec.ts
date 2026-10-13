import { expect, test } from '@playwright/test';

test('video page: posters are self-hosted, nothing is requested from YouTube before play', async ({ page }) => {
	const external: string[] = [];
	page.on('request', (r) => {
		if (/youtube|ytimg|googlevideo/.test(new URL(r.url()).hostname)) external.push(r.url());
	});
	await page.goto('/en/videos');
	await expect(page.getByRole('heading', { level: 1, name: 'Videos' })).toBeVisible();
	await page.waitForTimeout(1500);
	expect(external).toEqual([]);
});

test('video page: choosing a video swaps the stage, play loads the privacy-friendly embed', async ({ page }) => {
	await page.goto('/en/videos');
	const cards = page.locator('main ol button');
	expect(await cards.count()).toBeGreaterThan(2);
	const title = (await cards.nth(2).locator('span').last().innerText()).trim();
	// Retry until the page has hydrated: a click before that has no handler yet.
	await expect(async () => {
		await cards.nth(2).click();
		await expect(page.getByRole('button', { name: `Play video: ${title}` })).toBeVisible({ timeout: 1000 });
	}).toPass({ timeout: 15_000 });
	await expect(cards.nth(2)).toHaveAttribute('aria-current', 'true');
	await page.getByRole('button', { name: `Play video: ${title}` }).click();
	await expect(page.locator('main iframe')).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?/);
});

test('landing video stage: playlist selection works with the keyboard', async ({ page }) => {
	await page.goto('/en');
	const rail = page.locator('#testimonials ol button');
	// Retry until the page has hydrated: a key press before that has no handler yet.
	await expect(async () => {
		await rail.nth(1).focus();
		await page.keyboard.press('Enter');
		await expect(rail.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 1000 });
	}).toPass({ timeout: 15_000 });
});
