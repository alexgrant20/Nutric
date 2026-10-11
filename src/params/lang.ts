import { isLang } from '../lib/i18n/config';
export const match = (param: string) => isLang(param);
