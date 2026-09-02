import { useState, useCallback, useEffect } from 'react';
import { dataLoader } from '../data/DataLoader';
import type { LoadingStageKey } from '../types';

export function useAppBootstrap() {
  const [stage, setStage] = useState<LoadingStageKey>('init');
  const [progress, setProgress] = useState(0);
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Synchronization flags for startup
  const [isDataReady, setIsDataReady] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isFirstFrameRendered, setIsFirstFrameRendered] = useState(false);

  const startBootstrap = useCallback(async () => {
    setStage('init');
    setProgress(5);
    setIsDataReady(false);
    setIsFirstFrameRendered(false);

    const ok = await dataLoader.loadAll((st, pct) => {
      setStage(st);
      setProgress(pct);
    });

    if (ok) {
      setIsDataReady(true);
    } else {
      setStage('error');
    }
  }, []);

  useEffect(() => {
    startBootstrap();
  }, [startBootstrap]);

  const handleEngineReady = useCallback(() => {
    setIsEngineReady(true);
  }, []);

  const handleRenderReady = useCallback(() => {
    setIsFirstFrameRendered(true);
  }, []);

  // Synchronized transition to fully ready state: only when GPU frame is drawn (with safety timeout)
  useEffect(() => {
    let t1: any = null;
    let t2: any = null;

    const triggerReady = () => {
      setStage('ready');
      setProgress(100);

      t1 = setTimeout(() => {
        setIsFadingOut(true);
        t2 = setTimeout(() => {
          setIsPreloaderVisible(false);
        }, 500);
      }, 80);
    };

    if (isDataReady && isEngineReady && isFirstFrameRendered) {
      triggerReady();
    } else if (isDataReady && isEngineReady) {
      const fallbackTimer = setTimeout(() => {
        triggerReady();
      }, 1500);
      return () => {
        clearTimeout(fallbackTimer);
        if (t1) clearTimeout(t1);
        if (t2) clearTimeout(t2);
      };
    }

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [isDataReady, isEngineReady, isFirstFrameRendered]);

  return {
    stage,
    progress,
    isPreloaderVisible,
    isFadingOut,
    isDataReady,
    startBootstrap,
    handleEngineReady,
    handleRenderReady,
  };
}
