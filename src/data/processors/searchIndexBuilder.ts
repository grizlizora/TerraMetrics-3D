import type { ContinentName, CountryFeature, ISO3Code, SearchIndexEntry } from '../../types/index.ts';

export interface SearchResultItem {
  iso: ISO3Code;
  name: string;
  continent: ContinentName;
}

export class SearchIndexBuilder {
  public static normalizeText(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’`ʼ]/g, "'")
      .toLowerCase()
      .trim();
  }

  public static buildIndex(features: CountryFeature[]): {
    searchIndex: SearchIndexEntry[];
    defaultCountryListUk: SearchResultItem[];
    defaultCountryListEn: SearchResultItem[];
  } {
    const rawList: SearchIndexEntry[] = [];

    for (let i = 0; i < features.length; i++) {
      const p = features[i].properties;
      const iso = (p['ISO3166-1-Alpha-3'] || '') as ISO3Code;
      const nameUk = p.name_uk || p.name || iso;
      const nameEn = p.name_en || p.name || iso;
      const pop = Number(p.population) || 0;
      const continent = (p.continent || 'World') as ContinentName;

      rawList.push({
        iso,
        isoLower: iso.toLowerCase(),
        nameUk,
        nameUkLower: this.normalizeText(nameUk),
        nameEn,
        nameEnLower: this.normalizeText(nameEn),
        population: pop,
        continent,
      });
    }

    // Sort by population descending for demographic relevance ranking
    const searchIndex = rawList.sort((a, b) => b.population - a.population);

    const defaultCountryListUk: SearchResultItem[] = searchIndex.map((item) => ({
      iso: item.iso,
      name: item.nameUk,
      continent: item.continent,
    }));

    const defaultCountryListEn: SearchResultItem[] = searchIndex.map((item) => ({
      iso: item.iso,
      name: item.nameEn,
      continent: item.continent,
    }));

    return {
      searchIndex,
      defaultCountryListUk,
      defaultCountryListEn,
    };
  }
}
