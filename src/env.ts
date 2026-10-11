import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_PATH: { schema: (value) => value || 'data/nutric.db' },
	UPLOAD_DIR: { schema: (value) => value || 'data/uploads' },
	NEWSLETTER_ENABLED: { schema: (value) => value === 'true' },
	LOGIN_MAX_ATTEMPTS: { schema: (value) => Math.max(1, Number(value) || 5) }
});
