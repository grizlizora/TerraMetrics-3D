import React from 'react';
import { Search, Globe, Sun, Moon, Map } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { DesktopSpaceSwitcher } from './DesktopSpaceSwitcher';
import { networkMonitor } from '../../data/api/NetworkMonitor';

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

  const isMac = typeof window !== 'undefined' && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform);
  const shortcutSymbol = isMac ? '⌘K' : 'Ctrl+K';

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

  const handleLogoClick = () => {
    audioManager.playSelectContinent();
    TerraHaptics.mediumImpact();
    resetToWorld();
  };

  return (
    <header className="fixed top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none select-none">
      {/* LEFT SECTION: Logo & Fast Search */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Brand / Logo Capsule */}
        <LiquidGlassPanel
          intensity="high"
          className="flex items-center gap-3 px-4 py-2 rounded-2xl shadow-xl hover:border-blue-500/40 transition-all cursor-pointer group active:scale-98"
          onClick={handleLogoClick}
          title={t('global_stats')}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Globe className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-white leading-none">
              TerraMetrics<span className="text-blue-500 font-bold ml-0.5">3D</span>
            </span>
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
              {selectedCountryIso ? t('country_view') : t('global_stats')}
            </span>
          </div>
        </LiquidGlassPanel>

        {/* Search Bar Capsule */}
        <LiquidGlassPanel
          intensity="high"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-xl hover:border-blue-500/40 transition-all cursor-pointer w-52 sm:w-56 xl:w-64 active:scale-98"
          onClick={handleOpenSearch}
          title={t('search_placeholder')}
        >
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 truncate flex-1">
            {t('search_placeholder')}
          </span>
          <kbd className="px-1.5 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-white/10 rounded-md border border-black/5 dark:border-white/10 shrink-0 font-mono">
            {shortcutSymbol}
          </kbd>
        </LiquidGlassPanel>
      </div>

      {/* CENTER SECTION: Space Mode Selector */}
      <div className="flex items-center justify-center pointer-events-auto">
        <DesktopSpaceSwitcher />
      </div>

      {/* RIGHT SECTION: System Controls & Sync Status */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <LiquidGlassPanel
          intensity="high"
          className="flex items-center gap-1.5 p-1.5 rounded-2xl shadow-xl"
        >
          {/* 3D / 2D Projection Toggle */}
          <button
            onClick={handleToggleProjection}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer ${
              projection === 'globe'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={projection === 'globe' ? t('tooltip_switch_2d') : t('tooltip_switch_3d')}
          >
            {projection === 'globe' ? <Globe className="w-4 h-4" /> : <Map className="w-4 h-4" />}
            <span>{projection === 'globe' ? '3D' : '2D'}</span>
          </button>

          {/* Theme Toggle (Sun / Moon) */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title={theme === 'dark' ? t('tooltip_light_theme') : t('tooltip_dark_theme')}
          >
            {theme === 'dark' ? (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-500" />
            )}
          </button>

          {/* Language Switcher (UK / EN) */}
          <button
            onClick={handleToggleLang}
            className="px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
            title={t('tooltip_lang_switch')}
          >
            {lang === 'uk' ? 'UK' : 'EN'}
          </button>

          <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-0.5" />

          {/* Live Sync / Online Status Dot */}
          <div
            className="px-2 py-1.5 flex items-center gap-1.5 cursor-default"
            title={isOnline ? t('tooltip_live_api') : t('tooltip_offline_mode')}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
              }`}
            />
          </div>
        </LiquidGlassPanel>
      </div>
    </header>
  );
});
