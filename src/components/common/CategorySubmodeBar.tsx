import React, { useTransition } from 'react';
import {
  Users, Building2, Trees, Sparkles, Shield, Coins, CloudSun, Mountain, Zap, BookOpen
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import type { MacroCategory, SubMode } from '../../types';

export const CATEGORIES: Array<{ id: MacroCategory; labelKey: string; icon: React.ReactNode }> = [
  { id: 'society', labelKey: 'cat_society', icon: <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> },
  { id: 'state', labelKey: 'cat_state', icon: <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> },
  { id: 'nature', labelKey: 'cat_nature', icon: <Trees className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> },
];

export const SUBMODES_BY_CATEGORY: Record<MacroCategory, Array<{ id: SubMode; labelKey: string; icon: React.ReactNode }>> = {
  society: [
    { id: 'religion', labelKey: 'mode_religion', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'population', labelKey: 'mode_population', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'demographics', labelKey: 'mode_demographics', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ],
  state: [
    { id: 'economy', labelKey: 'mode_economy', icon: <Coins className="w-3.5 h-3.5" /> },
    { id: 'politics', labelKey: 'mode_politics', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'military', labelKey: 'mode_military', icon: <Shield className="w-3.5 h-3.5" /> },
  ],
  nature: [
    { id: 'climate', labelKey: 'mode_climate', icon: <CloudSun className="w-3.5 h-3.5" /> },
    { id: 'geography', labelKey: 'mode_geography', icon: <Mountain className="w-3.5 h-3.5" /> },
    { id: 'resources', labelKey: 'mode_resources', icon: <Zap className="w-3.5 h-3.5" /> },
  ],
};

interface CategorySubmodeBarProps {
  variant?: 'desktop' | 'mobile';
}

export const CategorySubmodeBar: React.FC<CategorySubmodeBarProps> = React.memo(({ variant = 'desktop' }) => {
  const category = useAppStore((s) => s.category);
  const setCategory = useAppStore((s) => s.setCategory);
  const subMode = useAppStore((s) => s.subMode);
  const setSubMode = useAppStore((s) => s.setSubMode);
  const t = useI18nStore((s) => s.t);
  const [, startTransition] = useTransition();

  const handleSelectCategory = (cat: MacroCategory) => {
    if (category === cat) return;
    audioManager.playSwitchCategory();
    TerraHaptics.selectionChanged();
    startTransition(() => setCategory(cat));
  };

  const handleSelectSubmode = (sub: SubMode) => {
    if (subMode === sub) return;
    audioManager.playClick();
    TerraHaptics.lightImpact();
    startTransition(() => setSubMode(sub));
  };

  const isMobile = variant === 'mobile';

  return (
    <div className="flex flex-col gap-2.5">
      {/* Macro Category Tabs */}
      <div
        onTouchStart={(e) => isMobile && e.stopPropagation()}
        onTouchMove={(e) => isMobile && e.stopPropagation()}
        onTouchEnd={(e) => isMobile && e.stopPropagation()}
        className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 ${isMobile ? 'sm:rounded-full' : ''}`}
      >
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer min-w-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <span className="shrink-0">{cat.icon}</span>
              <span className="truncate">{t(cat.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Submode Pills */}
      <div
        onTouchStart={(e) => isMobile && e.stopPropagation()}
        onTouchMove={(e) => isMobile && e.stopPropagation()}
        onTouchEnd={(e) => isMobile && e.stopPropagation()}
        style={{ touchAction: 'pan-x' }}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
      >
        {SUBMODES_BY_CATEGORY[category].map((sub) => {
          const isActive = subMode === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => handleSelectSubmode(sub.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer border ${
                isActive
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 shadow-sm font-bold'
                  : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-transparent hover:border-black/10 dark:hover:border-white/10'
              }`}
            >
              <span className="shrink-0">{sub.icon}</span>
              <span>{t(sub.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
