import { eq } from 'drizzle-orm';
import { createDb } from '../src/lib/server/db';
import { adminUsers } from '../src/lib/server/db/schema';
import { createAdminUser } from '../src/lib/server/auth';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
function stop(message: string): never {
	console.error(message);
	process.exit(1);
}
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
	stop('ADMIN_EMAIL belum diisi atau tidak valid. Perbaiki email di .env.');
}
if (!password || password.length < 12) {
	stop(`ADMIN_PASSWORD di .env hanya ${password?.length ?? 0} karakter; minimal 12 karakter. Ganti password, simpan .env, lalu jalankan perintah ini lagi.`);
}
if (password === 'change-me-please-12') {
	stop('Ganti password contoh di .env dengan password milikmu sendiri.');
}
const db = createDb(process.env.DATABASE_PATH || 'data/nutric.db');
if (db.select().from(adminUsers).where(eq(adminUsers.email, email)).get()) {
	stop('Akun admin ini sudah ada. Ubah password melalui Admin > Account.');
}
await createAdminUser(db, email, password);
console.log('Admin created. Existing site content was kept.');
