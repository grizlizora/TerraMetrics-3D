import React from 'react';
import { Sparkles, PieChart } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { ProgressBar } from '../../common/ProgressBar';

interface ReligionViewProps {
  countryProps: any;
  continentStats: any;
  isCountry: boolean;
}

const religionColors: Record<string, string> = {
  'Християнство': 'bg-blue-500',
  'Іслам': 'bg-emerald-500',
  'Індуїзм': 'bg-amber-500',
  'Буддизм': 'bg-pink-500',
  'Атеїзм/Нерелігійні': 'bg-purple-500',
  'Народні вірування': 'bg-teal-500',
  'Юдаїзм': 'bg-indigo-500',
  'Інші': 'bg-zinc-500',
};

export const ReligionView: React.FC<ReligionViewProps> = React.memo(({
  countryProps,
  continentStats,
  isCountry,
}) => {
  const t = useI18nStore((s) => s.t);
  const lang = useI18nStore((s) => s.lang);

  const data = isCountry ? countryProps : continentStats;
  if (!data) return <div className="text-xs text-zinc-400 py-4">{t('no_data')}</div>;

  const dominant = data.dominant_religion ? t(data.dominant_religion) : t('no_data');
  const dominantPct = data.dominant_percentage || 0;
  const stats: Array<{ name: string; percentage: number }> = data.stats || [];

  return (
    <div className="space-y-4 animate-fade-in text-zinc-800 dark:text-zinc-200">
      {/* Dominant Religion Banner */}
      <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t('dominant_religion')}
          </div>
          <div className="text-base font-extrabold text-blue-500 dark:text-blue-400 mt-0.5">
            {dominant}
          </div>
        </div>
        <div className="text-xl font-extrabold text-zinc-900 dark:text-white">
          {dominantPct}%
        </div>
      </div>

      {/* Distribution Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          <PieChart className="w-3.5 h-3.5 text-blue-500" />
          <span>{t('religion_distribution')}</span>
        </div>

        <div className="space-y-2.5">
          {stats.length > 0 ? (
            stats.map((s, idx) => {
              const barColor = religionColors[s.name] || 'bg-zinc-500';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700 dark:text-zinc-300">{t(s.name)}</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{s.percentage}%</span>
                  </div>
                  <ProgressBar value={s.percentage} colorClass={barColor} />
                </div>
              );
            })
          ) : (
            <div className="text-xs text-zinc-400 py-2">{t('no_data')}</div>
          )}
        </div>
      </div>
    </div>
  );
});
