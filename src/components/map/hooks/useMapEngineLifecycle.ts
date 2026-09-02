import { useEffect, useRef, useState } from 'react';
import { MapEngine } from '../../../map/MapEngine';
import { dataLoader } from '../../../data/DataLoader';
import { audioManager } from '../../../audio/AudioManager';
import { useAppStore } from '../../../store/useAppStore';
import { useI18nStore } from '../../../store/useI18nStore';
import { TerraHaptics } from '../../../native/TerraHaptics';

interface UseMapEngineLifecycleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onEngineReady?: () => void;
  getPointerPanX?: () => number;
}

export function useMapEngineLifecycle({
  containerRef,
  onEngineReady,
  getPointerPanX,
}: UseMapEngineLifecycleProps) {
  const [engine, setEngine] = useState<MapEngine | null>(null);
  const engineRef = useRef<MapEngine | null>(null);

  const lang = useI18nStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const subMode = useAppStore((s) => s.subMode);
  const projection = useAppStore((s) => s.projection);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);
  const setSelectedContinent = useAppStore((s) => s.setSelectedContinent);

  // Keep callback refs fresh to avoid stale closures in MapLibre event handlers
  const onEngineReadyRef = useRef(onEngineReady);
  onEngineReadyRef.current = onEngineReady;

  const getPointerPanXRef = useRef(getPointerPanX);
  getPointerPanXRef.current = getPointerPanX;

  useEffect(() => {
    if (!containerRef.current || engineRef.current) return;
    let isCancelled = false;

    const mapEngine = new MapEngine(containerRef.current.id);
    mapEngine.audioManager = audioManager;

    mapEngine.onCountrySelect = (iso, name) => {
      const panX = getPointerPanXRef.current ? getPointerPanXRef.current() : 0;
      if (iso) {
        audioManager.playCountrySelect(panX);
        TerraHaptics.countrySelected();
      } else {
        TerraHaptics.selectionChanged();
      }
      setSelectedCountry(iso, name);
    };

    mapEngine.onContinentSelect = (continent) => {
      const panX = getPointerPanXRef.current ? getPointerPanXRef.current() : 0;
      audioManager.playSelectContinent(panX);
      TerraHaptics.mediumImpact();
      setSelectedContinent(continent);
    };

    mapEngine
      .init(dataLoader, lang, theme, subMode, projection)
      .then(() => {
        if (isCancelled) {
          mapEngine.destroy();
          return;
        }
        engineRef.current = mapEngine;
        setEngine(mapEngine);
        onEngineReadyRef.current?.();
      })
      .catch((err) => {
        console.error('[useMapEngineLifecycle] Failed to initialize MapEngine:', err);
      });

    return () => {
      isCancelled = true;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      } else {
        mapEngine.destroy();
      }
      setEngine(null);
    };
  }, [containerRef]);

  return { engine, engineRef };
}
