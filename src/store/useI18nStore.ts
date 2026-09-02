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

interface I18nStoreState {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

export const useI18nStore = create<I18nStoreState>((set, get) => ({
  lang: getInitialLang(),
  setLang: (lang) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('terrametrics_lang', lang);
      } catch {}
    }
    set({ lang });
  },
  toggleLang: () => {
    const next = get().lang === 'uk' ? 'en' : 'uk';
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('terrametrics_lang', next);
      } catch {}
    }
    set({ lang: next });
  },
  t: (key: string) => {
    const { lang } = get();
    return DICTIONARY[lang]?.[key] || DICTIONARY.en?.[key] || key;
  },
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => {
    const { lang } = get();
    const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
    return Number(value || 0).toLocaleString(locale, options);
  },
}));
