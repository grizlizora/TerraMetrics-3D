import React, { useState, useEffect } from 'react';
import { CloudSun, Thermometer, Droplets, Wind, ExternalLink, Activity } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { useAppStore } from '../../../store/useAppStore';
import { audioManager } from '../../../audio/AudioManager';
import { TerraHaptics } from '../../../native/TerraHaptics';
import { ContinentName } from '../../../types';
import { dataLoader } from '../../../data/DataLoader';
import { apiSyncManager } from '../../../data/api/ApiSyncManager';
import { LiveWeatherData } from '../../../data/api/types';

interface ClimateViewProps {
  countryProps: any;
  continentStats: any;
  isCountry: boolean;
}

export const ClimateView: React.FC<ClimateViewProps> = React.memo(({
  countryProps,
  isCountry,
}) => {
  const t = useI18nStore((s) => s.t);
  const lang = useI18nStore((s) => s.lang);
  const selectedContinent = useAppStore((s) => s.selectedContinent);
  const setClimateModalOpen = useAppStore((s) => s.setClimateModalOpen);

  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let lat = 20,
      lng = 20;

    if (isCountry && countryProps && countryProps.center) {
      lng = countryProps.center[0];
      lat = countryProps.center[1];
    } else {
      const contStats = dataLoader.getContinentStats(selectedContinent as ContinentName);
      if (contStats && contStats.climateCoords?.[0]) {
        lng = contStats.climateCoords[0][0];
        lat = contStats.climateCoords[0][1];
      }
    }

    const loadWeather = async () => {
      setLoading(true);
      try {
        const result = await apiSyncManager.getLiveWeather(lat, lng);
        if (active) setWeather(result);
      } catch {
        if (active) {
          setWeather(apiSyncManager.computeMathematicalWeatherFallback(lat, lng));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadWeather();
    return () => {
      active = false;
    };
  }, [countryProps, isCountry, selectedContinent]);

  const handleOpenClimateModal = () => {
    audioManager.playOpenPanel();
    TerraHaptics.mediumImpact();
    setClimateModalOpen(true);
  };

  return (
    <div className="space-y-3.5 animate-fade-in text-zinc-800 dark:text-zinc-200">
      {/* Header status */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <CloudSun className="w-4 h-4 text-amber-500" />
          <span>{t('current_weather')}</span>
        </div>

        {weather ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                weather.isOffline ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-zinc-600 dark:text-zinc-300">
              {weather.isOffline ? t('weather_offline') : t('weather_live')}
            </span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Activity className="w-4 h-4 animate-spin text-blue-500" />
          <span>{t('loading_weather')}</span>
        </div>
      ) : weather ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Temperature */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent border border-amber-500/25 text-center shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Thermometer className="w-3.5 h-3.5" />
              <span>{t('temperature')}</span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-amber-500 mt-1 whitespace-nowrap">
              {weather.temp > 0 ? `+${weather.temp}` : weather.temp}°C
            </div>
          </div>

          {/* Humidity */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/15 via-cyan-500/5 to-transparent border border-blue-500/25 text-center shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Droplets className="w-3.5 h-3.5" />
              <span>{t('humidity')}</span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-blue-500 mt-1 whitespace-nowrap">
              {weather.humidity}%
            </div>
          </div>

          {/* Wind - Strictly whitespace-nowrap to avoid breaking units */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500/15 via-emerald-500/5 to-transparent border border-teal-500/25 text-center shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              <Wind className="w-3.5 h-3.5" />
              <span>{t('wind')}</span>
            </div>
            <div className="flex items-baseline justify-center gap-0.5 mt-1 whitespace-nowrap">
              <span className="text-lg sm:text-xl font-extrabold text-teal-500">{weather.wind}</span>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 opacity-90">
                {t('unit_kmh')}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Button to Open Annual Profile Modal */}
      <button
        onClick={handleOpenClimateModal}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
      >
        <ExternalLink className="w-4 h-4" />
        <span className="text-center">{t('open_annual_climate')}</span>
      </button>
    </div>
  );
});
