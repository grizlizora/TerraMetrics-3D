import { create } from 'zustand';
import { AppLanguage } from '../types';
import ukLocale from '../locales/uk.json';
import enLocale from '../locales/en.json';

export const DICTIONARY: Record<AppLanguage, Record<string, string>> = {
  uk: ukLocale,
  en: enLocale,
};

const getInitialLang = (): AppLanguage => {
  if (typeof localStorage !== 'undefined') {
    const saved = (localStorage.getItem('terrametrics_lang') ||
      localStorage.getItem('religion_map_lang')) as AppLanguage;
    if (saved === 'uk' || saved === 'en') return saved;
  }
  if (typeof navigator !== 'undefined') {
    const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    if (navLang.startsWith('uk')) return 'uk';
  }
  return 'en';
};

const createTranslate = (lang: AppLanguage) => (key: string): string => {
  return DICTIONARY[lang]?.[key] || DICTIONARY.en?.[key] || key;
};

const createFormatter = (lang: AppLanguage) => (value: number, options?: Intl.NumberFormatOptions): string => {
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
  return Number(value || 0).toLocaleString(locale, options);
};

export interface I18nStoreState {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const initialLang = getInitialLang();

export const useI18nStore = create<I18nStoreState>((set, get) => ({
  lang: initialLang,
  t: createTranslate(initialLang),
  formatNumber: createFormatter(initialLang),
  setLang: (lang) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('terrametrics_lang', lang);
      } catch {}
    }
    set({
      lang,
      t: createTranslate(lang),
      formatNumber: createFormatter(lang),
    });
  },
  toggleLang: () => {
    const next = get().lang === 'uk' ? 'en' : 'uk';
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('terrametrics_lang', next);
      } catch {}
    }
    set({
      lang: next,
      t: createTranslate(next),
      formatNumber: createFormatter(next),
    });
  },
}));

export function useTranslation() {
  const lang = useI18nStore((s) => s.lang);
  const t = useI18nStore((s) => s.t);
  const formatNumber = useI18nStore((s) => s.formatNumber);
  return { lang, t, formatNumber };
}
