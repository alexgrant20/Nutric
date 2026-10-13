import { db } from '$lib/server/db/instance';
import { getTestimonials } from '$lib/server/content';
import { youtubeId } from '$lib/youtube';
import type { Lang } from '$lib/i18n/config';

export const load = ({ params }) => ({
	items: getTestimonials(db, params.lang as Lang, 'testimonial').map((x) => ({ ...x, videoId: youtubeId(x.youtubeUrl) })).filter((x) => x.videoId)
});
