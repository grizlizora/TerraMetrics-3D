import { useState, useTransition, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useI18nStore } from '../store/useI18nStore';
import { dataLoader } from '../data/DataLoader';
import { dataSyncManager } from '../data/sync/DataSyncManager';
import { audioManager } from '../audio/AudioManager';
import { TerraHaptics } from '../native/TerraHaptics';
import { formatCountrySummary } from '../utils/shareUtils';
import type { ContinentName, ISO3Code } from '../types';

export function useEntityDetails() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const selectedCountryIso = useAppStore((s) => s.selectedCountryIso);
  const selectedCountryName = useAppStore((s) => s.selectedCountryName);
  const selectedContinent = useAppStore((s) => s.selectedContinent);
  const subMode = useAppStore((s) => s.subMode);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);
  const resetToWorld = useAppStore((s) => s.resetToWorld);
  const incrementDataVersion = useAppStore((s) => s.incrementDataVersion);

  const lang = useI18nStore((s) => s.lang);
  const t = useI18nStore((s) => s.t);

  const countryProps = useMemo(
    () => (selectedCountryIso ? dataLoader.getCountryProps(selectedCountryIso) : null),
    [selectedCountryIso, dataVersion]
  );
  const continentStats = useMemo(
    () => (selectedContinent ? dataLoader.getContinentStats(selectedContinent as ContinentName) : null),
    [selectedContinent, dataVersion]
  );
  const isCountry = Boolean(selectedCountryIso);

  const title = useMemo(() => {
    if (selectedCountryIso) {
      return (lang === 'uk' ? countryProps?.name_uk : countryProps?.name_en) || selectedCountryName || selectedCountryIso;
    }
    return (lang === 'uk' ? continentStats?.name_uk : continentStats?.name_en) || t('World');
  }, [selectedCountryIso, countryProps, selectedCountryName, continentStats, lang, t]);

  const subtitle = useMemo(() => {
    if (selectedCountryIso && countryProps) {
      const capital = lang === 'uk' ? countryProps.capital_uk || countryProps.capital : countryProps.capital_en || countryProps.capital;
      const continent = t(countryProps.continent || 'World');
      return `${capital ? `${t('capital')}: ${capital}` : ''}${capital && continent ? ' • ' : ''}${continent || ''}`;
    }
    if (selectedContinent && selectedContinent !== 'World') {
      return t('continent_stats');
    }
    return t('global_stats');
  }, [selectedCountryIso, countryProps, selectedContinent, lang, t]);

  const handleManualSync = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    audioManager.playClick();
    TerraHaptics.mediumImpact();
    try {
      const result = await dataSyncManager.syncNow();
      if (result.updated) {
        await dataLoader.loadAll();
      }
      incrementDataVersion();
      TerraHaptics.success();
      audioManager.playClick();
    } catch {
      TerraHaptics.error();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopySummary = async () => {
    if (copied) return;
    const summary = formatCountrySummary(countryProps, continentStats, isCountry, lang, t, subMode);
    if (typeof navigator !== 'undefined' && navigator.share && window.innerWidth < 768) {
      try {
        await navigator.share({
          title: `TerraMetrics 3D - ${title}`,
          text: summary,
        });
        TerraHaptics.success();
        audioManager.playClick();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        TerraHaptics.success();
        audioManager.playClick();
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      TerraHaptics.error();
    }
  };

  return {
    selectedCountryIso: selectedCountryIso as ISO3Code | null,
    selectedContinent,
    countryProps,
    continentStats,
    isCountry,
    title,
    subtitle,
    isRefreshing,
    copied,
    dataVersion,
    subMode,
    handleManualSync,
    handleCopySummary,
    resetSelection: () => {
      audioManager.playClosePanel();
      TerraHaptics.lightImpact();
      setSelectedCountry(null, null);
    },
    resetToWorld: () => {
      audioManager.playClosePanel();
      TerraHaptics.mediumImpact();
      resetToWorld();
    },
    startTransition,
  };
}
