import React from 'react';
import { GlobeCanvas } from '../components/map/GlobeCanvas';
import { MobileTopBar } from '../components/topbar/MobileTopBar';
import { DesktopTopBar } from '../components/topbar/DesktopTopBar';
import { DesktopSidebar } from '../components/sidebar/DesktopSidebar';
import { MobileBottomSheet } from '../components/sheet/MobileBottomSheet';
import { SearchModal } from '../components/topbar/SearchModal';
import { ClimateModal } from '../components/modals/ClimateModal';
import { MapLegend } from '../components/map/MapLegend';
import { AppPreloader } from '../components/common/AppPreloader';
import { useDevice } from '../hooks/useDevice';
import { useGlobalKeyboardShortcuts } from '../hooks/useGlobalKeyboardShortcuts';
import { useAppThemeSync } from '../hooks/useAppThemeSync';
import { useNativeLifecycle } from '../hooks/useNativeLifecycle';
import { useAppBootstrap } from '../hooks/useAppBootstrap';
import '../api/ExternalAPI';

export const App: React.FC = () => {
  const { isDesktop } = useDevice();

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
        <>
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
        </>
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
