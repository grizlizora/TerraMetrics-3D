import { useEffect } from 'react';
import type { MapEngine } from '../../../map/MapEngine';
import { useAppStore } from '../../../store/useAppStore';
import { useI18nStore } from '../../../store/useI18nStore';

interface UseMapStateSyncProps {
  engine: MapEngine | null;
}

export function useMapStateSync({ engine }: UseMapStateSyncProps) {
  const subMode = useAppStore((s) => s.subMode);
  const theme = useAppStore((s) => s.theme);
  const projection = useAppStore((s) => s.projection);
  const spaceMode = useAppStore((s) => s.spaceMode);
  const spaceLabelsVisible = useAppStore((s) => s.spaceLabelsVisible);
  const timeScale = useAppStore((s) => s.timeScale);
  const lang = useI18nStore((s) => s.lang);

  // Sync SubMode
  useEffect(() => {
    if (engine) {
      engine.setSubMode(subMode);
    }
  }, [engine, subMode]);

  // Sync Theme
  useEffect(() => {
    if (engine) {
      engine.setTheme(theme);
    }
  }, [engine, theme]);

  // Sync Projection
  useEffect(() => {
    if (engine) {
      engine.setProjection(projection);
    }
  }, [engine, projection]);

  // Sync Language
  useEffect(() => {
    if (engine) {
      engine.updateLanguage(lang);
    }
  }, [engine, lang]);

  // Sync Space Mode
  useEffect(() => {
    if (engine) {
      engine.setSpaceMode(spaceMode);
    }
  }, [engine, spaceMode]);

  // Sync Space Labels Visibility
  useEffect(() => {
    if (engine) {
      engine.setSpaceLabelsVisible(spaceLabelsVisible);
    }
  }, [engine, spaceLabelsVisible]);

  // Sync TimeScale
  useEffect(() => {
    if (engine) {
      engine.setTimeScale(timeScale);
    }
  }, [engine, timeScale]);
}
