import { expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

it('renders markdown', () => expect(renderMarkdown('**hi**')).toContain('<strong>hi</strong>'));
it('strips script tags and event handlers', () => {
	const out = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>');
	expect(out).not.toContain('<script');
	expect(out).not.toContain('onerror');
});
it('neutralises javascript: links', () => {
	expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('javascript:');
});
it('returns an empty string for null', () => expect(renderMarkdown(null)).toBe(''));
