import React, { Suspense, lazy } from 'react';
import { GlobeCanvas } from '../components/map/GlobeCanvas';
import { MobileTopBar } from '../components/topbar/MobileTopBar';
import { DesktopTopBar } from '../components/topbar/DesktopTopBar';
import { MapLegend } from '../components/map/MapLegend';
import { AppPreloader } from '../components/common/AppPreloader';
import { useIsDesktop } from '../hooks/useDevice';
import { useGlobalKeyboardShortcuts } from '../hooks/useGlobalKeyboardShortcuts';
import { useAppThemeSync } from '../hooks/useAppThemeSync';
import { useNativeLifecycle } from '../hooks/useNativeLifecycle';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import '../api/ExternalAPI';

const DesktopSidebar = lazy(() =>
  import('../components/sidebar/DesktopSidebar').then((m) => ({ default: m.DesktopSidebar }))
);
const MobileBottomSheet = lazy(() =>
  import('../components/sheet/MobileBottomSheet').then((m) => ({ default: m.MobileBottomSheet }))
);
const SearchModal = lazy(() =>
  import('../components/topbar/SearchModal').then((m) => ({ default: m.SearchModal }))
);
const ClimateModal = lazy(() =>
  import('../components/modals/ClimateModal').then((m) => ({ default: m.ClimateModal }))
);

export const App: React.FC = () => {
  const isDesktop = useIsDesktop();

  useAppThemeSync();
  useNativeLifecycle();
  useGlobalKeyboardShortcuts();

  const {
    stage,
    progress,
    isPreloaderVisible,
    isFadingOut,
    isDataReady,
    startBootstrap,
    handleEngineReady,
    handleRenderReady,
  } = useAppBootstrap();

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#f0f4f8] dark:bg-[#060a12] transition-colors duration-300">
      {/* 120 FPS WebGL Map Engine Container */}
      <GlobeCanvas
        onEngineReady={handleEngineReady}
        onRenderReady={handleRenderReady}
        isDataReady={isDataReady}
      />

      {/* Main Interactive UI: Desktop vs Mobile Responsive Suite */}
      {!isPreloaderVisible && (
        <Suspense fallback={null}>
          {isDesktop ? (
            <>
              <DesktopTopBar />
              <DesktopSidebar />
            </>
          ) : (
            <>
              <MobileTopBar />
              <MobileBottomSheet />
            </>
          )}

          {/* Modals & Overlays */}
          <SearchModal />
          <ClimateModal />
          <MapLegend />
        </Suspense>
      )}

      {/* Multi-Stage Preloader */}
      {isPreloaderVisible && (
        <AppPreloader
          stageKey={stage}
          progress={progress}
          onRetry={startBootstrap}
          isFadingOut={isFadingOut}
        />
      )}
    </div>
  );
};
