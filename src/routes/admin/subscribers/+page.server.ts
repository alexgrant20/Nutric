import { desc } from 'drizzle-orm';
import { db } from '$lib/server/db/instance';
import * as s from '$lib/server/db/schema';

export const load = () => ({ rows: db.select().from(s.subscribers).orderBy(desc(s.subscribers.id)).limit(500).all() });
