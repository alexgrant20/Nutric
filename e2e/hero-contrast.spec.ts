import { expect, test } from '@playwright/test';
import { LANGS } from './helpers';

function lum(r: number, g: number, b: number) {
	const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

for (const lang of LANGS) {
	test(`hero text keeps contrast over the photo (${lang})`, async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto(`/${lang}`);
		await page.waitForTimeout(1500);
		const h1 = page.locator('h1').first();
		const box = (await h1.boundingBox())!;
		await h1.evaluate((el) => ((el as HTMLElement).style.visibility = 'hidden'));
		const vp = page.viewportSize()!;
		const clip = {
			x: Math.max(0, box.x), y: Math.max(0, box.y),
			width: Math.max(1, Math.min(box.width, vp.width - Math.max(0, box.x))),
			height: Math.max(1, Math.min(box.height, vp.height - Math.max(0, box.y)))
		};
		const shot = await page.screenshot({ clip });
		await h1.evaluate((el) => ((el as HTMLElement).style.visibility = 'visible'));
		const png = await page.evaluate(async (b64) => {
			const img = new Image();
			img.src = 'data:image/png;base64,' + b64;
			await img.decode();
			const c = document.createElement('canvas');
			c.width = img.width; c.height = img.height;
			const ctx = c.getContext('2d')!;
			ctx.drawImage(img, 0, 0);
			const d = ctx.getImageData(0, 0, c.width, c.height).data;
			let lightest = 0;
			for (let i = 0; i < d.length; i += 4 * 17) lightest = Math.max(lightest, 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
			return lightest;
		}, shot.toString('base64'));
		// Text is cream (#F4F1E8, luminance about 0.88). The lightest background pixel under it must keep 3:1 (large text).
		const bg = lum(png, png, png);
		expect((0.88 + 0.05) / (bg + 0.05)).toBeGreaterThanOrEqual(3);
	});
}
