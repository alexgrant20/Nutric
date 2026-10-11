const MONTHS: Record<string, string> = {
	jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
	jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

export function parseNewsDate(text: string): string | null {
	const m = text.trim().match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
	if (!m) return null;
	const month = MONTHS[m[2].toLowerCase()];
	return month ? `${m[3]}-${month}-${m[1].padStart(2, '0')}` : null;
}

export function newsBodyFromI18n(news: Record<string, string>, n: number) {
	const title = news[`NEWS${n}`];
	if (!title) return null;
	const paragraphs: string[] = [];
	for (let k = 1; news[`NEWS${n}LONGDESC${k}`] !== undefined; k++) paragraphs.push(news[`NEWS${n}LONGDESC${k}`].trim());
	return {
		title,
		excerpt: news[`NEWS${n}SHORTDESC`] ?? null,
		bodyMd: paragraphs.length ? paragraphs.join('\n\n') : null
	};
}

export function collectionSlugFor(productName: string): string | null {
	const n = productName.toLowerCase();
	for (const brand of ['revolutic', 'vitanetic', 'skinetique']) if (n.startsWith(brand)) return brand;
	return null;
}

export function regulatoryExpiry(text: string): string | null {
	const m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

export function faqsFromPairs(pairs: [string, string][]): { q: string; a: string }[] {
	return pairs
		.map(([q, a]) => ({ q: q.trim(), a: a.trim() }))
		.filter((x) => x.q && x.a);
}

export function splitBenefits(html: string): { descriptionHtml: string; benefits: string[] } {
	const ul = html.match(/<ul>([\s\S]*?)<\/ul>/);
	if (!ul) return { descriptionHtml: html.trim(), benefits: [] };
	const benefits = [...ul[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
	const descriptionHtml = html
		.replace(/<p>\s*<b>[^<]*<\/b>\s*<\/p>/, '')
		.replace(/<ul>[\s\S]*?<\/ul>/, '')
		.trim();
	return { descriptionHtml, benefits };
}

export function aboutToMarkdown(about: Record<string, string>): string | null {
	const parts: string[] = [];
	const intro = ['NUTRIC-1', 'NUTRIC-2'].map((k) => about[k]).filter(Boolean);
	if (intro.length) parts.push(intro.join('\n\n'));
	const sections: [string, string[]][] = [
		['OURMOTTO', ['SLOGAN-1', 'SLOGAN-2', 'SLOGAN-3', 'SLOGAN-4']],
		['OURMISSION', ['MISSION-1']],
		['OURVISION', ['VISION-1']],
		['OURHISTORY', ['HISTORY-1', 'HISTORY-2', 'HISTORY-3', 'HISTORY-4']],
		['OUROFFICES', ['OFFICE-1', 'OFFICE-2', 'OFFICE-3']]
	];
	for (const [heading, keys] of sections) {
		const body = keys.map((k) => about[k]).filter(Boolean);
		if (about[heading] && body.length) parts.push(`## ${about[heading]}\n\n${body.join('\n\n')}`);
	}
	return parts.length ? parts.join('\n\n') : null;
}
