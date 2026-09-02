import {
  AggregatedContinentStats,
  ContinentName,
  CountryFeatureCollection,
  CountryProperties,
  ISO3Code,
  LabelFeatureCollection,
  LoadingStageKey,
  ReligionDataset,
  StaticDemographicsMap,
  StaticIndexesMap,
} from '../types';
import { processGeoData } from './processWorker';
import { dataSyncManager } from './sync/DataSyncManager';
import { countrySearchEngine, SearchResultItem } from './search/CountrySearchEngine';

export type ProgressCallback = (stageKey: LoadingStageKey, progress: number) => void;

export class DataLoader {
  public geoJsonData: CountryFeatureCollection | null = null;
  public labelsGeoJson: LabelFeatureCollection | null = null;
  public religionData: ReligionDataset | null = null;
  public indexesData: StaticIndexesMap | null = null;
  public demographicsData: StaticDemographicsMap | null = null;
  public countryPropsMap: Record<ISO3Code, CountryProperties> = {} as any;

  private continentStatsCache: Map<ContinentName, AggregatedContinentStats> = new Map();
  private inFlightLoadPromise: Promise<boolean> | null = null;

  public getCountryProps(iso: string): CountryProperties | null {
    if (!iso) return null;
    return this.countryPropsMap[iso as ISO3Code] || null;
  }

  public getCountryBbox(iso: ISO3Code): [number, number, number, number] | null {
    if (!iso) return null;
    const props = this.countryPropsMap[iso];
    return props?.primaryBbox || props?.bbox || null;
  }

  public getContinentStats(continentName: ContinentName | string): AggregatedContinentStats | null {
    if (!continentName) return null;
    return this.continentStatsCache.get(continentName as ContinentName) || null;
  }

  public getCountryStats(isoA3: ISO3Code) {
    return this.religionData?.countries?.[isoA3] || null;
  }

  public getGeoJson(): CountryFeatureCollection | null {
    return this.geoJsonData;
  }

  public getLabelsGeoJson(): LabelFeatureCollection | null {
    return this.labelsGeoJson;
  }

  public searchCountries(query: string, lang: 'uk' | 'en' = 'uk'): SearchResultItem[] {
    return countrySearchEngine.search(query, lang);
  }

  public async loadAll(
    onProgress?: ProgressCallback,
    options?: { syncInBackground?: boolean; forceReload?: boolean }
  ): Promise<boolean> {
    if (this.inFlightLoadPromise) {
      return this.inFlightLoadPromise;
    }

    this.inFlightLoadPromise = this._executeLoadAll(onProgress, options).finally(() => {
      this.inFlightLoadPromise = null;
    });

    return this.inFlightLoadPromise;
  }

  private async _executeLoadAll(
    onProgress?: ProgressCallback,
    options?: { syncInBackground?: boolean; forceReload?: boolean }
  ): Promise<boolean> {
    try {
      onProgress?.('init', 10);

      // Load dataset via DataSyncManager (L1 in-memory -> L2 IndexedDB cache -> Delta check -> L3 Bundled fallback)
      const bundle = await dataSyncManager.loadDataset((prog) => {
        if (prog.stage === 'manifest') onProgress?.('init', 15);
        else if (prog.stage === 'delta_download') {
          onProgress?.('geo', Math.min(55, 20 + Math.round(prog.percentage * 0.35)));
        } else if (prog.stage === 'integrity_check') {
          onProgress?.('geo', 58);
        }
      }, options);

      onProgress?.('analytics', 60);
      this.religionData = bundle.religions;
      this.indexesData = bundle.indexes;
      this.demographicsData = bundle.demographics;

      const rawGeoJson = bundle.geoJson;

      // Clean unrecognised ISO codes
      if (rawGeoJson && Array.isArray(rawGeoJson.features)) {
        rawGeoJson.features = rawGeoJson.features.filter(
          (f: any) =>
            f.properties &&
            f.properties['ISO3166-1-Alpha-3'] &&
            f.properties['ISO3166-1-Alpha-3'] !== '-99'
        );
      }

      // Process GeoJSON, Centroids, Props Map, Search Index, and Continent Aggregations in background worker
      const result = await this.runWorkerProcessing({
        rawGeoJson,
        demographicsMap: this.demographicsData,
        indexMap: this.indexesData,
        religionData: this.religionData,
      });

      this.geoJsonData = result.geoJsonData;
      this.labelsGeoJson = result.labelsGeoJson;
      this.countryPropsMap = result.countryPropsMap || {};

      countrySearchEngine.setIndex(
        result.searchIndex || [],
        result.defaultCountryListUk,
        result.defaultCountryListEn
      );

      if (result.continentStatsCache) {
        this.continentStatsCache.clear();
        Object.entries(result.continentStatsCache).forEach(([k, v]) => {
          this.continentStatsCache.set(k as ContinentName, v as AggregatedContinentStats);
        });
      }

      onProgress?.('engine', 85);
      return true;
    } catch (e) {
      console.error('[DataLoader] Failed to load data:', e);
      onProgress?.('error', 0);
      return false;
    }
  }

  private runWorkerProcessing(payload: any): Promise<any> {
    return new Promise((resolve) => {
      if (typeof Worker !== 'undefined') {
        try {
          const worker = new Worker(new URL('./processWorker.ts', import.meta.url), {
            type: 'module',
          });

          let isResolved = false;
          const safetyTimeout = setTimeout(() => {
            if (!isResolved) {
              isResolved = true;
              console.warn('[DataLoader] Worker timeout (3500ms), falling back to synchronous processing');
              worker.terminate();
              resolve(processGeoData(payload));
            }
          }, 3500);

          worker.onmessage = (e: MessageEvent) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(safetyTimeout);
              worker.terminate();
              resolve(e.data);
            }
          };

          worker.onerror = (err) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(safetyTimeout);
              console.warn('[DataLoader] Worker error, falling back to sync processing:', err);
              worker.terminate();
              resolve(processGeoData(payload));
            }
          };

          worker.postMessage(payload);
          return;
        } catch {
          // Fallback if worker construction is not supported in this runtime
        }
      }
      resolve(processGeoData(payload));
    });
  }
}

export const dataLoader = new DataLoader();

