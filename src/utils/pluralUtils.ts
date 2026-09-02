import type { AppLanguage } from '../types';

export interface PluralFormsUk {
  one: string; // 1, 21, 31... (крім 11) -> "країна"
  few: string; // 2-4, 22-24... (крім 12-14) -> "країни"
  many: string; // 0, 5-20, 25-30... -> "країн"
}

export interface PluralFormsEn {
  one: string; // 1 -> "country"
  other: string; // 0, 2, 3... -> "countries"
}

export interface PluralConfig {
  uk: PluralFormsUk;
  en: PluralFormsEn;
}

/**
 * Common plural configurations across the application
 */
export const PLURAL_COUNTRIES: PluralConfig = {
  uk: { one: 'країна', few: 'країни', many: 'країн' },
  en: { one: 'country', other: 'countries' },
};

export const PLURAL_PEOPLE: PluralConfig = {
  uk: { one: 'особа', few: 'особи', many: 'осіб' },
  en: { one: 'person', other: 'people' },
};

export const PLURAL_DAYS: PluralConfig = {
  uk: { one: 'день', few: 'дні', many: 'днів' },
  en: { one: 'day', other: 'days' },
};

/**
 * Formats a number with grammatical pluralization based on standard Intl.PluralRules.
 */
export function pluralize(count: number, lang: AppLanguage, config: PluralConfig): string {
  const num = Math.abs(Math.round(count));

  if (lang === 'uk') {
    const mod10 = num % 10;
    const mod100 = num % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return `${count} ${config.uk.one}`;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return `${count} ${config.uk.few}`;
    }
    return `${count} ${config.uk.many}`;
  }

  return num === 1 ? `${count} ${config.en.one}` : `${count} ${config.en.other}`;
}
