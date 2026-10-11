// Downloads each curated video's YouTube thumbnail once, so the site shows self-hosted posters and
// makes no request to YouTube until a visitor presses play. Run after `npm run scrape`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { youtubeId } from '../src/lib/youtube';
import type { SeedData } from './seed-types';

const dataPath = 'seed/data.json';
const data = JSON.parse(readFileSync(dataPath, 'utf8')) as SeedData;

async function fetchPoster(id: string): Promise<string | null> {
	const file = `yt-${id}.jpg`;
	if (existsSync(`seed/images/${file}`)) return file;
	for (const size of ['maxresdefault', 'hqdefault']) {
		const res = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`);
		if (!res.ok) continue;
		const bytes = Buffer.from(await res.arrayBuffer());
		if (bytes.length < 5_000) continue;
		writeFileSync(`seed/images/${file}`, bytes);
		return file;
	}
	return null;
}

for (const tm of data.testimonials) {
	const id = youtubeId(tm.youtubeUrl);
	tm.posterImage = id ? await fetchPoster(id) : null;
	console.log(tm.t.en?.title, '->', tm.posterImage ?? 'no poster');
}
writeFileSync(dataPath, JSON.stringify(data, null, 2));
