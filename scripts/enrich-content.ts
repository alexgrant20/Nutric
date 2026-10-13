// Adds explanations to the seeded videos and accolades. Run once against the live database:
//   npx tsx --env-file=.env scripts/enrich-content.ts
// Video text paraphrases each YouTube description; accolade text only states what is legible on the certificate image.
import { readFileSync, writeFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { createDb } from '../src/lib/server/db';
import * as s from '../src/lib/server/db/schema';

const videos: Record<string, string> = {
	r7pG1quQZX8: 'Nutric introduces itself: regenerative healthcare solutions offered since 2001, under the line “Progressing Science, Uplifting Lives.”',
	'2he5OH5AUfA': 'Ms. Lim Bee Hong has trusted Nutric’s products since 2007. She speaks about her confidence in them and about “Sharing is Caring”, the mission that guides how she works with others today.',
	DckjjEPaBM8: 'Lee Yang Yi, son of Mr. Peter Lee, tells how he regained his health after six months of using Nutric’s products, and how that helped his father avoid large surgical expenses.',
	YxW5yoimTQc: 'Mr. Jackson Liew has used Nutric since 2003. Diagnosed with frozen shoulder (adhesive capsulitis) at a young age, he explains how he came to rely on the products since.',
	BX7k3UmM7ts: 'Mr. Lee Cheng Tong describes regaining his mobility, and no longer being a burden to his family, after a six-month programme advised by professionals and supported by Nutric’s products.',
	'Ap8Wx4l1I-o': 'Ms. Jenny Chong has supported Nutric since 2011. She describes how the products helped her regain her health and how the business gave her time freedom.',
	HnGIBw8G2FE: 'Madam Cheong is a long-time supporter of BioSpray. She tells how she went from being a frequent hospital patient to regaining her health with the product.',
	PfPVYYdxib8: 'Mr. Young Boon Teik is a leader respected across the Nutric family for his passion in building the business. His story shows what the business makes possible.',
	'02Z22VUbM2k': 'Mr. Robert Lim has been a dedicated Nutric leader for years. He shares his experience and what persistence, determination and commitment have meant to his journey.',
	CJpfTgA_jhs: 'An introduction to Revolutic® BioSpray® and BioSpray® Plus: regenerative healthcare for daily renewal, presented as a natural solution for cell repair and regeneration and a comprehensive nutritional supplement for cell defence.'
};

type Acc = { title: string; issuer: string | null; description: string; alt: string };
const accolades: Record<string, Acc> = {
	'2018-1.png': { title: 'Asia Best Product, Beauty Awards 2018', issuer: 'Asia Best Product', description: 'A trophy and a certificate of appreciation for the Asia Best Product Beauty Awards 2018, dated 27 October 2018 and presented in Bangkok.', alt: 'Winged gold trophy beside the framed Asia Best Product Beauty Awards 2018 certificate' },
	'2017-1.png': { title: 'SMEs BestBrands Award, Corporate Branding', issuer: 'The BrandLaureate', description: 'The BrandLaureate SMEs BestBrands Award for Corporate Branding, for the 2016–2017 term. The certificate sits next to its trophy.', alt: 'Framed BrandLaureate SMEs BestBrands certificate with its trophy' },
	'2017-2.png': { title: 'Asia-Pacific Direct Selling 2017: Most Valuable Cooperative Marketing System', issuer: null, description: 'A 2017 Asia-Pacific direct selling plaque, engraved in Chinese, recognising Nutric’s cooperative marketing system.', alt: 'Chinese-language 2017 Asia-Pacific direct selling award plaque' },
	'2017-3.png': { title: 'Asia-Pacific Direct Selling 2017: Outstanding Leader', issuer: 'China News Culture Promotion Association', description: 'A glass trophy engraved in Chinese, awarded in December 2017 to Group Chairman Lim Chee Wei as an outstanding leader of Asia-Pacific direct selling.', alt: 'Glass Outstanding Leader trophy from the 2017 Asia-Pacific direct selling awards' },
	'2017-4.jpg': { title: 'Gold Medal Awards 2017, Asia Best Product', issuer: 'Chulalongkorn Research Institute, Bangkok', description: 'A gold medal and certificate of appreciation, dated 23 December 2017, selecting a Nutric product as an Asia Best Product. The certificate is in Thai.', alt: 'Gold Medal Awards 2017 certificate and boxed gold medal' },
	'2015-1.png': { title: 'Crystal Trophy 2015', issuer: null, description: 'A crystal trophy engraved in Chinese and English, received in 2015.', alt: 'Crystal trophy with a round top' },
	'2014-1.png': { title: 'Award Trophy 2014', issuer: null, description: 'A faceted crystal trophy on a dark base, received in 2014.', alt: 'Faceted crystal trophy with a colourful emblem on top' },
	'2013-1.png': { title: 'Asia Entrepreneur of the Year 2013, Entrepreneurial Spirit Award', issuer: null, description: 'A star-topped trophy awarded to Group Chairman Mr. Lim Chee Wei of Nutric Group with the Entrepreneurial Spirit Award.', alt: 'Star-topped black trophy engraved Asia Entrepreneur of the Year 2013' },
	'2013-2.png': { title: 'Crystal Trophy 2013', issuer: null, description: 'A crystal trophy with an apple-shaped top on a black base, received in 2013.', alt: 'Crystal trophy with an apple-shaped top' },
	'2011-1.png': { title: 'Asia YES Brand Award 2011, Trophy', issuer: 'MLM Toper (Malaysia) Sdn Bhd', description: 'The crystal trophy that came with the 2011 Asia YES Brand Award.', alt: 'Crystal Asia YES Brand Award trophy with a globe on top' },
	'2011-2.jpg': { title: 'Asia YES Brand Award 2011', issuer: 'MLM Toper (Malaysia) Sdn Bhd', description: 'I-Linkage Sdn Bhd was awarded the 2011 Asia YES Brand Award following a strict selection process by MLM Toper (Malaysia), at a ceremony on 20 November 2011 at PWTC, Kuala Lumpur.', alt: 'Asia YES Brand Award 2011 certificate' },
	'2010-1.png': { title: 'Asia Pacific International Award 2010', issuer: null, description: 'An award trophy with a gold torch emblem, presented to I-Linkage Sdn. Bhd. in 2010.', alt: 'Trophy with a gold emblem on a wooden base' },
	'2009-1.png': { title: 'Crystal Trophy 2009', issuer: null, description: 'A crystal trophy with a sphere on top, received in 2009.', alt: 'Crystal trophy with a sphere on top' },
	'2009-2.png': { title: 'Asia-Pacific Marketing Enterprise Award 2009', issuer: null, description: 'A framed plaque, written in Chinese, honouring Nutric as a marketing enterprise in Asia-Pacific in 2009.', alt: 'Framed 2009 Chinese-language award plaque' },
	'2005-1.png': { title: 'Asia Pacific Award 2005', issuer: null, description: 'A globe-topped trophy received in 2005.', alt: 'Trophy topped with a blue globe' },
	'2005-2.png': { title: 'Asia Pacific Entrepreneurial Excellence Award 2005', issuer: null, description: 'The 7th Asia Pacific – Malaysia Entrepreneurial Excellence Award, 2005, presented to an I-Linkage Sdn. Bhd. executive.', alt: 'Globe-topped trophy engraved Entrepreneurial Excellence Award 2005' }
};

const db = createDb(process.env.DATABASE_PATH ?? 'data/nutric.db');
const ytId = (u: string) => u.match(/[?&]v=([\w-]{11})/)?.[1] ?? '';

// Live database
for (const t of db.select().from(s.testimonials).all()) {
	const q = videos[ytId(t.youtubeUrl ?? '')];
	if (q) db.update(s.testimonialTranslations).set({ quote: q }).where(eq(s.testimonialTranslations.testimonialId, t.id)).run();
}
for (const a of db.select().from(s.accolades).all()) {
	const c = accolades[a.image.split('/').pop()!];
	if (!c) continue;
	db.update(s.accolades).set({ issuer: c.issuer }).where(eq(s.accolades.id, a.id)).run();
	db.update(s.accoladeTranslations).set({ title: c.title, description: c.description, imageAlt: c.alt }).where(eq(s.accoladeTranslations.accoladeId, a.id)).run();
}

// seed/data.json, so a reseed keeps the same text
const p = 'seed/data.json';
const d = JSON.parse(readFileSync(p, 'utf8'));
for (const t of d.testimonials) { const q = videos[ytId(t.youtubeUrl ?? '')]; if (q && t.t.en) t.t.en.quote = q; }
for (const a of d.accolades) {
	const c = accolades[String(a.image).split('/').pop()!];
	if (c && a.t.en) { a.issuer = c.issuer; Object.assign(a.t.en, { title: c.title, description: c.description, imageAlt: c.alt }); }
}
writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
console.log('done');
