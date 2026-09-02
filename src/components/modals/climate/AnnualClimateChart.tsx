import React from 'react';
import { useI18nStore } from '../../../store/useI18nStore';
import type { MonthlyClimatePoint } from '../../../utils/climateMath';

interface AnnualClimateChartProps {
  monthly: MonthlyClimatePoint[];
}

export const AnnualClimateChart: React.FC<AnnualClimateChartProps> = React.memo(({ monthly }) => {
  const t = useI18nStore((s) => s.t);

  const temps = monthly.map((m) => m.temp);
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 35;
  const minTemp = temps.length > 0 ? Math.min(...temps) : -10;
  const avgTemp = temps.length > 0 ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : 18;
  const tempRange = Math.max(8, maxTemp - minTemp);

  return (
    <div className="lg:col-span-7 p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between space-y-2.5">
      <div className="flex items-center justify-between flex-wrap gap-1.5 pb-1 border-b border-black/5 dark:border-white/5">
        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          {t('annual_temp')}
        </div>
        {/* Min / Avg / Max Summary */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
          <span>{t('min_temp')}: <b className="text-cyan-500">{minTemp > 0 ? `+${minTemp}` : minTemp}°</b></span>
          <span>{t('avg_temp')}: <b className="text-emerald-500">{avgTemp > 0 ? `+${avgTemp}` : avgTemp}°</b></span>
          <span>{t('max_temp')}: <b className="text-amber-500">{maxTemp > 0 ? `+${maxTemp}` : maxTemp}°</b></span>
        </div>
      </div>

      {/* 12-Month Responsive Grid Container */}
      <div className="h-32 sm:h-36 grid grid-cols-12 gap-0.5 sm:gap-1 pt-2 items-end w-full">
        {monthly.map((m, idx) => {
          const normalizedHeight = Math.max(14, ((m.temp - minTemp) / tempRange) * 100);

          let barClass = 'bg-gradient-to-t from-blue-600 to-cyan-400';
          if (m.temp >= 25) {
            barClass = 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]';
          } else if (m.temp >= 14) {
            barClass = 'bg-gradient-to-t from-teal-500 to-emerald-400';
          } else if (m.temp < 0) {
            barClass = 'bg-gradient-to-t from-indigo-700 to-blue-500';
          }

          return (
            <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end min-w-0 w-full group">
              <span className="text-[8px] sm:text-[9px] font-extrabold text-zinc-800 dark:text-zinc-200 whitespace-nowrap leading-none text-center">
                {m.temp > 0 ? `+${m.temp}` : m.temp}°
              </span>
              <div
                className={`w-full max-w-[18px] sm:max-w-[26px] mx-auto rounded-t-xs sm:rounded-t-sm transition-all duration-300 group-hover:brightness-125 ${barClass}`}
                style={{ height: `${normalizedHeight}%` }}
              />
              <span className="text-[8px] sm:text-[9px] font-semibold text-zinc-600 dark:text-zinc-400 leading-none tracking-tight truncate w-full text-center">
                {m.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
