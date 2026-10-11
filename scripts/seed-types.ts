export type SeedLang = 'en' | 'ms' | 'id' | 'zh' | 'zh-tw' | 'th';
export const SEED_LANGS: SeedLang[] = ['en', 'ms', 'id', 'zh', 'zh-tw', 'th'];
export type Tr<T> = Partial<Record<SeedLang, T>>;

export interface SeedData {
	generatedAt: string;
	settings: {
		brandName: string;
		logoImage: string | null;
		heroMedia: string | null;
		heroMediaType: 'image' | 'video';
		heroProductImage: string | null;
		contactEmail: string | null;
		contactPhone: string | null;
		whatsappUrl: string | null;
		socialLinks: { platform: string; url: string }[];
		t: Tr<{
			tagline: string | null; headlineLine1: string | null; headlineLine2: string | null;
			subheadline: string | null; ctaLabel: string | null; heroBadgeText: string | null;
			aboutTeaserMd: string | null; aboutMd: string | null; termsMd: string | null; aboutImageAlt: string | null; footerNote: string | null;
		}>;
	};
	collections: {
		slug: string; bannerImage: string | null; sortOrder: number;
		t: Tr<{ name: string; tagline: string | null; description: string | null; bannerAlt: string | null }>;
	}[];
	products: {
		slug: string; collectionSlug: string | null; mainImage: string | null; gallery: string[];
		isBestSeller: boolean; sortOrder: number;
		t: Tr<{
			name: string; shortDescription: string | null; descriptionMd: string | null; benefits: string[];
			ingredientsMd: string | null; howToUseMd: string | null; faqs: { q: string; a: string }[];
			regulatoryText: string | null; imageAlt: string | null;
		}>;
	}[];
	news: {
		slug: string; coverImage: string | null; eventDate: string | null; location: string | null;
		t: Tr<{ title: string; excerpt: string | null; bodyMd: string | null; coverAlt: string | null }>;
	}[];
	testimonials: {
		personName: string | null; role: string | null; youtubeUrl: string | null; sortOrder: number;
		t: Tr<{ title: string; quote: string | null }>;
	}[];
	accolades: {
		image: string; year: number | null; issuer: string | null; sortOrder: number;
		t: Tr<{ title: string; description: string | null; imageAlt: string | null }>;
	}[];
}
