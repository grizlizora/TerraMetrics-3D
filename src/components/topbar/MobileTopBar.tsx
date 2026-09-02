import React, { useEffect, useState } from 'react';
import { Search, Sun, Moon, Languages, Globe, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { networkMonitor } from '../../data/api/NetworkMonitor';
import { SpaceMode } from '../../types';

export const MobileTopBar: React.FC = React.memo(() => {
  const projection = useAppStore((s) => s.projection);
  const theme = useAppStore((s) => s.theme);
  const spaceMode = useAppStore((s) => s.spaceMode);
  const toggleProjection = useAppStore((s) => s.toggleProjection);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setSpaceMode = useAppStore((s) => s.setSpaceMode);
  const setProjection = useAppStore((s) => s.setProjection);
  const setTheme = useAppStore((s) => s.setTheme);
  const setSearchModalOpen = useAppStore((s) => s.setSearchModalOpen);

  const lang = useI18nStore((s) => s.lang);
  const toggleLang = useI18nStore((s) => s.toggleLang);
  const t = useI18nStore((s) => s.t);
  const [isOnline, setIsOnline] = useState(networkMonitor.isOnline());

  useEffect(() => {
    return networkMonitor.subscribe((state) => {
      setIsOnline(state.connected);
    });
  }, []);

  const handleOpenSearch = () => {
    audioManager.playOpenPanel();
    TerraHaptics.lightImpact();
    setSearchModalOpen(true);
  };

  const handleToggleProjection = () => {
    if (projection === 'globe') {
      audioManager.playTo2D();
    } else {
      audioManager.playTo3D();
    }
    TerraHaptics.selectionChanged();
    toggleProjection();
  };

  const handleToggleTheme = () => {
    if (theme === 'dark') {
      audioManager.playThemeLight();
    } else {
      audioManager.playThemeDark();
    }
    TerraHaptics.lightImpact();
    toggleTheme();
  };

  const handleToggleLang = () => {
    audioManager.playLanguageChange();
    TerraHaptics.lightImpact();
    toggleLang();
  };

  const handleToggleSpace = () => {
    if (theme !== 'dark') {
      setTheme('dark');
      audioManager.playThemeDark();
    }
    if (projection !== 'globe') {
      setProjection('globe');
      audioManager.playTo3D();
    }

    const next: SpaceMode = spaceMode === 'none' ? 'basic' : 'none';
    audioManager.playSwitchCategory();
    TerraHaptics.modeSwitched();
    setSpaceMode(next);
  };

  const isSpaceActive = spaceMode !== 'none';

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none px-2 sm:px-4 pt-[calc(var(--sat)+8px)] flex items-center justify-between gap-1 sm:gap-2 select-none">
      {/* Search Capsule Button */}
      <div className="flex-1 min-w-0 max-w-xs sm:max-w-md pointer-events-auto">
        <LiquidGlassPanel
          intensity="high"
          onClick={handleOpenSearch}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenSearch();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={t('search_placeholder')}
          className="h-9 sm:h-11 px-2.5 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 rounded-full cursor-pointer hover:border-blue-500/40 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none active:scale-[0.98] transition-all shadow-lg group"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.4} />
          <span className="flex-1 min-w-0 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 truncate">
            {t('search_placeholder')}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
              title={isOnline ? t('status_online') : t('status_offline')}
              aria-label={isOnline ? t('status_online') : t('status_offline')}
            />
          </div>
        </LiquidGlassPanel>
      </div>

      {/* Action Controls Cluster */}
      <div className="pointer-events-auto flex items-center shrink-0">
        <LiquidGlassPanel
          intensity="high"
          className="p-0.5 sm:p-1 flex items-center gap-0.5 sm:gap-1 rounded-full shadow-lg"
        >
          {/* 3D / 2D Projection Toggle */}
          <button
            type="button"
            onClick={handleToggleProjection}
            aria-label={projection === 'globe' ? t('tooltip_switch_2d') : t('tooltip_switch_3d')}
            aria-pressed={projection === 'globe'}
            className="h-8 sm:h-9 px-2 sm:px-2.5 min-w-[34px] sm:min-w-[42px] rounded-full flex items-center justify-center gap-1 text-[11px] sm:text-xs font-extrabold text-zinc-800 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none active:scale-95 transition-all cursor-pointer"
            title={projection === 'globe' ? t('tooltip_switch_2d') : t('tooltip_switch_3d')}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" strokeWidth={2.2} />
            <span>{projection === 'globe' ? '3D' : '2D'}</span>
          </button>

          <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/15" />

          {/* Stars Mode Quick Toggle */}
          <button
            type="button"
            onClick={handleToggleSpace}
            aria-label={isSpaceActive ? t('tooltip_space_disable') || 'Зорі ввімкнено' : t('tooltip_space_enable') || 'Увімкнути зорі'}
            aria-pressed={isSpaceActive}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all cursor-pointer relative ${
              isSpaceActive
                ? 'bg-blue-600/25 text-blue-400 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.35)]'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={isSpaceActive ? t('tooltip_space_disable') || 'Зорі ввімкнено' : t('tooltip_space_enable') || 'Увімкнути зорі'}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" strokeWidth={2.2} />
            {isSpaceActive && (
              <span className="absolute bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>

          <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/15" />

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? t('tooltip_light_theme') : t('tooltip_dark_theme')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-zinc-800 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none active:scale-95 transition-all cursor-pointer"
            title={theme === 'dark' ? t('tooltip_light_theme') : t('tooltip_dark_theme')}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" strokeWidth={2.2} />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" strokeWidth={2.2} />
            )}
          </button>

          <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/15" />

          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={handleToggleLang}
            aria-label={t('tooltip_lang_switch')}
            className="h-8 sm:h-9 px-2 sm:px-2.5 min-w-[32px] sm:min-w-[40px] rounded-full flex items-center justify-center gap-0.5 text-[11px] sm:text-xs font-extrabold text-zinc-800 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none active:scale-95 transition-all cursor-pointer"
            title={t('tooltip_lang_switch')}
          >
            <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" strokeWidth={2.2} />
            <span>{lang.toUpperCase()}</span>
          </button>
        </LiquidGlassPanel>
      </div>
    </header>
  );
});
