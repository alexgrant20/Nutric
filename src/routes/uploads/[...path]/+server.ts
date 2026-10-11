import { error } from '@sveltejs/kit';
import { open, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { UPLOAD_DIR } from '$app/env/private';
import { resolveUploadPath } from '$lib/server/upload';
import { parseRange } from '$lib/server/range';

const TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4'
};

export const GET = async ({ params, request }) => {
	const full = resolveUploadPath(UPLOAD_DIR, params.path);
	const type = full ? TYPES[extname(full).toLowerCase()] : undefined;
	if (!full || !type) throw error(404);
	const headers: Record<string, string> = {
		'content-type': type,
		'cache-control': 'public, max-age=31536000, immutable',
		'accept-ranges': 'bytes',
		'x-content-type-options': 'nosniff'
	};
	try {
		const { size } = await stat(full);
		const rangeHeader = request.headers.get('range');
		const range = parseRange(rangeHeader, size);
		if (rangeHeader && !range) {
			return new Response(null, { status: 416, headers: { ...headers, 'content-range': `bytes */${size}` } });
		}
		const start = range?.start ?? 0;
		const end = range?.end ?? size - 1;
		const length = end - start + 1;
		const handle = await open(full, 'r');
		try {
			const buffer = Buffer.alloc(length);
			await handle.read(buffer, 0, length, start);
			return new Response(buffer, {
				status: range ? 206 : 200,
				headers: {
					...headers,
					'content-length': String(length),
					...(range ? { 'content-range': `bytes ${start}-${end}/${size}` } : {})
				}
			});
		} finally {
			await handle.close();
		}
	} catch {
		throw error(404);
	}
};
