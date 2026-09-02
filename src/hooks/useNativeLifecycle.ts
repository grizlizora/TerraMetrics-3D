import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useAppStore } from '../store/useAppStore';
import { BackButtonHandler } from '../native/BackButtonHandler';
import { audioManager } from '../audio/AudioManager';

export function useNativeLifecycle() {
  // Capacitor Android Back Button handler
  useEffect(() => {
    const cleanupBack = BackButtonHandler.init(
      () => useAppStore.getState().climateModalOpen,
      () => useAppStore.getState().setClimateModalOpen(false),
      () => useAppStore.getState().searchModalOpen,
      () => useAppStore.getState().setSearchModalOpen(false),
      () => useAppStore.getState().sheetSnap !== 'peek',
      () => useAppStore.getState().setSheetSnap('peek'),
      () => Boolean(useAppStore.getState().selectedCountryIso),
      () => useAppStore.getState().setSelectedCountry(null, null),
      () => useAppStore.getState().selectedContinent !== 'World',
      () => useAppStore.getState().resetToWorld()
    );

    return () => {
      cleanupBack?.();
    };
  }, []);

  // Background audio suppression and power saving on app pause
  useEffect(() => {
    let handle: any = null;
    const setupAppLifecycle = async () => {
      try {
        handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            audioManager.stopFlySound();
          }
        });
      } catch {
        // Web fallback
      }
    };
    setupAppLifecycle();
    return () => {
      handle?.remove?.();
    };
  }, []);
}
