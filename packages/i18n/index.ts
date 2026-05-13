import az from './az.json';

export const messages = { az };
export type Locale = keyof typeof messages;
export const defaultLocale: Locale = 'az';
export const locales: Locale[] = ['az'];

export default messages;
