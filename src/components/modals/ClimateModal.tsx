import React, { useState, useEffect, useCallback } from 'react';
import { CloudSun, X, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { dataLoader } from '../../data/DataLoader';
import { apiSyncManager } from '../../data/api/ApiSyncManager';
import { ClimateMath, MonthlyClimatePoint } from '../../utils/climateMath';
import { ClimateCurrentCard } from './climate/ClimateCurrentCard';
import { AnnualClimateChart } from './climate/AnnualClimateChart';
import type { ContinentName } from '../../types';

export const ClimateModal: React.FC = React.memo(() => {
  const climateModalOpen = useAppStore((s) => s.climateModalOpen);
  const setClimateModalOpen = useAppStore((s) => s.setClimateModalOpen);
  const selectedCountryIso = useAppStore((s) => s.selectedCountryIso);
  const selectedContinent = useAppStore((s) => s.selectedContinent);

  const t = useI18nStore((s) => s.t);
  const lang = useI18nStore((s) => s.lang);

  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [weatherData, setWeatherData] = useState<{
    name: string;
    temp: number;
    humidity: number;
    wind: number;
    season: string;
    monthly: MonthlyClimatePoint[];
  } | null>(null);

  const handleClose = useCallback(() => {
    audioManager.playClosePanel();
    TerraHaptics.lightImpact();
    setClimateModalOpen(false);
  }, [setClimateModalOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && climateModalOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [climateModalOpen, handleClose]);

  useEffect(() => {
    if (!climateModalOpen) return;

    let active = true;
    const loadClimate = async () => {
      setLoading(true);
      setIsOffline(false);

      let lat = 20, lng = 20;
      let title: string = selectedContinent;

      if (selectedCountryIso) {
        const countryProps = dataLoader.getCountryProps(selectedCountryIso);
        if (countryProps) {
          title =
            lang === 'uk'
              ? countryProps.name_uk || countryProps.name || ''
              : countryProps.name_en || countryProps.name || '';
          if (countryProps.center) {
            lng = countryProps.center[0];
            lat = countryProps.center[1];
          }
        }
      } else {
        const contStats = dataLoader.getContinentStats(selectedContinent as ContinentName);
        if (contStats) {
          title = lang === 'uk' ? contStats.name_uk : contStats.name_en;
          if (contStats.climateCoords?.[0]) {
            lng = contStats.climateCoords[0][0];
            lat = contStats.climateCoords[0][1];
          }
        }
      }

      const monthly = ClimateMath.generateMonthlyTemperatures(lat, lang);
      const monthIdx = new Date().getMonth();
      const season = ClimateMath.getSeasonLabel(lat, monthIdx, lang);

      try {
        const liveWeather = await apiSyncManager.getLiveWeather(lat, lng);
        if (!active) return;

        setWeatherData({
          name: title,
          temp: liveWeather.temp,
          humidity: liveWeather.humidity,
          wind: liveWeather.wind,
          season,
          monthly,
        });
        setIsOffline(liveWeather.isOffline);
      } catch {
        if (active) {
          const fallback = apiSyncManager.computeMathematicalWeatherFallback(lat, lng);
          setWeatherData({
            name: title,
            temp: fallback.temp,
            humidity: fallback.humidity,
            wind: fallback.wind,
            season,
            monthly,
          });
          setIsOffline(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadClimate();
    return () => {
      active = false;
    };
  }, [climateModalOpen, selectedCountryIso, selectedContinent, lang]);

  if (!climateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity cursor-pointer"
      />

      {/* Modal Dialog Body with Liquid Glass */}
      <LiquidGlassPanel
        intensity="high"
        className="relative w-full max-w-lg lg:max-w-4xl max-h-[88vh] overflow-y-auto custom-scrollbar p-4 sm:p-6 z-10 shadow-2xl rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 shadow-xs shrink-0">
              <CloudSun className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div className="min-w-0">
              <div className="text-base sm:text-lg md:text-xl font-extrabold text-zinc-900 dark:text-white truncate">
                {weatherData?.name || t('climate_title')}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400 truncate">
                <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 shrink-0">
                  {weatherData?.season || t('current_weather')}
                </span>
                {isOffline && (
                  <span className="text-amber-500 font-bold shrink-0">• {t('weather_offline')}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label={t('close')}
            title={t('tooltip_close_modal')}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Activity className="w-5 h-5 animate-spin text-amber-500" />
            <span>{t('loading_weather')}</span>
          </div>
        ) : weatherData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
            <ClimateCurrentCard
              temp={weatherData.temp}
              humidity={weatherData.humidity}
              wind={weatherData.wind}
            />
            <AnnualClimateChart monthly={weatherData.monthly} />
          </div>
        ) : null}
      </LiquidGlassPanel>
    </div>
  );
});
