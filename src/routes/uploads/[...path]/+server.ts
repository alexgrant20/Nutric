import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { env } from '$env/dynamic/private';
import { resolveUploadPath } from '$lib/server/upload';

const TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4'
};

export const GET = async ({ params }) => {
	const full = resolveUploadPath(env.UPLOAD_DIR ?? 'data/uploads', params.path);
	const type = full ? TYPES[extname(full).toLowerCase()] : undefined;
	if (!full || !type) throw error(404);
	try {
		const body = await readFile(full);
		return new Response(body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' } });
	} catch {
		throw error(404);
	}
};
