import { useEffect, useRef } from 'react';
import type { MapEngine } from '../../../map/MapEngine';
import { dataLoader } from '../../../data/DataLoader';
import { useAppStore } from '../../../store/useAppStore';

interface UseMapDataBindingProps {
  engine: MapEngine | null;
  isDataReady: boolean;
  onRenderReady?: () => void;
}

export function useMapDataBinding({
  engine,
  isDataReady,
  onRenderReady,
}: UseMapDataBindingProps) {
  const dataVersion = useAppStore((s) => s.dataVersion);
  const isRenderNotifiedRef = useRef(false);
  const onRenderReadyRef = useRef(onRenderReady);
  onRenderReadyRef.current = onRenderReady;

  useEffect(() => {
    if (!engine) return;

    // Idempotent data binding: triggers whenever engine is ready OR data arrives / updates
    const geo = dataLoader.getGeoJson();
    const labels = dataLoader.getLabelsGeoJson();

    if (geo && (isDataReady || geo.features.length > 0)) {
      engine.setData(geo, labels);
      engine.waitForFirstFrame('countries').then(() => {
        if (!isRenderNotifiedRef.current) {
          isRenderNotifiedRef.current = true;
          onRenderReadyRef.current?.();
        }
      });
    }
  }, [engine, isDataReady, dataVersion]);
}
