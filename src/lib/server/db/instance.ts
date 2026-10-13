import { DATABASE_PATH } from '$app/env/private';
import { createDb } from './index';
import { ensureSections } from '../sections';

export const db = createDb(DATABASE_PATH);
// Landing sections without a row stay hidden, so new section keys get their row at startup.
ensureSections(db);
