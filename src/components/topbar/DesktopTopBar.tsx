import React from 'react';
import { Search, Globe, Sun, Moon, Map, Camera } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { DesktopSpaceSwitcher } from './DesktopSpaceSwitcher';
import { networkMonitor } from '../../data/api/NetworkMonitor';
import { isInteractiveElement } from '../../utils/domUtils';
import { exportMapToPNG } from '../../utils/exportUtils';

export const DesktopTopBar: React.FC = React.memo(() => {
  const projection = useAppStore((s) => s.projection);
  const theme = useAppStore((s) => s.theme);
  const selectedCountryIso = useAppStore((s) => s.selectedCountryIso);
  const setProjection = useAppStore((s) => s.setProjection);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setSearchModalOpen = useAppStore((s) => s.setSearchModalOpen);
  const resetToWorld = useAppStore((s) => s.resetToWorld);

  const lang = useI18nStore((s) => s.lang);
  const setLang = useI18nStore((s) => s.setLang);
  const t = useI18nStore((s) => s.t);
  const [isOnline, setIsOnline] = React.useState(networkMonitor.isOnline());

  React.useEffect(() => {
    return networkMonitor.subscribe((st) => setIsOnline(st.connected));
  }, []);

  const isMac =
    typeof window !== 'undefined' &&
    (/(Macintosh|Mac OS X|MacIntel)/i.test(navigator.userAgent || navigator.platform) ||
      (typeof navigator !== 'undefined' && (navigator as any).userAgentData?.platform === 'macOS'));

  const shortcutSymbol = isMac ? '⌘K' : 'Ctrl+K';

  const handleHeaderMouseDown = React.useCallback(async (e: React.MouseEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if (isInteractiveElement(e.target as HTMLElement)) return;

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.startDragging();
    } catch {}
  }, []);

  const handleHeaderDoubleClick = React.useCallback(async (e: React.MouseEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if (isInteractiveElement(e.target as HTMLElement)) return;

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.toggleMaximize();
    } catch {}
  }, []);

  const handleOpenSearch = () => {
    audioManager.playOpenPanel();
    TerraHaptics.lightImpact();
    setSearchModalOpen(true);
  };

  const handleToggleProjection = () => {
    if (projection === 'globe') {
      audioManager.playTo2D();
      setProjection('mercator');
    } else {
      audioManager.playTo3D();
      setProjection('globe');
    }
    TerraHaptics.mediumImpact();
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
    setLang(lang === 'uk' ? 'en' : 'uk');
  };

  const handleExportMap = () => {
    audioManager.playClick();
    TerraHaptics.mediumImpact();
    exportMapToPNG(null, selectedCountryIso || 'World');
  };

  const handleLogoClick = () => {
    audioManager.playSelectContinent();
    TerraHaptics.mediumImpact();
    resetToWorld();
  };

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleHeaderMouseDown}
      onDoubleClick={handleHeaderDoubleClick}
      className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between pr-3 sm:pr-4 lg:pr-6 select-none pointer-events-auto bg-transparent transition-all"
    >
      {/* LEFT ISLAND: Logo & Responsive Fast Search */}
      <div className={`flex items-center gap-1.5 sm:gap-2 xl:gap-3 no-drag min-w-0 shrink-0 ${isMac ? 'pl-[84px] sm:pl-[88px]' : 'pl-3 sm:pl-4 lg:pl-6'}`}>
        {/* Brand / Logo Capsule */}
        <LiquidGlassPanel
          intensity="high"
          role="button"
          tabIndex={0}
          aria-label="TerraMetrics 3D - Скинути вибір на огляд світу"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLogoClick();
            }
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 xl:px-4 rounded-2xl shadow-xl hover:border-blue-500/40 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all cursor-pointer group active:scale-98 shrink-0 no-drag"
          onClick={handleLogoClick}
          title={t('global_stats')}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
            <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm xl:text-base font-black tracking-tight text-zinc-900 dark:text-white leading-none">
              TerraMetrics<span className="text-blue-500 font-bold ml-0.5">3D</span>
            </span>
            <span className="text-[10px] xl:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 hidden 2xl:inline">
              {selectedCountryIso ? t('country_view') : t('global_stats')}
            </span>
          </div>
        </LiquidGlassPanel>

        {/* Search Bar Capsule: Responsive Width Ladder */}
        <LiquidGlassPanel
          intensity="high"
          role="button"
          tabIndex={0}
          aria-label={`${t('search_placeholder')} (${shortcutSymbol})`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenSearch();
            }
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 xl:px-3.5 xl:py-2.5 rounded-2xl shadow-xl hover:border-blue-500/40 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all cursor-pointer w-28 sm:w-32 md:w-36 lg:w-44 xl:w-56 2xl:w-64 active:scale-98 shrink-0 no-drag"
          onClick={handleOpenSearch}
          title={t('search_placeholder')}
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 truncate flex-1">
            {t('search_placeholder')}
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] xl:text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-white/10 rounded-md border border-black/5 dark:border-white/10 shrink-0 font-mono hidden lg:inline">
            {shortcutSymbol}
          </kbd>
        </LiquidGlassPanel>
      </div>

      {/* CENTER ISLAND: Space Mode Selector */}
      <div className="flex items-center justify-center no-drag shrink min-w-0 mx-1 xl:mx-2">
        <DesktopSpaceSwitcher />
      </div>

      {/* RIGHT ISLAND: System Controls & Sync Status (Zero-Clip Cluster) */}
      <div className="flex items-center gap-1.5 sm:gap-2 no-drag shrink-0">
        <LiquidGlassPanel
          intensity="high"
          className="flex items-center gap-0.5 sm:gap-1 xl:gap-1.5 p-1 sm:p-1.5 rounded-2xl shadow-xl shrink-0 no-drag"
        >
          {/* 3D / 2D Projection Toggle */}
          <button
            type="button"
            onClick={handleToggleProjection}
            aria-label={projection === 'globe' ? t('tooltip_switch_2d') : t('tooltip_switch_3d')}
            aria-pressed={projection === 'globe'}
            className={`flex items-center gap-1 px-2 sm:px-2.5 xl:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none cursor-pointer no-drag ${
              projection === 'globe'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={projection === 'globe' ? t('tooltip_switch_2d') : t('tooltip_switch_3d')}
          >
            {projection === 'globe' ? <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span>{projection === 'globe' ? '3D' : '2D'}</span>
          </button>

          {/* Theme Toggle (Sun / Moon) */}
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? t('tooltip_light_theme') : t('tooltip_dark_theme')}
            className="p-1 sm:p-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all active:scale-95 cursor-pointer no-drag"
            title={theme === 'dark' ? t('tooltip_light_theme') : t('tooltip_dark_theme')}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-500" />
            )}
          </button>

          {/* Language Switcher (UK / EN) */}
          <button
            type="button"
            onClick={handleToggleLang}
            aria-label={t('tooltip_lang_switch')}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all active:scale-95 cursor-pointer no-drag"
            title={t('tooltip_lang_switch')}
          >
            {lang === 'uk' ? 'UK' : 'EN'}
          </button>

          {/* Export Map to PNG */}
          <button
            type="button"
            onClick={handleExportMap}
            aria-label={lang === 'uk' ? 'Експорт карти (PNG)' : 'Export map (PNG)'}
            className="p-1 sm:p-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-all active:scale-95 cursor-pointer no-drag"
            title={lang === 'uk' ? 'Експорт карти (PNG)' : 'Export map (PNG)'}
          >
            <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          <div className="w-[1px] h-3.5 sm:h-4 bg-black/10 dark:bg-white/10 mx-0.5" />

          {/* Live Sync / Online Status Dot */}
          <div
            className="px-1.5 sm:px-2 py-1 sm:py-1.5 flex items-center gap-1.5 cursor-default no-drag"
            title={isOnline ? t('tooltip_live_api') : t('tooltip_offline_mode')}
            aria-label={isOnline ? t('status_online') : t('status_offline')}
          >
            <span
              className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
              }`}
            />
          </div>
        </LiquidGlassPanel>
      </div>
    </header>
  );
});

