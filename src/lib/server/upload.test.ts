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
