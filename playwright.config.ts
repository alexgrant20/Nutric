import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'npm run build && npx tsx scripts/seed.ts --db data/e2e.db && node build',
		url: 'http://localhost:4173/en',
		timeout: 240_000,
		reuseExistingServer: false,
		env: {
			PORT: '4173', SITE_ORIGIN: 'http://localhost:4173',
			DATABASE_PATH: 'data/e2e.db', UPLOAD_DIR: 'data/e2e-uploads',
			ADMIN_EMAIL: 'e2e@example.com', ADMIN_PASSWORD: 'e2e-password-123456',
			NEWSLETTER_ENABLED: 'true',
			LOGIN_MAX_ATTEMPTS: '1000'
		}
	}
});
