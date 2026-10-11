const ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(url: string | null | undefined): string | null {
	if (!url) return null;
	let u: URL;
	try {
		u = new URL(url);
	} catch {
		return null;
	}
	if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
	const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
	let candidate: string | null = null;
	if (host === 'youtu.be') candidate = u.pathname.slice(1).split('/')[0];
	else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
		if (u.pathname === '/watch') candidate = u.searchParams.get('v');
		else {
			const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
			candidate = m?.[1] ?? null;
		}
	}
	return candidate && ID.test(candidate) ? candidate : null;
}
