import React from 'react';
import { Globe, AlertCircle, RefreshCw, Languages } from 'lucide-react';
import { LiquidGlassPanel } from './LiquidGlassPanel';
import { useI18nStore } from '../../store/useI18nStore';
import { LoadingStageKey } from '../../types';

export interface AppPreloaderProps {
  stageKey: LoadingStageKey;
  progress: number;
  onRetry?: () => void;
  isFadingOut?: boolean;
}

export const AppPreloader: React.FC<AppPreloaderProps> = ({
  stageKey,
  progress,
  onRetry,
  isFadingOut = false,
}) => {
  const { t, lang, toggleLang } = useI18nStore();

  const getStageTitle = () => {
    switch (stageKey) {
      case 'init':
        return t('stage_init');
      case 'geo':
        return t('stage_geo');
      case 'analytics':
        return t('stage_analytics');
      case 'engine':
        return t('stage_engine');
      case 'ready':
        return t('stage_ready');
      case 'error':
        return t('stage_error');
      default:
        return t('stage_init');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-6 select-none transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105 backdrop-blur-none' : 'opacity-100 scale-100'
      }`}
    >
      <LiquidGlassPanel
        intensity="high"
        className="relative p-8 max-w-sm w-full text-center space-y-6 shadow-2xl rounded-3xl border border-white/10"
      >
        {/* Language switcher top right */}
        <button
          onClick={toggleLang}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-zinc-300 text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
          title={t('tooltip_lang_switch')}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{lang.toUpperCase()}</span>
        </button>

        {/* Globe icon with pulsing rings */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping opacity-30" />
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 backdrop-blur-md border border-blue-500/30">
            {stageKey === 'error' ? (
              <AlertCircle className="w-8 h-8 text-rose-500" />
            ) : (
              <Globe className="w-8 h-8 animate-pulse text-blue-400" />
            )}
          </div>
        </div>

        {/* Title and stage status */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            {t('loading_app_title')}
          </h1>
          <p className="text-xs font-medium text-zinc-400">
            {t('loading_subtitle')}
          </p>
        </div>

        {/* Stage message & Percentage */}
        {stageKey !== 'error' ? (
          <div className="space-y-2.5 pt-2">
            <div className="flex justify-between items-center text-xs font-semibold px-1">
              <span className="text-zinc-300 text-left truncate max-w-[200px]">
                {getStageTitle()}
              </span>
              <span className="text-blue-400 font-mono text-xs font-bold">{progress}%</span>
            </div>

            {/* Precision progress bar */}
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                style={{ width: `${Math.max(6, progress)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-rose-400 font-medium">{t('stage_error')}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-rose-900/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('retry_btn')}</span>
              </button>
            )}
          </div>
        )}
      </LiquidGlassPanel>
    </div>
  );
};
