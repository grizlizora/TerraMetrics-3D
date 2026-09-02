import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import { useI18nStore } from '../store/useI18nStore';
import { audioManager } from '../audio/AudioManager';
import { TerraHaptics } from './TerraHaptics';

export class BackButtonHandler {
  private static lastBackPress = 0;
  private static cleanup: (() => void) | null = null;

  static init(
    getIsClimateModalOpen: () => boolean,
    closeClimateModal: () => void,
    getIsSearchOpen: () => boolean,
    closeSearch: () => void,
    getIsSheetExpanded: () => boolean,
    collapseSheet: () => void,
    getIsCountrySelected: () => boolean,
    clearCountrySelection: () => void,
    getIsContinentSelected?: () => boolean,
    clearContinentSelection?: () => void
  ) {
    if (this.cleanup) {
      this.cleanup();
    }

    try {
      const listenerPromise = App.addListener('backButton', () => {
        if (typeof document !== 'undefined') {
          (document.activeElement as HTMLElement)?.blur?.();
        }

        // 1. Priority: Climate modal open
        if (getIsClimateModalOpen()) {
          audioManager.playClosePanel();
          TerraHaptics.lightImpact();
          closeClimateModal();
          return;
        }

        // 2. Priority: Search open
        if (getIsSearchOpen()) {
          audioManager.playClosePanel();
          TerraHaptics.lightImpact();
          closeSearch();
          return;
        }

        // 3. Priority: Sheet expanded to full or half -> collapse to peek
        if (getIsSheetExpanded()) {
          audioManager.playClosePanel();
          TerraHaptics.selectionChanged();
          collapseSheet();
          return;
        }

        // 4. Priority: Country selected
        if (getIsCountrySelected()) {
          audioManager.playClosePanel();
          TerraHaptics.lightImpact();
          clearCountrySelection();
          return;
        }

        // 5. Priority: Continent selected (reset to World)
        if (getIsContinentSelected?.()) {
          audioManager.playClosePanel();
          TerraHaptics.lightImpact();
          clearContinentSelection?.();
          return;
        }

        // 6. Double tap to exit
        const now = Date.now();
        if (now - this.lastBackPress < 2000) {
          App.exitApp();
        } else {
          this.lastBackPress = now;
          const exitText = useI18nStore.getState().t('exit_toast') || 'Press back again to exit';
          Toast.show({
            text: exitText,
            duration: 'short',
            position: 'bottom',
          }).catch(() => {});
        }
      });

      this.cleanup = () => {
        listenerPromise.then((handle) => handle.remove()).catch(() => {});
      };
    } catch {
      // Running on Web, ignore
    }

    return () => {
      if (this.cleanup) {
        this.cleanup();
        this.cleanup = null;
      }
    };
  }
}
