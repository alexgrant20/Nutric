import { enabledLangs, type Lang } from '../i18n/config';
import { youtubeId } from '../youtube';
import type { Entity, Field } from './entities';

export type ParsedForm = { base: Record<string, unknown>; trs: Partial<Record<Lang, Record<string, unknown>>> };
export type FormErrors = Record<string, string>;
export type FormValues = { base: Record<string, unknown>; trs: Record<string, Record<string, unknown>> };

export function parseLines(text: string): string[] {
	return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}
export function parseFaqs(text: string): { q: string; a: string }[] {
	return text
		.replace(/\r/g, '')
		.split(/\n\s*\n/)
		.map((block) => block.trim().split('\n'))
		.filter((lines) => lines.length >= 2 && lines[0].trim() && lines.slice(1).join('\n').trim())
		.map((lines) => ({ q: lines[0].trim(), a: lines.slice(1).join('\n').trim() }));
}
export const faqsToText = (faqs: { q: string; a: string }[]) => faqs.map((f) => `${f.q}\n${f.a}`).join('\n\n');

const text = (v: FormDataEntryValue | null): string | null => {
	const s = typeof v === 'string' ? v.trim() : '';
	return s === '' ? null : s;
};
const uploadPath = (v: string | null) => (v && v.startsWith('/uploads/') && !v.includes('..') ? v : null);

function coerce(field: Field, key: string, fd: FormData): unknown {
	switch (field.type) {
		case 'boolean': return fd.get(key) === 'on';
		case 'number': { const t = text(fd.get(key)); return t == null ? (field.name === 'sortOrder' ? 0 : null) : Number(t); }
		case 'select': return text(fd.get(key)) ?? field.options?.[0]?.value ?? null;
		case 'relation': { const t = text(fd.get(key)); return t == null ? null : Number(t); }
		case 'lines': return parseLines(String(fd.get(key) ?? ''));
		case 'faqs': return parseFaqs(String(fd.get(key) ?? ''));
		case 'image': return uploadPath(text(fd.get(key)));
		case 'imageList': return fd.getAll(key).map((x) => uploadPath(text(x))).filter((x): x is string => !!x);
		default: return text(fd.get(key));
	}
}

const hasContent = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== false);

export function readForm(entity: Entity, fd: FormData) {
	const parsed: ParsedForm = { base: {}, trs: {} };
	const files: Record<string, File[]> = {};
	for (const f of entity.fields) {
		if (f.translatable) {
			for (const lang of enabledLangs()) {
				(parsed.trs[lang] ??= {})[f.name] = coerce(f, `t.${lang}.${f.name}`, fd);
			}
		} else {
			parsed.base[f.name] = coerce(f, `f.${f.name}`, fd);
			if (f.type === 'image' || f.type === 'imageList') {
				files[f.name] = fd.getAll(`file.${f.name}`).filter((x): x is File => x instanceof File && x.size > 0);
			}
		}
	}
	return { parsed, files };
}

export function validateForm(entity: Entity, parsed: ParsedForm): FormErrors {
	const errors: FormErrors = {};
	for (const f of entity.fields.filter((x) => !x.translatable)) {
		const v = parsed.base[f.name];
		if (f.required && !hasContent(v) && f.type !== 'image' && f.type !== 'imageList') errors[`f.${f.name}`] = `${f.label} is required.`;
		if (f.type === 'number' && v != null && !Number.isFinite(v as number)) errors[`f.${f.name}`] = `${f.label} must be a number.`;
		if (f.type === 'date' && v != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) errors[`f.${f.name}`] = `${f.label} must be a date (YYYY-MM-DD).`;
		if (f.type === 'select' && v != null && !f.options?.some((o) => o.value === v)) errors[`f.${f.name}`] = `${f.label} has an invalid value.`;
		if (f.type === 'url' && f.name === 'youtubeUrl' && v != null && !youtubeId(String(v))) errors[`f.${f.name}`] = 'Enter a YouTube video link (youtube.com/watch?v=..., youtu.be/..., or /embed/...).';
	}
	const required = entity.fields.filter((f) => f.translatable && f.required);
	for (const lang of enabledLangs()) {
		const tr = parsed.trs[lang] ?? {};
		const used = Object.values(tr).some(hasContent);
		if (lang !== 'en' && !used) continue;
		for (const f of required) {
			if (!hasContent(tr[f.name])) {
				errors[`t.${lang}.${f.name}`] = lang === 'en' ? `${f.label} is required in English.` : `${f.label} is required when this language is used.`;
			}
		}
	}
	return errors;
}

export function toFormValues(entity: Entity, rec: { base: Record<string, any>; trs: Record<string, Record<string, any>> }): FormValues {
	const out: FormValues = { base: { ...rec.base }, trs: {} };
	for (const [lang, tr] of Object.entries(rec.trs)) {
		out.trs[lang] = { ...tr };
		for (const f of entity.fields) {
			if (!f.translatable) continue;
			const v = tr[f.name];
			if (f.type === 'lines' && Array.isArray(v)) out.trs[lang][f.name] = v.join('\n');
			if (f.type === 'faqs' && Array.isArray(v)) out.trs[lang][f.name] = faqsToText(v);
		}
	}
	return out;
}
