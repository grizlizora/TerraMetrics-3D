import React, { useRef } from 'react';
import { useSpatialPointerTracker } from './hooks/useSpatialPointerTracker';
import { useMapEngineLifecycle } from './hooks/useMapEngineLifecycle';
import { useMapWindowEvents } from './hooks/useMapWindowEvents';
import { useMapDataBinding } from './hooks/useMapDataBinding';
import { useMapStateSync } from './hooks/useMapStateSync';
import { useMapCameraNavigation } from './hooks/useMapCameraNavigation';

interface GlobeCanvasProps {
  onEngineReady?: () => void;
  onRenderReady?: () => void;
  isDataReady?: boolean;
}

export const GlobeCanvas: React.FC<GlobeCanvasProps> = React.memo(
  ({ onEngineReady, onRenderReady, isDataReady = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Passive Spatial Pointer Tracking for 3D Audio Panning
    const { getPointerPanX } = useSpatialPointerTracker();

    // 2. Engine Lifecycle: Instantiation, WebGL Mounting & Safe Destruction
    const { engine } = useMapEngineLifecycle({
      containerRef,
      onEngineReady,
      getPointerPanX,
    });

    // 3. Hardware & Window Events: ResizeObserver with RAF throttle, visibilitychange
    useMapWindowEvents({
      engine,
      containerRef,
    });

    // 4. Data Binding: Ingests GeoJSON & Labels without race conditions
    useMapDataBinding({
      engine,
      isDataReady,
      onRenderReady,
    });

    // 5. Reactive State Sync: Theme, SubMode, Projection, Space, Language, TimeScale
    useMapStateSync({ engine });

    // 6. Camera Navigation & Viewport Padding Sync
    useMapCameraNavigation({
      engine,
      isDataReady,
    });

    return (
      <div
        id="map-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full z-0 overflow-hidden select-none"
      />
    );
  }
);

GlobeCanvas.displayName = 'GlobeCanvas';
