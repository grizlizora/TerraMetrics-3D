import { useEffect, useRef } from 'react';
import type { MapEngine } from '../../../map/MapEngine';
import { audioManager } from '../../../audio/AudioManager';
import { useAppStore } from '../../../store/useAppStore';

interface UseMapWindowEventsProps {
  engine: MapEngine | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useMapWindowEvents({
  engine,
  containerRef,
}: UseMapWindowEventsProps) {
  const rafResizeIdRef = useRef<number | null>(null);

  // Zero-Latency ResizeObserver with requestAnimationFrame throttle
  useEffect(() => {
    if (!engine) return;

    const triggerResize = () => {
      if (rafResizeIdRef.current !== null) {
        cancelAnimationFrame(rafResizeIdRef.current);
      }
      rafResizeIdRef.current = requestAnimationFrame(() => {
        if (engine) {
          engine.onResize();
          const state = useAppStore.getState();
          engine.updateViewportPadding(state.sheetSnap, state.isSidebarCollapsed);
        }
        rafResizeIdRef.current = null;
      });
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        triggerResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', triggerResize, { passive: true });
    window.addEventListener('orientationchange', triggerResize, { passive: true });

    return () => {
      if (rafResizeIdRef.current !== null) {
        cancelAnimationFrame(rafResizeIdRef.current);
        rafResizeIdRef.current = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', triggerResize);
      window.removeEventListener('orientationchange', triggerResize);
    };
  }, [engine, containerRef]);

  // Page / Tab Visibility Lifecycle Handling
  useEffect(() => {
    if (!engine) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioManager.stopFlySound();
        if (engine.map) {
          engine.map.stop();
        }
      } else {
        if (engine.spaceEngine?.isActive) {
          engine.spaceEngine.updateAstronomicalPositions(new Date());
          engine.map?.triggerRepaint();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [engine]);
}
