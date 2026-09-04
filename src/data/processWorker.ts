import { CountryPropsMerger } from './processors/countryPropsMerger.ts';
import { ContinentStatsAggregator } from './processors/continentStatsAggregator.ts';
import { SearchIndexBuilder } from './processors/searchIndexBuilder.ts';

export function processGeoData({ rawGeoJson, demographicsMap, indexMap, religionData }: any) {
  let parsedGeoJson = rawGeoJson;
  if (rawGeoJson instanceof ArrayBuffer) {
    const decoder = new TextDecoder('utf-8');
    parsedGeoJson = JSON.parse(decoder.decode(rawGeoJson));
  } else if (rawGeoJson instanceof Uint8Array) {
    const decoder = new TextDecoder('utf-8');
    parsedGeoJson = JSON.parse(decoder.decode(rawGeoJson));
  } else if (typeof rawGeoJson === 'string') {
    parsedGeoJson = JSON.parse(rawGeoJson);
  }

  // Clean unrecognised ISO codes
  if (parsedGeoJson && Array.isArray(parsedGeoJson.features)) {
    parsedGeoJson.features = parsedGeoJson.features.filter(
      (f: any) =>
        f.properties &&
        f.properties['ISO3166-1-Alpha-3'] &&
        f.properties['ISO3166-1-Alpha-3'] !== '-99'
    );
  }

  const { validFeatures, labelsFeatures, countryPropsMap } = CountryPropsMerger.processAll(
    parsedGeoJson,
    demographicsMap,
    indexMap,
    religionData
  );

  const { searchIndex, defaultCountryListUk, defaultCountryListEn } =
    SearchIndexBuilder.buildIndex(validFeatures);

  const continentStatsCache = ContinentStatsAggregator.aggregateAll(
    validFeatures,
    religionData,
    demographicsMap
  );

  return {
    geoJsonData: {
      type: 'FeatureCollection' as const,
      features: validFeatures,
    },
    labelsGeoJson: {
      type: 'FeatureCollection' as const,
      features: labelsFeatures,
    },
    countryPropsMap,
    searchIndex,
    defaultCountryListUk,
    defaultCountryListEn,
    continentStatsCache,
  };
}

if (typeof self !== 'undefined' && 'onmessage' in self) {
  self.onmessage = function (e: MessageEvent) {
    const result = processGeoData(e.data);
    self.postMessage(result);
  };
}
