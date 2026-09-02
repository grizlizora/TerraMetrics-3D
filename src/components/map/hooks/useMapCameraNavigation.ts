import { useEffect, useRef } from 'react';
import type { MapEngine } from '../../../map/MapEngine';
import { MapCameraAnimator } from '../../../map/camera/MapCameraAnimator';
import { dataLoader } from '../../../data/DataLoader';
import { useAppStore } from '../../../store/useAppStore';
import type { ISO3Code, SheetSnap } from '../../../types';

interface UseMapCameraNavigationProps {
  engine: MapEngine | null;
  isDataReady: boolean;
}

export function useMapCameraNavigation({
  engine,
  isDataReady,
}: UseMapCameraNavigationProps) {
  const selectedCountryIso = useAppStore((s) => s.selectedCountryIso);
  const selectedContinent = useAppStore((s) => s.selectedContinent);
  const flyRequestId = useAppStore((s) => s.flyRequestId);
  const sheetSnap = useAppStore((s) => s.sheetSnap);
  const isSidebarCollapsed = useAppStore((s) => s.isSidebarCollapsed);

  const prevCountryRef = useRef<ISO3Code | null>(null);
  const prevContinentRef = useRef(selectedContinent);
  const prevFlyRequestIdRef = useRef(flyRequestId);

  const prevSelectedCountryRef = useRef(selectedCountryIso);
  const prevSelectedContinentRef = useRef(selectedContinent);
  const pendingSnapRef = useRef<SheetSnap | null>(null);

  // Attach moveend listener to apply deferred snap padding once camera animation completes
  useEffect(() => {
    if (!engine?.map) return;

    const handleMoveEnd = () => {
      if (pendingSnapRef.current && engine && !MapCameraAnimator.isFlying) {
        const state = useAppStore.getState();
        engine.updateViewportPadding(pendingSnapRef.current, state.isSidebarCollapsed);
        pendingSnapRef.current = null;
      }
    };

    engine.map.on('moveend', handleMoveEnd);
    return () => {
      engine.map?.off('moveend', handleMoveEnd);
    };
  }, [engine]);

  // Sync Viewport Padding with Sheet Snap & Sidebar Collapsed State (when entity hasn't changed)
  useEffect(() => {
    const countryUnchanged = prevSelectedCountryRef.current === selectedCountryIso;
    const continentUnchanged = prevSelectedContinentRef.current === selectedContinent;

    if (engine && countryUnchanged && continentUnchanged) {
      if (!MapCameraAnimator.isFlying) {
        engine.updateViewportPadding(sheetSnap, isSidebarCollapsed);
        pendingSnapRef.current = null;
      } else {
        pendingSnapRef.current = sheetSnap;
      }
    }

    prevSelectedCountryRef.current = selectedCountryIso;
    prevSelectedContinentRef.current = selectedContinent;
  }, [engine, sheetSnap, isSidebarCollapsed, selectedCountryIso, selectedContinent]);

  // Unified Entity Selection & Camera Flight Execution
  useEffect(() => {
    if (!engine || !isDataReady) return;

    const countryChanged = prevCountryRef.current !== selectedCountryIso;
    const continentChanged = prevContinentRef.current !== selectedContinent;
    const requestTriggered = prevFlyRequestIdRef.current !== flyRequestId;

    prevCountryRef.current = selectedCountryIso;
    prevContinentRef.current = selectedContinent;
    prevFlyRequestIdRef.current = flyRequestId;

    if (selectedCountryIso) {
      if (countryChanged || requestTriggered) {
        pendingSnapRef.current = null;
        engine.flyToCountry(
          selectedCountryIso,
          dataLoader.getGeoJson(),
          sheetSnap,
          isSidebarCollapsed
        );
      }
    } else {
      if (countryChanged) {
        engine.selectCountry(null);
      }
      if (countryChanged || continentChanged || requestTriggered) {
        pendingSnapRef.current = null;
        engine.flyToContinent(selectedContinent, sheetSnap, isSidebarCollapsed);
      }
    }
  }, [
    engine,
    selectedCountryIso,
    selectedContinent,
    flyRequestId,
    isDataReady,
    sheetSnap,
    isSidebarCollapsed,
  ]);
}
