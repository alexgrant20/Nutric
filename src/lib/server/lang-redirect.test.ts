import { expect, it } from 'vitest';
import { unsupportedLangRedirect } from './lang-redirect';

it.each([
	['/xx/products', '/en/products'],
	['/fr', '/en'],
	['/pt-br/news/a', '/en/news/a'],
	['/en/products', null],
	['/zh-tw/news', null],
	['/admin/login', null],
	['/uploads/a.jpg', null],
	['/', null],
	['/products', null],
	['/api/subscribe', null],
	['/_app/immutable/x.js', null]
])('%s -> %s', (path, expected) => expect(unsupportedLangRedirect(path)).toBe(expected));
