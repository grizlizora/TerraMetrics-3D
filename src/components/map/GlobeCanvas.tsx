import React, { useEffect, useRef } from 'react';
import { MapEngine } from '../../map/MapEngine';
import { MapCameraAnimator } from '../../map/camera/MapCameraAnimator';
import { dataLoader } from '../../data/DataLoader';
import { audioManager } from '../../audio/AudioManager';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { TerraHaptics } from '../../native/TerraHaptics';
import type { ISO3Code, SheetSnap } from '../../types';

interface GlobeCanvasProps {
  onEngineReady?: () => void;
  onRenderReady?: () => void;
  isDataReady?: boolean;
}

export const GlobeCanvas: React.FC<GlobeCanvasProps> = React.memo(({
  onEngineReady,
  onRenderReady,
  isDataReady = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const isRenderNotifiedRef = useRef(false);

  const subMode = useAppStore((s) => s.subMode);
  const theme = useAppStore((s) => s.theme);
  const projection = useAppStore((s) => s.projection);
  const spaceMode = useAppStore((s) => s.spaceMode);
  const spaceLabelsVisible = useAppStore((s) => s.spaceLabelsVisible);
  const timeScale = useAppStore((s) => s.timeScale);
  const sheetSnap = useAppStore((s) => s.sheetSnap);
  const selectedCountryIso = useAppStore((s) => s.selectedCountryIso);
  const selectedContinent = useAppStore((s) => s.selectedContinent);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);
  const setSelectedContinent = useAppStore((s) => s.setSelectedContinent);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const isSidebarCollapsed = useAppStore((s) => s.isSidebarCollapsed);
  const flyRequestId = useAppStore((s) => s.flyRequestId);

  const lang = useI18nStore((s) => s.lang);

  // Initialize Map Engine
  useEffect(() => {
    if (!containerRef.current || engineRef.current) return;
    let isCancelled = false;

    const engine = new MapEngine(containerRef.current.id);
    engine.audioManager = audioManager;
    engine.currentProjection = projection;

    engine.onCountrySelect = (iso, name) => {
      if (iso) {
        audioManager.playCountrySelect();
        TerraHaptics.countrySelected();
      } else {
        TerraHaptics.selectionChanged();
      }
      setSelectedCountry(iso, name);
    };

    engine.onContinentSelect = (continent) => {
      audioManager.playSelectContinent();
      TerraHaptics.mediumImpact();
      setSelectedContinent(continent);
    };

    engine.init(dataLoader, lang, theme).then(() => {
      if (isCancelled) {
        engine.destroy();
        return;
      }
      engineRef.current = engine;

      if (onEngineReady) {
        onEngineReady();
      }

      const geo = dataLoader.getGeoJson();
      const labels = dataLoader.getLabelsGeoJson();
      if (geo) {
        engine.setData(geo, labels);
        engine.waitForFirstFrame('countries').then(() => {
          if (!isRenderNotifiedRef.current && !isCancelled) {
            isRenderNotifiedRef.current = true;
            onRenderReady?.();
          }
        });
      }

      engine.map.on('moveend', () => {
        if (pendingSnapRef.current && engineRef.current && !MapCameraAnimator.isFlying) {
          const state = useAppStore.getState();
          engineRef.current.updateViewportPadding(pendingSnapRef.current, state.isSidebarCollapsed);
          pendingSnapRef.current = null;
        }
      });
    });

    return () => {
      isCancelled = true;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Sync data whenever DataLoader finishes or dataVersion updates
  useEffect(() => {
    if (isDataReady && engineRef.current) {
      const geo = dataLoader.getGeoJson();
      const labels = dataLoader.getLabelsGeoJson();
      if (geo) {
        engineRef.current.setData(geo, labels);
        engineRef.current.waitForFirstFrame('countries').then(() => {
          if (!isRenderNotifiedRef.current) {
            isRenderNotifiedRef.current = true;
            onRenderReady?.();
          }
        });
      }
    }
  }, [isDataReady, dataVersion]);

  // Sync SubMode
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSubMode(subMode);
    }
  }, [subMode]);

  // Sync Theme
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTheme(theme);
    }
  }, [theme]);

  // Sync Projection
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setProjection(projection);
    }
  }, [projection]);

  // Sync Language
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateLanguage(lang);
    }
  }, [lang]);

  const prevSelectedCountryRef = useRef(selectedCountryIso);
  const prevSelectedContinentRef = useRef(selectedContinent);
  const pendingSnapRef = useRef<SheetSnap | null>(null);

  // Sync Viewport Padding with Sheet Snap & Sidebar Collapsed State
  useEffect(() => {
    // Only ease padding if neither country nor continent changed in the exact same render
    const countryUnchanged = prevSelectedCountryRef.current === selectedCountryIso;
    const continentUnchanged = prevSelectedContinentRef.current === selectedContinent;
    if (engineRef.current && countryUnchanged && continentUnchanged) {
      if (!MapCameraAnimator.isFlying) {
        engineRef.current.updateViewportPadding(sheetSnap, isSidebarCollapsed);
        pendingSnapRef.current = null;
      } else {
        pendingSnapRef.current = sheetSnap;
      }
    }
    prevSelectedCountryRef.current = selectedCountryIso;
    prevSelectedContinentRef.current = selectedContinent;
  }, [sheetSnap, isSidebarCollapsed, selectedCountryIso, selectedContinent]);

  // Sync Viewport on Window Resize / Orientation Change
  useEffect(() => {
    let resizeTimer: number;
    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (engineRef.current) {
          engineRef.current.onResize();
          const state = useAppStore.getState();
          engineRef.current.updateViewportPadding(state.sheetSnap, state.isSidebarCollapsed);
        }
      }, 150);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioManager.stopFlySound();
        if (engineRef.current?.map) {
          engineRef.current.map.stop();
        }
      } else {
        if (engineRef.current?.spaceEngine?.isActive) {
          engineRef.current.spaceEngine.updateAstronomicalPositions(new Date());
          engineRef.current.map?.triggerRepaint();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Unified Entity Selection & Camera Navigation Sync (Guaranteed 0 duplicate flights & 100% reliable resets)
  const prevCountryRef = useRef<ISO3Code | null>(null);
  const prevContinentRef = useRef(selectedContinent);
  const prevFlyRequestIdRef = useRef(flyRequestId);

  useEffect(() => {
    if (!engineRef.current || !isDataReady) return;

    const countryChanged = prevCountryRef.current !== selectedCountryIso;
    const continentChanged = prevContinentRef.current !== selectedContinent;
    const requestTriggered = prevFlyRequestIdRef.current !== flyRequestId;

    prevCountryRef.current = selectedCountryIso;
    prevContinentRef.current = selectedContinent;
    prevFlyRequestIdRef.current = flyRequestId;

    if (selectedCountryIso) {
      if (countryChanged || requestTriggered) {
        engineRef.current.flyToCountry(selectedCountryIso, dataLoader.getGeoJson(), sheetSnap, isSidebarCollapsed);
      }
    } else {
      engineRef.current.selectCountry(null);
      if (countryChanged || continentChanged || requestTriggered) {
        engineRef.current.flyToContinent(selectedContinent, sheetSnap, isSidebarCollapsed);
      }
    }
  }, [selectedCountryIso, selectedContinent, flyRequestId, isDataReady]);

  // Sync Space Mode
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSpaceMode(spaceMode);
    }
  }, [spaceMode]);

  // Sync Space Labels Visibility
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSpaceLabelsVisible(spaceLabelsVisible);
    }
  }, [spaceLabelsVisible]);

  // Sync TimeScale
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTimeScale(timeScale);
    }
  }, [timeScale]);

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
