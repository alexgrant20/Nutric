import { db } from '$lib/server/db/instance';
import { getLandingData } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import { youtubeId } from '$lib/youtube';
import type { Lang } from '$lib/i18n/config';

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const plainText = (html: string) =>
	html.replace(/<[^>]+>/g, ' ').replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]).replace(/\s+/g, ' ').trim();

export const load = ({ params }) => {
	const d = getLandingData(db, params.lang as Lang);
	return {
		...d,
		aboutText: plainText(renderMarkdown(d.settings?.t?.aboutTeaserMd)),
		testimonials: d.testimonials.map((x) => ({ ...x, videoId: youtubeId(x.youtubeUrl) })).filter((x) => x.videoId),
		reviews: d.reviews.map((x) => ({ ...x, videoId: youtubeId(x.youtubeUrl) })).filter((x) => x.videoId)
	};
};
