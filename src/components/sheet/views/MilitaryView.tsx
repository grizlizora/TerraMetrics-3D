import React from 'react';
import { Shield, Swords, TrendingUp, Users } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { useAppStore } from '../../../store/useAppStore';
import { audioManager } from '../../../audio/AudioManager';
import { TerraHaptics } from '../../../native/TerraHaptics';
import type { CountryProperties, AggregatedContinentStats, AggregatedCountryItem } from '../../../types';

interface MilitaryViewProps {
  countryProps: CountryProperties | null;
  continentStats: AggregatedContinentStats | null;
  isCountry: boolean;
}

export const MilitaryView: React.FC<MilitaryViewProps> = React.memo(({
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

  if (!isCountry && continentStats) {
    const totalMil = continentStats.totalMilitary || 0;
    const topMil = continentStats.topMilitary || [];

    return (
      <div className="space-y-4 animate-fade-in text-zinc-800 dark:text-zinc-200">
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('total_military')}
            </div>
            <div className="text-xl font-extrabold text-red-500 mt-0.5">
              {formatNumber(totalMil)}
            </div>
          </div>
          <Shield className="w-6 h-6 text-red-500/80" />
        </div>

        {/* Top 5 Military */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <Swords className="w-3.5 h-3.5 text-red-500" />
            <span>{t('top_military_title')}</span>
          </div>

          <div className="space-y-1.5">
            {topMil.map((c: AggregatedCountryItem, idx: number) => {
              const name = lang === 'uk' ? c.name_uk : c.name_en;
              return (
                <button
                  key={c.iso}
                  onClick={() => handleCountryClick(c.iso, name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-red-500/10 active:bg-red-500/20 transition-all text-left cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-red-500/20 text-red-500 text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-red-500 dark:text-red-400">
                    {formatNumber(c.military || c.military_personnel || 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (isCountry && countryProps) {
    const milSize = countryProps.militarySize || 0;
    const spending = countryProps.militarySpending || 0;
    const pop = countryProps.population || 0;
    const milDensity = pop > 0 && milSize > 0 ? ((milSize / pop) * 1000).toFixed(1) : null;

    const metrics = [
      {
        icon: <Users className="w-3.5 h-3.5 text-red-500" />,
        label: t('military_size'),
        value: milSize > 0 ? formatNumber(milSize) : t('no_data'),
        highlight: 'text-red-500',
      },
      {
        icon: <TrendingUp className="w-3.5 h-3.5 text-amber-500" />,
        label: t('military_spending'),
        value: spending > 0 ? `${spending}%` : t('no_data'),
        highlight: 'text-amber-500',
      },
      {
        icon: <Shield className="w-3.5 h-3.5 text-blue-500" />,
        label: t('military_density'),
        value: milDensity ? `${milDensity}` : t('no_data'),
        highlight: 'text-blue-500',
      },
    ];

    return (
      <div className="space-y-2 animate-fade-in text-zinc-800 dark:text-zinc-200">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 gap-2 min-w-0"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
              {m.icon}
              <span>{m.label}</span>
            </div>
            <div className={`text-xs font-bold ${m.highlight} text-right break-words max-w-[60%]`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="text-xs text-zinc-400 py-4">{t('no_data')}</div>;
});
