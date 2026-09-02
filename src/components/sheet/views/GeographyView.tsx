import React from 'react';
import { Maximize, Mountain, Compass, Map } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useI18nStore } from '../../../store/useI18nStore';
import { audioManager } from '../../../audio/AudioManager';
import { TerraHaptics } from '../../../native/TerraHaptics';
import type { CountryProperties, AggregatedContinentStats, AggregatedCountryItem } from '../../../types';

interface GeographyViewProps {
  countryProps: CountryProperties | null;
  continentStats: AggregatedContinentStats | null;
  isCountry: boolean;
}

export const GeographyView: React.FC<GeographyViewProps> = React.memo(({
  countryProps,
  continentStats,
  isCountry,
}) => {
  const t = useI18nStore((s) => s.t);
  const lang = useI18nStore((s) => s.lang);
  const formatNumber = useI18nStore((s) => s.formatNumber);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);

  const handleCountryClick = (iso: string, countryName?: string) => {
    audioManager.playClick();
    TerraHaptics.lightImpact();
    setSelectedCountry(iso, countryName);
  };

  const highestPeak = isCountry ? countryProps?.highestPeak : null;
  const area = isCountry ? countryProps?.areaKm2 || countryProps?.area : continentStats?.totalArea;
  const borders = isCountry ? countryProps?.borderLength : continentStats?.totalBorders;

  return (
    <div className="space-y-3.5 animate-fade-in text-zinc-800 dark:text-zinc-200">
      {/* Metrics Grid */}
      {isCountry ? (
        <div className="space-y-2">
          {/* Top Row: Area and Highest Peak */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Area Card */}
            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <Maximize className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="truncate">{t('area')}</span>
              </div>
              <div className="text-sm sm:text-base md:text-lg font-extrabold text-teal-500 mt-1 truncate max-w-full">
                {formatNumber(Math.round(area || 0))} <span className="text-[10px] sm:text-xs font-bold text-teal-600 dark:text-teal-400">{t('unit_sqkm')}</span>
              </div>
            </div>

            {/* Highest Peak Card */}
            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <Mountain className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{t('highest_peak')}</span>
              </div>
              <div className="text-sm sm:text-base md:text-lg font-extrabold text-amber-500 mt-1 truncate max-w-full">
                {highestPeak
                  ? `${formatNumber(Math.round(highestPeak))} ${t('unit_m')}`
                  : t('no_data')}
              </div>
            </div>
          </div>

          {/* Bottom Row: Borders Length (Full width banner to prevent clipping) */}
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{t('borders_length')}</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-blue-500 truncate">
              {borders != null && borders > 0
                ? `${formatNumber(Math.round(borders))} ${t('unit_km')}`
                : borders === 0
                ? '0 ' + t('unit_km')
                : t('no_data')}
            </div>
          </div>
        </div>
      ) : (
        /* Continent / World Mode: 2 Columns */
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <Maximize className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="truncate">{t('total_area')}</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-teal-500 mt-1 truncate max-w-full">
              {formatNumber(Math.round(area || 0))} <span className="text-[10px] sm:text-xs font-bold text-teal-600 dark:text-teal-400">{t('unit_sqkm')}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <Map className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{t('total_borders')}</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-blue-500 mt-1 truncate max-w-full">
              {`${formatNumber(Math.round(borders || 0))} ${t('unit_km')}`}
            </div>
          </div>
        </div>
      )}

      {/* Top Countries by Area (When viewing continent/world) */}
      {!isCountry && continentStats?.topArea && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 px-1">
            <Compass className="w-3.5 h-3.5 text-teal-500" />
            <span>{t('top_area_title')}</span>
          </div>
          <div className="space-y-1.5">
            {continentStats.topArea.map((c: AggregatedCountryItem, index: number) => {
              const name = lang === 'uk' ? c.name_uk : c.name_en;
              return (
                <button
                  key={c.iso}
                  onClick={() => handleCountryClick(c.iso, name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[11px] font-extrabold shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 shrink-0">
                    {formatNumber(Math.round(c.area || c.area_sq_km || 0))} {t('unit_sqkm')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

GeographyView.displayName = 'GeographyView';
