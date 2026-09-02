import React from 'react';
import { Globe, ChevronLeft, ChevronRight, RefreshCw, X, Copy, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../store/useI18nStore';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { CategorySubmodeBar } from '../common/CategorySubmodeBar';
import { SheetContentRouter } from '../sheet/SheetContentRouter';
import { useEntityDetails } from '../../hooks/useEntityDetails';

export const DesktopSidebar: React.FC = React.memo(() => {
  const isSidebarCollapsed = useAppStore((s) => s.isSidebarCollapsed);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const { t } = useTranslation();

  const {
    selectedCountryIso,
    countryProps,
    continentStats,
    isCountry,
    title,
    subtitle,
    isRefreshing,
    copied,
    dataVersion,
    subMode,
    handleManualSync,
    handleCopySummary,
    resetSelection,
    resetToWorld,
  } = useEntityDetails();

  return (
    <>
      {/* Floating Toggle Button when Sidebar is collapsed */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-6 top-24 z-30 p-3.5 rounded-2xl bg-white/90 dark:bg-black/85 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl hover:scale-105 transition-all text-zinc-800 dark:text-white cursor-pointer group"
          title={t('tooltip_expand_sidebar')}
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Main Glass Sidebar */}
      <aside
        style={{ contain: 'layout style' }}
        className={`fixed top-[86px] bottom-6 left-6 z-20 w-[410px] xl:w-[440px] 2xl:w-[460px] max-w-[calc(100vw-48px)] transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarCollapsed ? '-translate-x-[calc(100%+36px)] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}
      >
        <LiquidGlassPanel intensity="high" className="w-full h-full flex flex-col rounded-3xl shadow-2xl overflow-hidden">
          {/* Entity Header & Controls */}
          <div className="p-4 sm:p-5 pb-3.5 border-b border-black/5 dark:border-white/10 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={resetToWorld}
                  className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
                  title={t('global_stats')}
                >
                  <Globe className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 title={title} className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white truncate tracking-tight leading-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate leading-none mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopySummary}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    copied
                      ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  title={copied ? t('copied') || 'Copied' : t('copy_stats') || 'Copy stats'}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                {selectedCountryIso && (
                  <button
                    onClick={resetSelection}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                    title={t('reset_selection')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleManualSync}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95 ${
                    isRefreshing ? 'animate-spin text-blue-500' : ''
                  }`}
                  title={t('sync_now')}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                  title={t('tooltip_collapse_sidebar')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reusable Category and Submode Navigation */}
            <CategorySubmodeBar variant="desktop" />
          </div>

          {/* Scrollable View Content Router */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
            <SheetContentRouter
              subMode={subMode}
              dataVersion={dataVersion}
              countryProps={countryProps}
              continentStats={continentStats}
              isCountry={isCountry}
            />
          </div>
        </LiquidGlassPanel>
      </aside>
    </>
  );
});
