import React from 'react';
import { TrendingUp, DollarSign, Receipt, Coins, BarChart } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import { useAppStore } from '../../../store/useAppStore';
import { audioManager } from '../../../audio/AudioManager';
import { TerraHaptics } from '../../../native/TerraHaptics';

interface EconomyViewProps {
  countryProps: any;
  continentStats: any;
  isCountry: boolean;
}

export const EconomyView: React.FC<EconomyViewProps> = React.memo(({
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
    const avgGdp = continentStats.avgGdp || 0;
    const avgTax = continentStats.avgTax || 0;
    const topEcon = continentStats.topEconomy || [];

    return (
      <div className="space-y-4 animate-fade-in text-zinc-800 dark:text-zinc-200">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('avg_gdp')}
            </div>
            <div className="text-lg font-extrabold text-emerald-500 mt-0.5">
              ${formatNumber(avgGdp)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('avg_tax')}
            </div>
            <div className="text-lg font-extrabold text-blue-500 mt-0.5">
              {avgTax}%
            </div>
          </div>
        </div>

        {/* Top 5 Economy */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('top_economy_title')}</span>
          </div>

          <div className="space-y-1.5">
            {topEcon.map((c: any, idx: number) => {
              const name = lang === 'uk' ? c.name_uk : c.name_en;
              return (
                <button
                  key={c.iso}
                  onClick={() => handleCountryClick(c.iso, name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-all text-left cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                    ${formatNumber(c.gdp)}
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
    const gdp = countryProps.gdpPerCapita || 0;
    const salary = countryProps.avgSalary || 0;
    const col = countryProps.colIndex || 0;
    const tax = countryProps.incomeTax || 0;
    const macroTax = countryProps.macroTaxRevenue || 0;

    const metrics = [
      {
        icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />,
        label: t('gdp_per_capita'),
        value: gdp > 0 ? `$${formatNumber(gdp)}` : t('no_data'),
        highlight: 'text-emerald-500',
      },
      {
        icon: <DollarSign className="w-3.5 h-3.5 text-blue-500" />,
        label: t('avg_salary'),
        value: salary > 0 ? `$${formatNumber(salary)}` : t('no_data'),
        highlight: 'text-blue-500',
      },
      {
        icon: <BarChart className="w-3.5 h-3.5 text-amber-500" />,
        label: t('col_index'),
        value: col > 0 ? `${col} / 100` : t('no_data'),
        highlight: 'text-amber-500',
      },
      {
        icon: <Receipt className="w-3.5 h-3.5 text-purple-500" />,
        label: `${t('tax_rate')} (${t('pit_abbr')})`,
        value: `${tax}%`,
        highlight: 'text-purple-500',
      },
      {
        icon: <Coins className="w-3.5 h-3.5 text-teal-500" />,
        label: t('tax_macro'),
        value: macroTax > 0 ? `${macroTax}%` : t('no_data'),
        highlight: 'text-teal-500',
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
