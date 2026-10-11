import { env } from '$env/dynamic/private';
import { createDb } from './index';

export const db = createDb(env.DATABASE_PATH ?? 'data/nutric.db');
