import React from 'react';
import { TrendingUp, Award, Users } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { useAppStore } from '../../../store/useAppStore';
import { audioManager } from '../../../audio/AudioManager';
import { TerraHaptics } from '../../../native/TerraHaptics';
import { dataLoader } from '../../../data/DataLoader';
import { getCountryFlag } from '../../../utils/flagUtils';

interface PopulationViewProps {
  countryProps: any;
  continentStats: any;
  isCountry: boolean;
}

export const PopulationView: React.FC<PopulationViewProps> = React.memo(({
  countryProps,
  continentStats,
  isCountry,
}) => {
  const t = useI18nStore((s) => s.t);
  const formatNumber = useI18nStore((s) => s.formatNumber);
  const lang = useI18nStore((s) => s.lang);

  const handleCountryClick = (iso: string, name: string) => {
    audioManager.playSelectCountry();
    TerraHaptics.countrySelected();
    useAppStore.getState().setSelectedCountry(iso, name);
  };

  if (isCountry && countryProps) {
    const pop = countryProps.population || 0;
    const area = countryProps.areaKm2 || countryProps.area || 0;
    const density = countryProps.density || (pop > 0 && area > 0 ? Math.round(pop / area) : 0);
    const actualContStats = countryProps?.continent
      ? dataLoader.getContinentStats(countryProps.continent)
      : continentStats;
    const continentPop = actualContStats?.total_population || continentStats?.total_population || 0;
    const shareOfContinent = continentPop > 0 && pop > 0 ? ((pop / continentPop) * 100).toFixed(1) : null;

    // Calculate rank in continent
    const isoCode = countryProps?.['ISO3166-1-Alpha-3'] || countryProps?.iso || '';
    const contIsoCodes: string[] = actualContStats?.isoCodes || [];
    let rankInContinent: number | null = null;
    if (contIsoCodes.length > 0 && isoCode) {
      const sortedByPop = contIsoCodes
        .map((code) => ({ code, p: dataLoader.getCountryProps(code)?.population || 0 }))
        .sort((a, b) => b.p - a.p);
      const idx = sortedByPop.findIndex((x) => x.code === isoCode);
      if (idx !== -1) rankInContinent = idx + 1;
    }

    return (
      <div className="space-y-2.5 animate-fade-in text-zinc-800 dark:text-zinc-200">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 min-w-0 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
              {t('total_pop')}
            </span>
            <div className="text-base sm:text-lg font-extrabold text-blue-500 mt-1 truncate">
              {formatNumber(pop)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 min-w-0 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
              {t('density')}
            </span>
            <div className="text-base sm:text-lg font-extrabold text-emerald-500 mt-1 truncate">
              {density > 0 ? `${formatNumber(density)} ${t('people_per_km2')}` : t('no_data')}
            </div>
          </div>
        </div>

        {/* Rank & Regional Share Card */}
        {rankInContinent && (
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg select-none shrink-0">{getCountryFlag(isoCode)}</span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                  {countryProps.continent ? `${t(countryProps.continent)} ${t('rank') || 'Rank'}` : t('rank') || 'Rank'}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-indigo-500 truncate">
                  #{rankInContinent} / {contIsoCodes.length}
                </div>
              </div>
            </div>
            {shareOfContinent && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {shareOfContinent}% {t('share_of_continent')}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (continentStats) {
    const totalPop = continentStats.total_population || 0;
    const topPop = continentStats.top_populated || [];

    return (
      <div className="space-y-4 animate-fade-in text-zinc-800 dark:text-zinc-200">
        {/* Population Header Card */}
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
              {t('total_pop')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
              {continentStats.isoCodes?.length || 0} {t('sample_countries')}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-500 truncate">
            {formatNumber(totalPop)}
          </div>
        </div>

        {/* Top 5 Populated */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('top_countries')}</span>
          </div>

          <div className="space-y-1.5">
            {topPop.map((c: any, idx: number) => {
              const name = lang === 'uk' ? c.name_uk : c.name_en;
              return (
                <button
                  key={c.iso}
                  onClick={() => handleCountryClick(c.iso, name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 active:bg-blue-500/20 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-500/20 text-blue-500 text-[10px] font-extrabold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm select-none shrink-0">{getCountryFlag(c.iso)}</span>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-500 dark:text-blue-400 shrink-0 ml-2">
                    {formatNumber(c.population)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-xs text-zinc-400 py-4">{t('no_data')}</div>;
});
