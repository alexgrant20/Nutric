import { json } from '@sveltejs/kit';
import { renderMarkdown } from '$lib/server/markdown';

export const POST = async ({ request }) => json({ html: renderMarkdown(String((await request.json()).md ?? '').slice(0, 100_000)) });
