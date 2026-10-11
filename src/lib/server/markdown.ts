import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(md: string | null | undefined): string {
	if (!md) return '';
	const html = marked.parse(md, { async: false, gfm: true, breaks: false }) as string;
	return sanitizeHtml(html, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3']),
		allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'title'] },
		allowedSchemes: ['http', 'https', 'mailto', 'tel'],
		transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) }
	});
}
