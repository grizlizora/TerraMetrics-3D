import React, { useState } from 'react';
import { Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import type { SubMode } from '../../types';

interface LegendConfig {
  titleUk: string;
  titleEn: string;
  type: 'gradient' | 'categorical';
  gradient?: string;
  minUk?: string;
  minEn?: string;
  maxUk?: string;
  maxEn?: string;
  categories?: Array<{ nameUk: string; nameEn: string; color: string }>;
}

const LEGEND_CONFIGS: Record<SubMode, LegendConfig> = {
  economy: {
    titleUk: 'ВВП на особу',
    titleEn: 'GDP per Capita',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #06b6d4)',
    minUk: '$1,000',
    minEn: '$1,000',
    maxUk: '$75,000+',
    maxEn: '$75,000+',
  },
  population: {
    titleUk: 'Населення',
    titleEn: 'Population',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #1e293b, #0284c7, #3b82f6, #8b5cf6, #d946ef, #f43f5e)',
    minUk: '< 5 млн',
    minEn: '< 5M',
    maxUk: '1.4+ млрд',
    maxEn: '1.4B+',
  },
  demographics: {
    titleUk: 'Індекс Джині (Нерівність)',
    titleEn: 'Gini Index (Inequality)',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #10b981, #06b6d4, #3b82f6, #f59e0b, #ef4444)',
    minUk: '24 (Рівність)',
    minEn: '24 (Equality)',
    maxUk: '55+ (Нерівність)',
    maxEn: '55+ (Inequality)',
  },
  politics: {
    titleUk: 'Індекс демократії',
    titleEn: 'Democracy Index',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #10b981, #06b6d4)',
    minUk: '1.5 (Авторитаризм)',
    minEn: '1.5 (Authoritarian)',
    maxUk: '9.5 (Демократія)',
    maxEn: '9.5 (Democracy)',
  },
  military: {
    titleUk: 'Військові витрати (% ВВП)',
    titleEn: 'Military Spending (% GDP)',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #10b981, #3b82f6, #f59e0b, #ef4444)',
    minUk: '0.5%',
    minEn: '0.5%',
    maxUk: '4.5%+',
    maxEn: '4.5%+',
  },
  geography: {
    titleUk: 'Найвища висота',
    titleEn: 'Highest Elevation',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #10b981, #eab308, #f97316, #8b5cf6, #ffffff)',
    minUk: '200 м',
    minEn: '200 m',
    maxUk: '8,500+ м',
    maxEn: '8,500+ m',
  },
  resources: {
    titleUk: 'Чиста & Ядерна енергія',
    titleEn: 'Clean & Nuclear Energy',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #10b981, #06b6d4)',
    minUk: '5%',
    minEn: '5%',
    maxUk: '95%',
    maxEn: '95%',
  },
  climate: {
    titleUk: 'Кліматична широта',
    titleEn: 'Climate Latitude',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #f97316, #eab308, #10b981, #06b6d4, #3b82f6, #a855f7)',
    minUk: '0° (Тропіки)',
    minEn: '0° (Tropical)',
    maxUk: '80° (Полярний)',
    maxEn: '80° (Polar)',
  },
  religion: {
    titleUk: 'Домінуючі конфесії',
    titleEn: 'Dominant Religions',
    type: 'categorical',
    categories: [
      { nameUk: 'Християнство', nameEn: 'Christianity', color: '#3b82f6' },
      { nameUk: 'Іслам', nameEn: 'Islam', color: '#10b981' },
      { nameUk: 'Індуїзм', nameEn: 'Hinduism', color: '#f59e0b' },
      { nameUk: 'Буддизм', nameEn: 'Buddhism', color: '#ec4899' },
      { nameUk: 'Атеїзм', nameEn: 'Secular/Atheist', color: '#8b5cf6' },
      { nameUk: 'Народні', nameEn: 'Folk/Traditional', color: '#14b8a6' },
      { nameUk: 'Юдаїзм', nameEn: 'Judaism', color: '#6366f1' },
    ],
  },
};

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const subMode = useAppStore((s) => s.subMode);
  const lang = useI18nStore((s) => s.lang);
  const t = useI18nStore((s) => s.t);

  const config = LEGEND_CONFIGS[subMode] || LEGEND_CONFIGS.economy;
  const isUk = lang === 'uk';
  const title = isUk ? config.titleUk : config.titleEn;

  const toggleOpen = () => {
    audioManager.playCategorySelect();
    TerraHaptics.lightImpact();
    setIsOpen(!isOpen);
  };

  return (
    <div
      style={{ contain: 'layout style' }}
      className="fixed bottom-6 right-6 z-20 pointer-events-auto hidden md:block select-none"
    >
      <LiquidGlassPanel
        intensity="high"
        className="p-3 shadow-2xl rounded-2xl transition-all duration-300 max-w-[320px]"
      >
        <button
          onClick={toggleOpen}
          className="w-full flex items-center justify-between gap-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer active:scale-98"
          title={t('legend_toggle')}
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="truncate">{title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          )}
        </button>

        {isOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-black/5 dark:border-white/10 animate-fade-in text-[11px]">
            {config.type === 'gradient' && (
              <div className="space-y-1.5">
                <div
                  className="w-full h-2.5 rounded-full shadow-inner"
                  style={{ background: config.gradient }}
                />
                <div className="flex justify-between font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>{isUk ? config.minUk : config.minEn}</span>
                  <span>{isUk ? config.maxUk : config.maxEn}</span>
                </div>
              </div>
            )}

            {config.type === 'categorical' && config.categories && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                {config.categories.map((c) => (
                  <div key={c.nameEn} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate text-[10px]">
                      {isUk ? c.nameUk : c.nameEn}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </LiquidGlassPanel>
    </div>
  );
};
