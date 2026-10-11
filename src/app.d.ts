declare global {
	namespace App {
		interface Locals {
			user: { id: number; email: string } | null;
			lang: 'en' | 'ms' | 'id' | 'zh' | 'zh-tw' | 'th';
		}
	}
}

export {};
