import { DataLoader } from './data/DataLoader.js';
import { MapEngine } from './map/MapEngine.js';
import { UIManager } from './ui/UIManager.js';
import I18nManager from './ui/I18nManager.js';
import { initClimateModal } from './ui/ClimateModal.js';
import { ExternalAPI } from './api/ExternalAPI.js';

// Пригнічення нешкідливої помилки ResizeObserver, яка засмічує консоль (характерно для WebGL/MapLibre)
window.addEventListener('error', e => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation?.();
    e.preventDefault();
  }
});

// ✅ Init climate modal IMMEDIATELY. As a module, this file runs after the DOM is parsed,
// so document.getElementById will work right away.
initClimateModal();

async function bootstrap() {
  try {
    const i18n = new I18nManager();
    i18n.init();

    const dataLoader = new DataLoader();
    const loaded = await dataLoader.loadAll();
    
    if (!loaded) {
      console.error("Failed to bootstrap data");
      return;
    }

    const mapEngine = new MapEngine('map');
    const uiManager = new UIManager(dataLoader, mapEngine, i18n);
    
    // Link map events to UI updates
    mapEngine.onCountrySelect = (isoA3, name) => uiManager.showCountryStats(isoA3, name);
    mapEngine.onContinentSelect = (continent) => uiManager.showContinentStats(continent);
    
    // Link UI events to map navigation
    uiManager.onFlyTo = (isoA3) => mapEngine.flyToCountry(isoA3, dataLoader.getGeoJson());
    
    // Initialize External API for 3rd-party tools
    const externalApi = new ExternalAPI(mapEngine, dataLoader, uiManager);
    
    await mapEngine.init(dataLoader);
    
    // Listen to language changes to update map
    i18n.onChange(() => {
      mapEngine.updateLanguage(i18n.currentLanguage);
      uiManager.refreshCurrentView();
      if (mapEngine.spaceEngine) {
        mapEngine.spaceEngine.updateMarkersLanguage(i18n.currentLanguage);
      }
    });
    
    // Show default global/continent stats on load
    uiManager.showContinentStats("World");

  } catch (error) {
    console.error("Critical Application Error:", error);
    document.getElementById('map').innerHTML = '<div style="color:white; text-align:center; padding:50px;">Помилка завантаження мапи. Спробуйте оновити сторінку.</div>';
  }
}

bootstrap();

