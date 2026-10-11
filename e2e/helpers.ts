import type { Page } from '@playwright/test';

export const LANGS = ['en', 'ms', 'id', 'zh', 'zh-tw', 'th'] as const;
export const ADMIN = { email: 'e2e@example.com', password: 'e2e-password-123456' };

export async function login(page: Page) {
	await page.goto('/admin/login');
	await page.getByLabel('Email').fill(ADMIN.email);
	await page.getByLabel('Password').fill(ADMIN.password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL('/admin');
}

export function collectConsoleErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	page.on('console', (m) => { if (m.type() === 'error' && !/youtube|ytimg|favicon/i.test(m.text())) errors.push(m.text()); });
	return errors;
}
