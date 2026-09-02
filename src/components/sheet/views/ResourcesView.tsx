import React from 'react';
import { Zap, Wifi, Car, TrendingUp } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { useAppStore } from '../../../store/useAppStore';
import { audioManager } from '../../../audio/AudioManager';
import { TerraHaptics } from '../../../native/TerraHaptics';

interface ResourcesViewProps {
  countryProps: any;
  continentStats: any;
  isCountry: boolean;
}

export const ResourcesView: React.FC<ResourcesViewProps> = React.memo(({
  countryProps,
  continentStats,
  isCountry,
}) => {
  const t = useI18nStore((s) => s.t);
  const lang = useI18nStore((s) => s.lang);

  const handleCountryClick = (iso: string, name: string) => {
    audioManager.playSelectCountry();
    TerraHaptics.countrySelected();
    useAppStore.getState().setSelectedCountry(iso, name);
  };

  if (!isCountry && continentStats) {
    const avgClean = continentStats.avgCleanEnergy || 0;
    const avgNet = continentStats.avgInternet || 0;
    const topNet = continentStats.topInternet || [];

    return (
      <div className="space-y-4 animate-fade-in text-zinc-800 dark:text-zinc-200">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('clean_energy')} {t('avg_suffix')}
            </div>
            <div className="text-lg font-extrabold text-emerald-500 mt-0.5">
              {avgClean}%
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('internet_speed')} {t('avg_suffix')}
            </div>
            <div className="text-lg font-extrabold text-cyan-500 mt-0.5">
              {avgNet} {t('unit_mbps')}
            </div>
          </div>
        </div>

        {/* Top 5 Internet Speed */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
            <span>{t('top_internet_title')}</span>
          </div>

          <div className="space-y-1.5">
            {topNet.map((c: any, idx: number) => {
              const name = lang === 'uk' ? c.name_uk : c.name_en;
              return (
                <button
                  key={c.iso}
                  onClick={() => handleCountryClick(c.iso, name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-cyan-500/10 active:bg-cyan-500/20 transition-all text-left cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-cyan-500/20 text-cyan-500 text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-cyan-500 dark:text-cyan-400">
                    {c.internetSpeed} {t('unit_mbps')}
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
    const energy = countryProps.cleanEnergy || 0;
    const ev = countryProps.evIndex || 0;
    const internet = countryProps.internetSpeed || 0;

    const metrics = [
      {
        icon: <Wifi className="w-3.5 h-3.5 text-cyan-500" />,
        label: t('internet_speed'),
        value: internet > 0 ? `${internet} ${t('unit_mbps')}` : t('no_data'),
        highlight: 'text-cyan-500',
      },
      {
        icon: <Zap className="w-3.5 h-3.5 text-emerald-500" />,
        label: t('clean_energy'),
        value: energy > 0 ? `${energy}%` : t('no_data'),
        highlight: 'text-emerald-500',
      },
      {
        icon: <Car className="w-3.5 h-3.5 text-blue-500" />,
        label: t('ev_index'),
        value: ev > 0 ? `${ev} / 100` : t('no_data'),
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
