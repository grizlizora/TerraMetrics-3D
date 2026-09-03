import type { AppLanguage, SearchIndexEntry } from '../../types';
import { SearchIndexBuilder, SearchResultItem } from '../processors/searchIndexBuilder';

export type { SearchResultItem };

const POPULAR_ALIASES: Record<string, string[]> = {
  USA: ['сша', 'usa', 'us', 'america', 'америка', 'сполучені штати'],
  GBR: ['uk', 'great britain', 'england', 'британія', 'англія', 'велика британія'],
  ARE: ['оае', 'uae', 'emirates', 'емірати', 'об\x27єднані арабські емірати'],
  COD: ['дрк', 'drc', 'др конго', 'dr congo'],
  NLD: ['голландія', 'holland', 'нідерланди'],
  KOR: ['південна корея', 'south korea', 'корея'],
  PRK: ['північна корея', 'north korea'],
  CZE: ['чехія', 'czechia'],
  DEU: ['німеччина', 'германія', 'germany', 'deutschland'],
  TUR: ['туреччина', 'тюркіє', 'turkey', 'turkiye'],
  VAT: ['ватикан', 'vatican', 'holy see'],
  IRN: ['іран', 'персія', 'iran', 'persia'],
  UKR: ['україна', 'ukraine', 'ua'],
  CHN: ['китай', 'china'],
  IND: ['індія', 'india'],
  FRA: ['франція', 'france'],
  ITA: ['італія', 'italy'],
  ESP: ['іспанія', 'spain'],
  POL: ['польща', 'poland'],
  JPN: ['японія', 'japan'],
  CAN: ['канада', 'canada'],
  BRA: ['бразилія', 'brazil'],
  EGY: ['єгипет', 'egypt'],
  SAU: ['саудівська аравія', 'saudi arabia'],
  ZAF: ['пар', 'південна африка', 'south africa'],
  CAF: ['цар', 'центральноафриканська республіка'],
  MDA: ['молдова', 'молдавія', 'moldova'],
  GEO: ['грузія', 'сакартвело', 'georgia'],
  ARM: ['вірменія', 'armenia'],
  AZE: ['азербайджан', 'azerbaijan'],
  KAZ: ['казахстан', 'kazakhstan'],
  BLR: ['білорусь', 'білорусія', 'belarus'],
};

export class CountrySearchEngine {
  private searchIndex: SearchIndexEntry[] = [];
  private defaultListUk: SearchResultItem[] = [];
  private defaultListEn: SearchResultItem[] = [];

  public setIndex(
    searchIndex: SearchIndexEntry[],
    defaultListUk?: SearchResultItem[],
    defaultListEn?: SearchResultItem[]
  ): void {
    this.searchIndex = searchIndex;
    this.defaultListUk =
      defaultListUk ||
      searchIndex.map((i) => ({ iso: i.iso, name: i.nameUk, continent: i.continent }));
    this.defaultListEn =
      defaultListEn ||
      searchIndex.map((i) => ({ iso: i.iso, name: i.nameEn, continent: i.continent }));
  }

  public search(query: string, lang: AppLanguage = 'uk'): SearchResultItem[] {
    if (!query || !query.trim()) {
      return (lang === 'uk' ? this.defaultListUk : this.defaultListEn).slice(0, 50);
    }

    const q = SearchIndexBuilder.normalizeText(query);
    const spaceQ = ` ${q}`;
    const dashQ = `-${q}`;
    const isUk = lang === 'uk';

    const bucket1: SearchResultItem[] = [];
    const bucket2: SearchResultItem[] = [];
    const bucket3: SearchResultItem[] = [];

    for (let i = 0; i < this.searchIndex.length; i++) {
      const item = this.searchIndex[i];
      const primaryName = isUk ? item.nameUkLower : item.nameEnLower;
      const secondaryName = isUk ? item.nameEnLower : item.nameUkLower;
      const displayName = isUk ? item.nameUk : item.nameEn;

      // Check alias match
      const aliases = POPULAR_ALIASES[item.iso];
      const aliasMatch = aliases ? aliases.some((a) => a.startsWith(q) || a === q) : false;

      if (aliasMatch || primaryName.startsWith(q) || secondaryName.startsWith(q)) {
        bucket1.push({ iso: item.iso, name: displayName, continent: item.continent });
      } else if (
        item.isoLower.startsWith(q) ||
        primaryName.includes(spaceQ) ||
        primaryName.includes(dashQ) ||
        secondaryName.includes(spaceQ) ||
        secondaryName.includes(dashQ)
      ) {
        bucket2.push({ iso: item.iso, name: displayName, continent: item.continent });
      } else if (primaryName.includes(q) || secondaryName.includes(q) || item.isoLower.includes(q)) {
        bucket3.push({ iso: item.iso, name: displayName, continent: item.continent });
      }
    }

    const total = bucket1.length + bucket2.length + bucket3.length;
    const out: SearchResultItem[] = new Array(Math.min(50, total));
    let idx = 0;
    for (let i = 0; i < bucket1.length && idx < 50; i++) out[idx++] = bucket1[i];
    for (let i = 0; i < bucket2.length && idx < 50; i++) out[idx++] = bucket2[i];
    for (let i = 0; i < bucket3.length && idx < 50; i++) out[idx++] = bucket3[i];

    return out;
  }
}

export const countrySearchEngine = new CountrySearchEngine();
