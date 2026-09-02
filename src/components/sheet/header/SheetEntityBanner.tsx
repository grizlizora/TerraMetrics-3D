import React from 'react';
import { Globe, X, Copy, Check, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { useI18nStore } from '../../../store/useI18nStore';
import type { SheetSnap } from '../../../types';

interface SheetEntityBannerProps {
  title: string;
  subtitle: string;
  selectedCountryIso: string | null;
  sheetSnap: SheetSnap;
  copied: boolean;
  isRefreshing: boolean;
  onToggleSnap: () => void;
  onResetCountry: () => void;
  onResetWorld: () => void;
  onCopySummary: () => void;
  onManualSync: () => void;
}

export const SheetEntityBanner: React.FC<SheetEntityBannerProps> = React.memo(({
  title,
  subtitle,
  selectedCountryIso,
  sheetSnap,
  copied,
  isRefreshing,
  onToggleSnap,
  onResetCountry,
  onResetWorld,
  onCopySummary,
  onManualSync,
}) => {
  const t = useI18nStore((s) => s.t);

  return (
    <div className="flex items-center justify-between gap-2.5 pt-1">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          onClick={selectedCountryIso ? onResetCountry : onResetWorld}
          className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
          title={t('global_stats')}
        >
          <Globe className="w-4.5 h-4.5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 title={title} className="text-base sm:text-lg font-black text-zinc-900 dark:text-white truncate tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate leading-none mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onCopySummary}
          className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            copied
              ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title={copied ? t('copied') || 'Copied' : t('copy_stats') || 'Copy stats'}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {selectedCountryIso && (
          <button
            onClick={onResetCountry}
            className="w-7.5 h-7.5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
            title={t('reset_selection')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onManualSync}
          className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95 ${
            isRefreshing ? 'animate-spin text-blue-500' : ''
          }`}
          title={t('sync_now')}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleSnap}
          className="w-7.5 h-7.5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
          title={sheetSnap === 'peek' ? t('tooltip_expand_sidebar') : t('tooltip_collapse_sidebar')}
        >
          {sheetSnap === 'peek' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

SheetEntityBanner.displayName = 'SheetEntityBanner';
