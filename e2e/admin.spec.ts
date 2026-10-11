import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('admin redirects to login when signed out', async ({ page }) => {
	await page.goto('/admin/products');
	await expect(page).toHaveURL(/\/admin\/login$/);
});

test('wrong password shows an error and stays on login', async ({ page }) => {
	await page.goto('/admin/login');
	await page.getByLabel('Email').fill(ADMIN.email);
	await page.getByLabel('Password').fill('wrong-password-000');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByRole('alert')).toContainText('incorrect');
});

test('admin creates a news item that appears on the site, then deletes it', async ({ page }) => {
	await login(page);
	const title = `E2E event ${Date.now()}`;
	await page.goto('/admin/news/new');
	await page.getByLabel('Status').selectOption('published');
	await page.locator('[id="t.en.title"]').fill(title);
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page).toHaveURL(/\/admin\/news\?saved=1/);
	await page.goto('/en/news');
	await expect(page.getByText(title).first()).toBeVisible();

	await page.goto('/admin/news');
	await page.getByRole('row', { name: new RegExp(title) }).getByRole('button', { name: 'Delete' }).click();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
	await page.getByRole('row', { name: new RegExp(title) }).getByRole('button', { name: 'Delete' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
	await page.goto('/en/news');
	await expect(page.getByText(title)).toHaveCount(0);
});

test('empty English title is refused and typed values are kept', async ({ page }) => {
	await login(page);
	await page.goto('/admin/news/new');
	await page.getByRole('tab', { name: /Bahasa Malaysia/ }).click();
	await page.locator('[id="t.ms.title"]').fill('Tajuk sahaja');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('alert').first()).toBeVisible();
	await page.getByRole('tab', { name: /Bahasa Malaysia/ }).click();
	await expect(page.locator('[id="t.ms.title"]')).toHaveValue('Tajuk sahaja');
});

test('reordering sections changes the landing page', async ({ page }) => {
	await login(page);
	await page.goto('/admin/sections');
	for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Move Latest news up' }).click();
	await page.getByRole('button', { name: 'Save order' }).click();
	await page.goto('/en');
	const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
	expect(ids[0]).toBe('news');
	// restore
	await page.goto('/admin/sections');
	for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Move Latest news down' }).click();
	await page.getByRole('button', { name: 'Save order' }).click();
	await page.goto('/en');
	const restored = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
	expect(restored[0]).toBe('hero');
});
