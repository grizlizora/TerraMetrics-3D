import React from 'react';
import { Droplets, Wind } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';

interface ClimateCurrentCardProps {
  temp: number;
  humidity: number;
  wind: number;
}

export const ClimateCurrentCard: React.FC<ClimateCurrentCardProps> = React.memo(({
  temp,
  humidity,
  wind,
}) => {
  const t = useI18nStore((s) => s.t);

  return (
    <div className="lg:col-span-5 flex flex-col justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t('current_weather')}
        </span>
        <span className="text-2xl sm:text-3xl font-black text-amber-500">
          {temp > 0 ? `+${temp}` : temp}°C
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
            <Droplets className="w-3.5 h-3.5 shrink-0" />
            <span>{t('humidity')}</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-blue-500 mt-0.5">
            {humidity}%
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400">
            <Wind className="w-3.5 h-3.5 shrink-0" />
            <span>{t('wind')}</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-teal-500 mt-0.5">
            {wind} <span className="text-[10px] font-normal">{t('unit_kmh')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
