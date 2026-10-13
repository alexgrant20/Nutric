import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = join(root, '.deploy');
// Refuse stale packages rather than publishing assets left by a previous build.
await mkdir(destination);
for (const entry of ['build', 'drizzle', 'package-lock.json']) {
	await cp(join(root, entry), join(destination, entry), { recursive: true });
}
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
manifest.scripts = { start: 'node app.cjs' };
await writeFile(join(destination, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
await cp(join(root, 'scripts/cpanel-app.cjs'), join(destination, 'app.cjs'));
console.log('Production package: .deploy/ (no database, uploads, .env or node_modules)');
