import { isAbsolute, resolve, sep } from 'node:path';

export function resolveUploadPath(root: string, rel: string): string | null {
	if (!rel || rel.includes('\0') || isAbsolute(rel) || /^[a-zA-Z]:/.test(rel) || rel.includes('%')) return null;
	const base = resolve(root);
	const full = resolve(base, rel);
	return full.startsWith(base + sep) ? full : null;
}
