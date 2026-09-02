import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useI18nStore } from '../store/useI18nStore';
import { audioManager } from '../audio/AudioManager';
import { TerraHaptics } from '../native/TerraHaptics';
import { dataLoader } from '../data/DataLoader';
import { formatCountrySummary } from '../utils/shareUtils';

export function useGlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      const store = useAppStore.getState();
      const i18n = useI18nStore.getState();

      // Cmd+K / Ctrl+K or '/' to open search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        audioManager.playOpenPanel();
        store.setSearchModalOpen(true);
        return;
      }

      if (e.key === '/' && !store.searchModalOpen) {
        e.preventDefault();
        audioManager.playOpenPanel();
        store.setSearchModalOpen(true);
        return;
      }

      // Escape key hierarchy
      if (e.key === 'Escape') {
        if (store.climateModalOpen) {
          store.setClimateModalOpen(false);
        } else if (store.searchModalOpen) {
          store.setSearchModalOpen(false);
        } else if (store.sheetSnap !== 'peek') {
          store.setSheetSnap('peek');
        } else if (store.selectedCountryIso) {
          store.setSelectedCountry(null, null);
        } else if (store.selectedContinent && store.selectedContinent !== 'World') {
          store.resetToWorld();
        }
        return;
      }

      // Cmd+C / Ctrl+C: copy selected country, continent or world summary when no text is selected
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        const selection = window.getSelection()?.toString();
        if (!selection) {
          const iso = store.selectedCountryIso;
          const cont = store.selectedContinent || 'World';
          const countryProps = iso ? dataLoader.getCountryProps(iso) : null;
          const continentStats = !iso ? dataLoader.getContinentStats(cont) : null;
          const summary = formatCountrySummary(
            countryProps,
            continentStats,
            Boolean(iso),
            i18n.lang,
            i18n.t,
            store.subMode
          );
          navigator.clipboard
            ?.writeText(summary)
            .then(() => {
              audioManager.playClick();
              TerraHaptics.success();
            })
            .catch(() => {});
        }
      }

      // Do not trigger navigation shortcuts if a modal is open
      if (store.searchModalOpen || store.climateModalOpen) return;

      // Modifier-free keys (prevent intercepting browser tab shortcuts)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        // Quick switch category: 1 = Society, 2 = State, 3 = Nature
        if (e.key === '1' || e.code === 'Digit1') {
          e.preventDefault();
          audioManager.playSwitchCategory();
          store.setCategory('society');
        } else if (e.key === '2' || e.code === 'Digit2') {
          e.preventDefault();
          audioManager.playSwitchCategory();
          store.setCategory('state');
        } else if (e.key === '3' || e.code === 'Digit3') {
          e.preventDefault();
          audioManager.playSwitchCategory();
          store.setCategory('nature');
        } else if (e.key.toLowerCase() === 'p' || e.code === 'KeyP') {
          // Toggle 2D / 3D Projection
          if (store.projection === 'globe') {
            audioManager.playTo2D();
            store.setProjection('mercator');
          } else {
            audioManager.playTo3D();
            store.setProjection('globe');
          }
        } else if (e.key.toLowerCase() === 't' || e.code === 'KeyT') {
          // Toggle Dark / Light Theme
          if (store.theme === 'dark') {
            audioManager.playThemeLight();
          } else {
            audioManager.playThemeDark();
          }
          store.toggleTheme();
        } else if (e.key.toLowerCase() === 'l' || e.code === 'KeyL') {
          // Toggle Language (UK / EN)
          audioManager.playLanguageChange();
          i18n.setLang(i18n.lang === 'uk' ? 'en' : 'uk');
        } else if (
          e.key === '[' ||
          e.code === 'BracketLeft' ||
          e.key.toLowerCase() === 'b' ||
          e.code === 'KeyB'
        ) {
          // Toggle Desktop Sidebar
          store.toggleSidebarCollapsed();
          audioManager.playClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
