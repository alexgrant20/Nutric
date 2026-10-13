const { existsSync } = require('node:fs');
const { isAbsolute, join } = require('node:path');
const { pathToFileURL } = require('node:url');

process.chdir(__dirname);
if (existsSync(join(__dirname, '.env'))) process.loadEnvFile(join(__dirname, '.env'));
for (const key of ['DATABASE_PATH', 'UPLOAD_DIR']) {
	if (!process.env[key] || !isAbsolute(process.env[key])) {
		throw new Error(`Set ${key} to an absolute persistent path in cPanel before starting NUTRIC.`);
	}
}
import(pathToFileURL(join(__dirname, 'build/index.js')).href).catch((error) => {
	console.error('NUTRIC failed to start:', error);
	process.exitCode = 1;
});
