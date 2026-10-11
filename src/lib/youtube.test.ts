import { expect, it } from 'vitest';
import { youtubeId } from './youtube';

const id = 'dQw4w9WgXcQ';
it.each([
	[`https://www.youtube.com/watch?v=${id}`, id],
	[`https://youtube.com/watch?v=${id}&t=10`, id],
	[`https://youtu.be/${id}`, id],
	[`https://www.youtube.com/embed/${id}`, id],
	[`https://www.youtube.com/shorts/${id}`, id],
	['https://vimeo.com/123456', null],
	['javascript:alert(1)', null],
	['https://evil.com/watch?v=dQw4w9WgXcQ', null],
	['https://www.youtube.com/watch?v=short', null],
	['', null],
	[null, null]
])('%s -> %s', (url, expected) => expect(youtubeId(url as string | null)).toBe(expected));
