import { CountryPropsMerger } from './processors/countryPropsMerger.ts';
import { ContinentStatsAggregator } from './processors/continentStatsAggregator.ts';
import { SearchIndexBuilder } from './processors/searchIndexBuilder.ts';

export function processGeoData({ rawGeoJson, demographicsMap, indexMap, religionData }: any) {
  const { validFeatures, labelsFeatures, countryPropsMap } = CountryPropsMerger.processAll(
    rawGeoJson,
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
