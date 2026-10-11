import { db } from '$lib/server/db/instance';
import { getLandingData } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import { youtubeId } from '$lib/youtube';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => {
	const d = getLandingData(db, params.lang as Lang);
	return {
		...d,
		aboutHtml: renderMarkdown(d.settings?.t?.aboutTeaserMd),
		testimonials: d.testimonials.map((x) => ({ ...x, videoId: youtubeId(x.youtubeUrl) })).filter((x) => x.videoId)
	};
};
