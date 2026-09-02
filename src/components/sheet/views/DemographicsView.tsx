import React from 'react';
import { Landmark, Languages, Coins, Car, Map, PieChart } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { pluralize, PLURAL_COUNTRIES } from '../../../utils/pluralUtils';
import type { CountryProperties, AggregatedContinentStats } from '../../../types';

interface DemographicsViewProps {
  countryProps: CountryProperties | null;
  continentStats: AggregatedContinentStats | null;
  isCountry: boolean;
}

export const DemographicsView: React.FC<DemographicsViewProps> = React.memo(({
  countryProps,
  continentStats,
  isCountry,
}) => {
  const t = useI18nStore((s) => s.t);
  const formatNumber = useI18nStore((s) => s.formatNumber);
  const lang = useI18nStore((s) => s.lang);

  if (isCountry && countryProps) {
    const areaVal = countryProps.areaKm2 || countryProps.area;
    const drivingSideVal = countryProps.drivingSide
      ? countryProps.drivingSide === 'right'
        ? t('right')
        : countryProps.drivingSide === 'left'
        ? t('left')
        : t(countryProps.drivingSide)
      : t('no_data');

    const capitalVal =
      lang === 'uk'
        ? countryProps.capital_uk || countryProps.capital
        : countryProps.capital_en || countryProps.capital;
    const languagesVal =
      lang === 'uk'
        ? countryProps.languages_uk || countryProps.languages
        : countryProps.languages_en || countryProps.languages;
    const currencyVal =
      lang === 'uk'
        ? countryProps.currency_uk || countryProps.currency
        : countryProps.currency_en || countryProps.currency;

    const items = [
      {
        icon: <Landmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />,
        label: t('capital'),
        value: capitalVal || t('no_data'),
      },
      {
        icon: <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
        label: t('languages'),
        value: languagesVal || t('no_data'),
      },
      {
        icon: <PieChart className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
        label: t('gini'),
        value: countryProps.gini !== null && countryProps.gini !== undefined ? `${countryProps.gini}` : t('no_data'),
      },
      {
        icon: <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
        label: t('currency'),
        value: currencyVal || t('no_data'),
      },
      {
        icon: <Car className="w-3.5 h-3.5 text-purple-500 shrink-0" />,
        label: t('driving_side'),
        value: drivingSideVal,
      },
      {
        icon: <Map className="w-3.5 h-3.5 text-teal-500 shrink-0" />,
        label: t('area'),
        value: areaVal ? `${formatNumber(Math.round(areaVal))} ${t('unit_sqkm')}` : t('no_data'),
      },
    ];

    return (
      <div className="space-y-2 animate-fade-in text-zinc-800 dark:text-zinc-200">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 gap-2"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <div
              title={typeof item.value === 'string' ? item.value : undefined}
              className="text-xs font-bold text-zinc-900 dark:text-white text-right break-words line-clamp-2 max-w-[65%]"
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (continentStats) {
    const avgGini = continentStats.avgGini || 0;
    const totalArea = continentStats.totalArea || 0;
    const rightPct = continentStats.rightDrivePct || 0;
    const leftPct = continentStats.leftDrivePct || 0;

    return (
      <div className="space-y-3 animate-fade-in text-zinc-800 dark:text-zinc-200">
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
              {t('avg_gini')}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-amber-500 mt-0.5 truncate">
              {avgGini > 0 ? avgGini : t('no_data')}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
              {t('total_area')}
            </div>
            <div className="text-base sm:text-lg font-extrabold text-teal-500 mt-0.5 truncate max-w-full">
              {formatNumber(Math.round(totalArea))} <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{t('unit_sqkm')}</span>
            </div>
          </div>
        </div>

        {/* Driving Side Distribution */}
        <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <Car className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>{t('driving_side')}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold pt-1">
            <span className="text-emerald-500">{t('right')}: {rightPct}%</span>
            <span className="text-blue-500">{t('left')}: {leftPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${rightPct}%` }} />
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${leftPct}%` }} />
          </div>
        </div>

        {/* Top Currencies (Continent Mode) */}
        {continentStats.topCurrencies && continentStats.topCurrencies.length > 0 && (
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{t('top_currencies')}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {continentStats.topCurrencies.slice(0, 4).map((c: { name_uk?: string; name_en?: string; name?: string; currency?: string; count: number }, idx: number) => {
                const curName =
                  (lang === 'uk' ? c.name_uk || c.name : c.name_en || c.name || c.name_uk) ||
                  c.currency ||
                  '';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs gap-3 min-w-0"
                  >
                    <span
                      className="font-semibold text-zinc-700 dark:text-zinc-300 truncate min-w-0 flex-1 text-left"
                      title={curName}
                    >
                      {curName}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap text-right">
                      {pluralize(c.count, lang, PLURAL_COUNTRIES)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-xs text-zinc-400 py-4">{t('no_data')}</div>;
});
