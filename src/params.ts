import { defineParams } from '@sveltejs/kit/params';
import { isLang } from './lib/i18n/config.ts';

const ENTITIES = ['products', 'collections', 'news', 'testimonials', 'accolades'];

export const params = defineParams({
	lang: (param) => (isLang(param) ? param : undefined),
	entity: (param) => (ENTITIES.includes(param) ? param : undefined)
});
