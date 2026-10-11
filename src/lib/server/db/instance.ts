import { DATABASE_PATH } from '$app/env/private';
import { createDb } from './index';

export const db = createDb(DATABASE_PATH);
