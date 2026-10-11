import { sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveUploadPath } from './upload';

describe('resolveUploadPath', () => {
	it('resolves a normal relative path inside the root', () => {
		const p = resolveUploadPath('/data/uploads', 'news/a.jpg');
		expect(p?.endsWith(`news${sep}a.jpg`)).toBe(true);
	});
	it.each(['../secret.txt', '..%2f..%2fetc', 'a/../../b', '/etc/passwd', 'a\0b', 'C:\\Windows\\win.ini'])(
		'rejects %s',
		(rel) => expect(resolveUploadPath('/data/uploads', rel)).toBeNull()
	);
	it('rejects an empty path', () => expect(resolveUploadPath('/data/uploads', '')).toBeNull());
});

import { validateUpload } from './upload';

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

describe('validateUpload', () => {
	it('accepts png, jpg and webp by magic bytes, ignoring the file name', () => {
		expect(validateUpload({ name: 'x.txt', size: 10 }, png)).toEqual({ ext: 'png' });
		expect(validateUpload({ name: 'x.png', size: 10 }, jpg)).toEqual({ ext: 'jpg' });
		expect(validateUpload({ name: 'x', size: 10 }, webp)).toEqual({ ext: 'webp' });
	});
	it('rejects a spoofed extension (html content named .jpg)', () => {
		const html = new TextEncoder().encode('<html><script>alert(1)</script>');
		expect(validateUpload({ name: 'evil.jpg', size: html.length }, html)).toHaveProperty('error');
	});
	it('rejects svg and empty files', () => {
		expect(validateUpload({ name: 'a.svg', size: 5 }, new TextEncoder().encode('<svg/>'))).toHaveProperty('error');
		expect(validateUpload({ name: 'a.png', size: 0 }, new Uint8Array())).toHaveProperty('error');
	});
	it('rejects files over 5 MB', () => {
		expect(validateUpload({ name: 'a.png', size: 5 * 1024 * 1024 + 1 }, png)).toHaveProperty('error');
	});
});
