import React from 'react';
import { Scale, Landmark, ShieldAlert, HeartPulse, Award } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { useAppStore } from '../../../store/useAppStore';
import { audioManager } from '../../../audio/AudioManager';
import { TerraHaptics } from '../../../native/TerraHaptics';

interface PoliticsViewProps {
  countryProps: any;
  continentStats: any;
  isCountry: boolean;
}

export const PoliticsView: React.FC<PoliticsViewProps> = React.memo(({
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
    const avgDemoc = continentStats.avgDemocracy || 0;
    const avgSafety = continentStats.avgSafety || 0;
    const topDemoc = continentStats.topDemocracy || [];

    return (
      <div className="space-y-4 animate-fade-in text-zinc-800 dark:text-zinc-200">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('democracy_index')} {t('avg_suffix')}
            </div>
            <div className="text-lg font-extrabold text-blue-500 mt-0.5">
              {avgDemoc} / 10
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('safety_index')} {t('avg_suffix')}
            </div>
            <div className="text-lg font-extrabold text-emerald-500 mt-0.5">
              {avgSafety} / 100
            </div>
          </div>
        </div>

        {/* Top 5 Democracy */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('top_democracy_title')}</span>
          </div>

          <div className="space-y-1.5">
            {topDemoc.map((c: any, idx: number) => {
              const name = lang === 'uk' ? c.name_uk : c.name_en;
              return (
                <button
                  key={c.iso}
                  onClick={() => handleCountryClick(c.iso, name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 active:bg-blue-500/20 transition-all text-left cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-500/20 text-blue-500 text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-500 dark:text-blue-400">
                    {c.democracy} / 10
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
    const democ = countryProps.democracyIndex || 0;
    const system = countryProps.politicalSystem ? t(countryProps.politicalSystem) : t('no_data');
    const safety = countryProps.safetyIndex || 0;
    const health = countryProps.healthcareIndex || 0;

    const metrics = [
      {
        icon: <Scale className="w-3.5 h-3.5 text-blue-500" />,
        label: t('democracy_index'),
        value: democ > 0 ? `${democ} / 10` : t('no_data'),
        highlight: 'text-blue-500',
      },
      {
        icon: <Landmark className="w-3.5 h-3.5 text-indigo-500" />,
        label: t('political_system'),
        value: system,
        highlight: 'text-indigo-500',
      },
      {
        icon: <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />,
        label: t('safety_index'),
        value: safety > 0 ? `${safety} / 100` : t('no_data'),
        highlight: 'text-emerald-500',
      },
      {
        icon: <HeartPulse className="w-3.5 h-3.5 text-rose-500" />,
        label: t('healthcare_index'),
        value: health > 0 ? `${health} / 100` : t('no_data'),
        highlight: 'text-rose-500',
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
            <div
              title={typeof m.value === 'string' ? m.value : undefined}
              className={`font-bold ${m.highlight} text-right break-words max-w-[62%] ${
                typeof m.value === 'string' && m.value.length > 28
                  ? 'text-[11px] leading-tight'
                  : 'text-xs'
              }`}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="text-xs text-zinc-400 py-4">{t('no_data')}</div>;
});
