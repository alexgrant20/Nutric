import { isAbsolute, resolve, sep } from 'node:path';

export function resolveUploadPath(root: string, rel: string): string | null {
	if (!rel || rel.includes('\0') || isAbsolute(rel) || /^[a-zA-Z]:/.test(rel) || rel.includes('%')) return null;
	const base = resolve(root);
	const full = resolve(base, rel);
	return full.startsWith(base + sep) ? full : null;
}

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export class UploadError extends Error {}

export function validateUpload(
	file: { name: string; size: number },
	bytes: Uint8Array
): { ext: 'jpg' | 'png' | 'webp' } | { error: string } {
	if (file.size === 0 || bytes.length === 0) return { error: 'The file is empty.' };
	if (file.size > MAX_UPLOAD_BYTES) return { error: 'The file is larger than 5 MB.' };
	const b = bytes;
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg' };
	if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png' };
	if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return { ext: 'webp' };
	return { error: 'Only JPG, PNG or WebP images are allowed.' };
}

export async function saveUpload(file: File, folder: string, root: string): Promise<string> {
	if (!/^[a-z]+$/.test(folder)) throw new UploadError('Invalid upload folder.');
	const bytes = new Uint8Array(await file.arrayBuffer());
	const checked = validateUpload({ name: file.name, size: file.size }, bytes);
	if ('error' in checked) throw new UploadError(checked.error);
	const name = `${randomUUID()}.${checked.ext}`;
	await mkdir(join(root, folder), { recursive: true });
	await writeFile(join(root, folder, name), bytes);
	return `/uploads/${folder}/${name}`;
}
