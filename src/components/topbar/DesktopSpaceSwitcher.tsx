import React from 'react';
import { Globe, Sun, Orbit, Sparkles, Tag } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { SpaceMode } from '../../types';

export const DesktopSpaceSwitcher: React.FC = () => {
  const spaceMode = useAppStore((s) => s.spaceMode);
  const setSpaceMode = useAppStore((s) => s.setSpaceMode);
  const spaceLabelsVisible = useAppStore((s) => s.spaceLabelsVisible);
  const toggleSpaceLabels = useAppStore((s) => s.toggleSpaceLabels);
  const projection = useAppStore((s) => s.projection);
  const toggleProjection = useAppStore((s) => s.toggleProjection);
  const theme = useAppStore((s) => s.theme);

  const t = useI18nStore((s) => s.t);

  const isLight = theme === 'light';
  const isMercator = projection === 'mercator';

  const modes: Array<{ id: SpaceMode; labelKey: string; icon: React.ReactNode }> = [
    { id: 'none', labelKey: 'space_none', icon: <Globe className="w-4 h-4" /> },
    { id: 'basic', labelKey: 'space_basic', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { id: 'advanced', labelKey: 'space_advanced', icon: <Orbit className="w-4 h-4 text-indigo-400" /> },
    { id: 'deep', labelKey: 'space_deep', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
  ];

  const handleSelectMode = (m: SpaceMode) => {
    if (isLight && m !== 'none') return;
    if (spaceMode === m) return;
    audioManager.playSwitchCategory();
    TerraHaptics.mediumImpact();
    if (m !== 'none' && projection === 'mercator') {
      toggleProjection(); // Automatically switch to 3D globe
    }
    setSpaceMode(m);
  };

  const handleToggleLabels = () => {
    if (isLight) return;
    audioManager.playSwitchCategory();
    TerraHaptics.lightImpact();
    toggleSpaceLabels();
  };

  return (
    <div className={`hidden md:flex items-center pointer-events-auto shrink-0 ${isMercator && !isLight ? 'opacity-80' : ''}`}>
      <LiquidGlassPanel
        intensity="high"
        className="flex items-center p-1.5 shadow-lg rounded-2xl gap-1.5"
      >
        {modes.map((m) => {
          const isActive = spaceMode === m.id;
          const isDisabled = isLight && m.id !== 'none';

          let buttonTitle = t(m.labelKey);
          if (isDisabled) {
            buttonTitle = t('space_only_in_dark_theme');
          } else if (isMercator && m.id !== 'none') {
            buttonTitle = t('space_only_in_3d');
          }

          return (
            <button
              key={m.id}
              onClick={() => handleSelectMode(m.id)}
              disabled={isDisabled}
              title={buttonTitle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isDisabled
                  ? 'opacity-35 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                  : isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 cursor-pointer'
              }`}
            >
              {m.icon}
              <span>{t(m.labelKey)}</span>
            </button>
          );
        })}

        {/* Space Labels Toggle (visible only in Dark theme when Space is active) */}
        {!isLight && spaceMode !== 'none' && (
          <button
            onClick={handleToggleLabels}
            title={t('space_labels')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer border ${
              spaceLabelsVisible
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-500 font-bold shadow-xs'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{t('space_labels')}</span>
          </button>
        )}
      </LiquidGlassPanel>
    </div>
  );
};
