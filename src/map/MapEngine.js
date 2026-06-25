import maplibregl from 'maplibre-gl';
import { SpaceEngine } from './SpaceEngine.js';
import { SpaceBridge } from './SpaceBridge.js';

export class MapEngine {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.hoveredCountryId = null;
    this.selectedCountryId = null;
    this.onCountrySelect = null; // Callback for UI
    this.onContinentSelect = null; // Callback for UI
    this.spaceEngine = null;
  }

  async init(dataLoader, initialLang = 'uk') {
    const geoJsonData = dataLoader.geoJsonData;
    const labelsGeoJson = dataLoader.labelsGeoJson;
    // Реалістичний супутниковий стиль із "твердою основою" (Solid Earth Base)
    // Це запобігає ефекту "порожньої планети" (видимості зірок крізь Землю),
    // коли супутникові тайли не встигають завантажитися при екстремально швидкому обертанні.
    const style = {
      "version": 8,
      "projection": { "type": "globe" },
      "sources": {
        "world-base": {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": [
              // Західна півкуля (з нахлестом через нульовий меридіан)
              { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [[[-180, -85.0511], [5, -85.0511], [5, 85.0511], [-180, 85.0511], [-180, -85.0511]]] } },
              // Східна півкуля (з нахлестом через нульовий меридіан)
              { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [[[-5, -85.0511], [180, -85.0511], [180, 85.0511], [-5, 85.0511], [-5, -85.0511]]] } }
            ]
          }
        },
        "satellite": {
          "type": "raster",
          "tiles": [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          "tileSize": 256
        }
      },
      "layers": [
        {
          "id": "world-base-layer",
          "type": "fill",
          "source": "world-base",
          "paint": {
            "fill-color": "#081a26", // Темно-синій (колір глибокого океану)
            "fill-opacity": 1
          }
        },
        {
          "id": "satellite-layer",
          "type": "raster",
          "source": "satellite",
          "minzoom": 0,
          "maxzoom": 22
        }
      ]
    };

    this.map = new maplibregl.Map({
      container: this.containerId,
      style: style,
      center: [20, 20], // Centered roughly on Africa/Europe
      zoom: this.getOptimalZoom(),
      pitch: 22, // Глибокий 3D-кут для вираженого ефекту об'ємної планети
      maxPitch: 65, // Запобігає застряганню камери та "косому" руху біля самої поверхні
      maxZoom: 18,  // Золота середина для глобуса: дуже глибокий зум, але без зламів математики
      minZoom: 0,   // ДОЗВОЛЯЄ ВІДДАЛЯТИСЯ ВІД ЕКВАТОРА БЕЗ ВМИКАННЯ "СТІНИ"
      renderWorldCopies: true, 
      attributionControl: false,
      fadeDuration: 0, // Вимикає анімацію прояву тайлів (вони з'являтимуться миттєво, без "порожнечі")
      maxTileCacheSize: 2000 // Максимальний кеш тайлів у пам'яті (щоб всі зуми лишались)
    });

    // Налаштування згладжування зуму (вирішує проблему "різких ривків" біля екватора)
    this.map.scrollZoom.setWheelZoomRate(1 / 450); // Плавніший крок для звичайної мишки
    this.map.scrollZoom.setZoomRate(1 / 450);      // Плавніший крок для тачпадів

    return new Promise((resolve) => {
      this.map.on('load', () => {
        // Ініціалізація єдиного WebGL-пайплайну (SpaceBridge + SpaceEngine)
        // SpaceEngine створюється без контейнера (без власного canvas).
        // SpaceBridge вбудовує його прямо в WebGL-контекст MapLibre.
        this.spaceEngine = new SpaceEngine(null, initialLang);
        this.spaceEngine.map = this.map;
        this.spaceEngine.audioManager = this.audioManager;
        this.spaceBridge = new SpaceBridge(this.spaceEngine);
        
        // Додаємо космічний шар як ПЕРШУ верству (перед супутниковими тайлами).
        // Зірки та планети малюються ПЕРЕД глобусом — поверхня Землі природно їх перекриває.
        this.map.addLayer(this.spaceBridge, 'world-base-layer');

        // Enable globe mode
        this.currentProjection = 'globe';
        this.spaceEngine.setActive(true);

        // Додаємо елементи управління зумом
        this.map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

        // Add the GeoJSON sources
        this.map.addSource('countries', {
          'type': 'geojson',
          'data': geoJsonData,
          'generateId': true // Important for hover state
        });
        
        this.map.addSource('country-labels-source', {
          'type': 'geojson',
          'data': labelsGeoJson
        });

        // Add fill layer for countries with data-driven styling based on religion
        this.map.addLayer({
          'id': 'country-fills',
          'type': 'fill',
          'source': 'countries',
          'layout': {},
          'paint': {
            'fill-color': [
              'match',
              ['get', 'dominant_religion'],
              'Християнство', '#3498db', // Синій
              'Іслам', '#2ecc71',        // Зелений
              'Індуїзм', '#f39c12',      // Помаранчевий
              'Буддизм', '#e74c3c',      // Червоний
              'Атеїзм/Нерелігійні', '#95a5a6', // Сірий
              'Народні вірування', '#8e44ad', // Фіолетовий
              /* default */ 'rgba(255, 255, 255, 0.1)'
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], 0.6,
              ['boolean', ['feature-state', 'hover'], false], 0.4,
              0.15 // Базова видимість, щоб кольори релігій було трохи видно
            ]
          }
        });

        // Add line layer for country borders
        this.map.addLayer({
          'id': 'country-borders',
          'type': 'line',
          'source': 'countries',
          'layout': {},
          'paint': {
            'line-color': 'rgba(255, 255, 255, 0.5)',
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], 2,
              ['boolean', ['feature-state', 'hover'], false], 1.5,
              0.5
            ]
          }
        });

        // Add continent highlight layer
        this.map.addLayer({
          'id': 'continent-highlight',
          'type': 'fill',
          'source': 'countries',
          'filter': ['in', 'ISO3166-1-Alpha-3', 'NONE'],
          'paint': {
            'fill-color': 'rgba(255, 255, 255, 0.3)',
            'fill-outline-color': '#ffffff'
          }
        });

        // Add symbol layer for country names (using centroids to avoid duplicates)
        this.map.addLayer({
          'id': 'country-labels',
          'type': 'symbol',
          'source': 'country-labels-source',
          'layout': {
            'text-field': ['get', initialLang === 'uk' ? 'name_uk' : 'name_en'], // Apply initial language
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 12,
              3, 18,
              6, 28
            ],
            'text-anchor': 'center'
          },
          'paint': {
            'text-color': [
              'match',
              ['get', 'dominant_religion'],
              'Християнство', '#3498db',
              'Іслам', '#2ecc71',
              'Індуїзм', '#f39c12',
              'Буддизм', '#e74c3c',
              'Атеїзм/Нерелігійні', '#95a5a6',
              'Народні вірування', '#A2845E',
              'Юдаїзм', '#5AC8FA',
              '#ffffff'
            ],
            'text-halo-color': 'rgba(0, 0, 0, 0.8)',
            'text-halo-width': 1.5
          }
        });

        this.setupEvents();
        // Show map smoothly
        const container = document.getElementById(this.containerId);
        if (container) container.style.opacity = '1';

        resolve();
      });
    });
  }

  updateLanguage(lang) {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const field = lang === 'uk' ? 'name_uk' : 'name_en';
    if (this.map.getLayer('country-labels')) {
      this.map.setLayoutProperty('country-labels', 'text-field', ['get', field]);
    }
  }

  setLayerMode(mode) {
    if (!this.map || !this.map.isStyleLoaded()) return;
    
    if (mode === 'religion') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'match',
        ['get', 'dominant_religion'],
        'Християнство', '#3498db',
        'Іслам', '#2ecc71',
        'Індуїзм', '#f39c12',
        'Буддизм', '#e74c3c',
        'Атеїзм/Нерелігійні', '#95a5a6',
        'Народні вірування', '#8e44ad',
        'rgba(255, 255, 255, 0.1)'
      ]);
    } else if (mode === 'population') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'population'],
        0, '#ffffe5',
        1000000, '#f7fcb9',
        10000000, '#addd8e',
        50000000, '#41ab5d',
        100000000, '#238443',
        1000000000, '#005a32'
      ]);
    } else if (mode === 'demographics') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'density'],
        0, '#f1eef6',
        10, '#d0d1e6',
        50, '#a6bddb',
        100, '#74a9cf',
        300, '#2b8cbe',
        1000, '#045a8d'
      ]);
    } else if (mode === 'economy') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'gdpPerCapita'],
        0, '#f7fbff',
        2000, '#deebf7',
        10000, '#9ecae1',
        30000, '#4292c6',
        50000, '#08519c',
        80000, '#08306b'
      ]);
    } else if (mode === 'military') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'militarySpending'],
        0, '#fff5f0',
        1, '#fcbba1',
        2, '#fb6a4a',
        3, '#ef3b2c',
        4, '#cb181d',
        6, '#99000d'
      ]);
    } else if (mode === 'resources') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'cleanEnergy'],
        0, '#ffffe5',
        20, '#f7fcb9',
        40, '#d9f0a3',
        60, '#addd8e',
        80, '#41ab5d',
        100, '#005a32'
      ]);
    } else if (mode === 'politics') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'democracyIndex'],
        0, '#d73027',
        2, '#fc8d59',
        4, '#fee08b',
        6, '#d9ef8b',
        8, '#91cf60',
        10, '#1a9850'
      ]);
    } else if (mode === 'geography') {
      this.map.setPaintProperty('country-fills', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'highestPeak'],
        1000, '#e5f5e0',
        2000, '#a1d99b',
        3000, '#41ab5d',
        5000, '#74c476',
        7000, '#ffffff'
      ]);
    } else {
      // Default fallback for climate
      this.map.setPaintProperty('country-fills', 'fill-color', 'rgba(255, 255, 255, 0.1)');
    }
  }


  setProjection(type) {
    if (!this.map || !this.map.isStyleLoaded()) return;
    
    // 0. Зупиняємо будь-які поточні інерційні рухи
    this.map.stop();
    
    // Отримуємо центр. .wrap() КРИТИЧНО ВАЖЛИВИЙ: він скидає довготу в межі [-180, 180]. 
    // Без нього, якщо довго крутити глобус, перехід на 2D змусить камеру летіти через усю карту.
    const currentCenter = this.map.getCenter().wrap();
    const mapEl = document.getElementById('map');
    
    // 1. Лінійне і передбачуване віддалення камери (easeTo надійніше за flyTo для зум-ауту)
    this.map.easeTo({ zoom: 0.8, pitch: 0, bearing: 0, duration: 800, center: currentCenter });
    
    // 2. Thematic Fade Out
    setTimeout(() => {
      // Замість важкого CSS-blur використовуємо opacity для ідеальної плавності
      mapEl.style.transition = 'opacity 0.2s ease-in';
      mapEl.style.opacity = '0';
      
      // 3. Даємо браузеру час на застосування прозорості
      setTimeout(() => {
        this.map.setProjection({ type: type });
        // У 2D режимі вимикаємо дублювання карти, щоб світ не повторювався по горизонталі
        this.map.setRenderWorldCopies(type === 'globe');
        // Встановлюємо нахил
        this.map.jumpTo({ pitch: type === 'globe' ? 10 : 0, center: currentCenter });
        
        // Вмикаємо або вимикаємо зорі
        if (this.spaceEngine) {
          this.spaceEngine.setActive(type === 'globe');
        }
        if (this.audioManager) this.audioManager.startFlySound();
        this.map.once('moveend', () => {
          if (this.audioManager) this.audioManager.stopFlySound();
        });
        
        // 4. Починаємо політ назад
        this.map.flyTo({ center: currentCenter, zoom: 1.5, duration: 1500 });
        
        // 5. Плавно проявляємо карту
        setTimeout(() => {
            mapEl.style.transition = 'opacity 1.2s ease-out';
            mapEl.style.opacity = '1';
        }, 800); // 800мс - це середина польоту
      }, 200);
    }, 700);
  }

  setupEvents() {
    // Hover logic
    this.map.on('mousemove', 'country-fills', (e) => {
      if (e.features.length > 0) {
        const newHoverId = e.features[0].id;
        
        if (this.hoveredCountryId !== newHoverId) {
          if (this.hoveredCountryId !== null) {
            this.map.setFeatureState(
              { source: 'countries', id: this.hoveredCountryId },
              { hover: false }
            );
          }
          this.hoveredCountryId = newHoverId;
          this.map.setFeatureState(
            { source: 'countries', id: this.hoveredCountryId },
            { hover: true }
          );
          this.map.getCanvas().style.cursor = 'pointer';
        }
      }
    });

    this.map.on('mouseleave', 'country-fills', () => {
      if (this.hoveredCountryId !== null) {
        this.map.setFeatureState(
          { source: 'countries', id: this.hoveredCountryId },
          { hover: false }
        );
      }
      this.hoveredCountryId = null;
      this.map.getCanvas().style.cursor = '';
    });

    // Click logic
    this.map.on('click', 'country-fills', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        this.selectCountryFeature(feature);
        
        // Розумний плавний зум по кліку на країну
        this.flyToGeometryBounds(feature.geometry, feature.properties.center);
      }
    });

    // Click outside countries (on ocean)
    this.map.on('click', (e) => {
      const features = this.map.queryRenderedFeatures(e.point, { layers: ['country-fills'] });
      if (!features.length) {
        this.clearSelection();
        if (this.onContinentSelect) {
           this.onContinentSelect('World'); // Show global world stats if clicking ocean
        }
      }
    });
  }
  
  selectCountryFeature(feature) {
     if (this.selectedCountryId !== null) {
          this.map.setFeatureState(
            { source: 'countries', id: this.selectedCountryId },
            { selected: false }
          );
      }
      
      this.selectedCountryId = feature.id;
      this.map.setFeatureState(
          { source: 'countries', id: this.selectedCountryId },
          { selected: true }
      );
      
      // Clear continent highlight when a country is selected
      if (this.map.getLayer('continent-highlight')) {
          this.map.setFilter('continent-highlight', ['in', 'ISO3166-1-Alpha-3', 'NONE']);
      }

      const iso = feature.properties['ISO3166-1-Alpha-3'];
      if (this.onCountrySelect) {
         this.onCountrySelect(iso, feature.properties.name);
      }
  }

  selectContinentFeature(isoCodes) {
      this.clearSelection(); // Clear individual country selection
      
      if (!this.map.getLayer('continent-highlight')) return;

      if (!isoCodes || isoCodes.length === 0) {
          this.map.setFilter('continent-highlight', ['in', 'ISO3166-1-Alpha-3', 'NONE']);
          return;
      }
      
      this.map.setFilter('continent-highlight', ['in', 'ISO3166-1-Alpha-3', ...isoCodes]);
  }


  flyToGeometryBounds(geometry, fallbackCenter, isContinent = false) {
    let targetCam = null;
    
    if (geometry) {
      const bounds = new maplibregl.LngLatBounds();
      
      const processCoord = (coord) => {
        if (coord.length >= 2) bounds.extend(coord);
      };

      const getLargestPolygon = (multiPolyCoords) => {
        let maxArea = -1;
        let bestPoly = multiPolyCoords[0];
        multiPolyCoords.forEach(poly => {
            let pMinLng = 180, pMaxLng = -180, pMinLat = 90, pMaxLat = -90;
            const getB = (coords) => {
                coords.forEach(c => {
                    if (Array.isArray(c[0])) getB(c);
                    else {
                        if (c[0] < pMinLng) pMinLng = c[0];
                        if (c[0] > pMaxLng) pMaxLng = c[0];
                        if (c[1] < pMinLat) pMinLat = c[1];
                        if (c[1] > pMaxLat) pMaxLat = c[1];
                    }
                });
            };
            getB(poly);
            let lDiff = pMaxLng - pMinLng;
            if (lDiff < 0) lDiff += 360;
            const area = lDiff * (pMaxLat - pMinLat);
            if (area > maxArea) {
                maxArea = area;
                bestPoly = poly;
            }
        });
        return bestPoly;
      };

      if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach(ring => ring.forEach(processCoord));
      } else if (geometry.type === 'MultiPolygon') {
        const bestPoly = getLargestPolygon(geometry.coordinates);
        bestPoly.forEach(ring => ring.forEach(processCoord));
      } else if (geometry.type === 'GeometryCollection') {
        geometry.geometries.forEach(g => {
            if (g.type === 'Polygon') {
              g.coordinates.forEach(ring => ring.forEach(processCoord));
            } else if (g.type === 'MultiPolygon') {
              const bestPoly = getLargestPolygon(g.coordinates);
              bestPoly.forEach(ring => ring.forEach(processCoord));
            }
        });
      }

      // Check for antimeridian crossing (e.g. Russia, USA)
      const isAntiMeridian = (bounds.getEast() - bounds.getWest()) > 180;
      
      if (!bounds.isEmpty() && !isAntiMeridian) {
        targetCam = this.map.cameraForBounds(bounds, { padding: isContinent ? 20 : 80 });
      }
    }
    
    if (!targetCam && fallbackCenter) {
      targetCam = { center: fallbackCenter, zoom: isContinent ? 2.5 : 4 };
    }

    if (targetCam) {
      const finalZoom = isContinent ? Math.min(targetCam.zoom || 2, 4.5) : Math.min(targetCam.zoom || 4, 5.5);
      
      if (this.audioManager) this.audioManager.startFlySound();
      this.map.once('moveend', () => {
        if (this.audioManager) this.audioManager.stopFlySound();
      });
      
      this.map.flyTo({
        center: targetCam.center,
        zoom: finalZoom,
        essential: true,
        duration: 2500,
        speed: 0.8,
        curve: 1.1
      });
    }
  }

  flyToCountry(isoA3, geoJsonData) {
    if (!geoJsonData) return;
    
    const feature = geoJsonData.features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
    if (!feature) return;
    
    this.flyToGeometryBounds(feature.geometry, feature.properties.center);
    
    setTimeout(() => {
        const rendered = this.map.querySourceFeatures('countries', {
            filter: ['==', 'ISO3166-1-Alpha-3', isoA3]
        });
        if (rendered.length > 0) {
            this.selectCountryFeature(rendered[0]);
        }
    }, 500);
  }

  flyToContinent(continentName, geoJsonData) {
    if (!geoJsonData) return;

    const fallbackCenters = {
      'World': [0, 20],
      'Asia': [90, 30],
      'Europe': [15, 50],
      'Africa': [20, 0],
      'North America': [-100, 45],
      'South America': [-60, -15],
      'Oceania': [140, -25]
    };

    const enToUk = {
      'Азія': 'Asia',
      'Європа': 'Europe',
      'Африка': 'Africa',
      'Північна Америка': 'North America',
      'Південна Америка': 'South America',
      'Океанія': 'Oceania',
      'Глобально (Світ)': 'World',
      'Світ': 'World'
    };
    
    const engName = enToUk[continentName] || continentName;
    
    if (engName === 'World') {
      if (this.audioManager) this.audioManager.startFlySound();
      this.map.once('moveend', () => {
        if (this.audioManager) this.audioManager.stopFlySound();
      });

      this.map.flyTo({
        center: [0, 20],
        zoom: this.getOptimalZoom(),
        essential: true,
        duration: 2500,
        speed: 0.8,
        curve: 1.1
      });
      return;
    }

    const features = geoJsonData.features.filter(f => f.properties.continent === engName);
    if (features.length === 0) return;

    const geometries = features.map(f => f.geometry).filter(g => g);
    const combinedGeometry = {
      type: 'GeometryCollection',
      geometries: geometries
    };

    this.flyToGeometryBounds(combinedGeometry, fallbackCenters[engName], true);
  }

  clearSelection() {
     if (this.selectedCountryId !== null) {
          this.map.setFeatureState(
            { source: 'countries', id: this.selectedCountryId },
            { selected: false }
          );
      }
      this.selectedCountryId = null;
  }

  // Обчислює ідеальний масштаб Землі залежно від роздільної здатності вікна (допомагає для 1080p, 4K та мобільних)
  getOptimalZoom() {
    const minDimension = Math.min(window.innerWidth, window.innerHeight);
    // Для екрану висотою ~720px ідеальний зум був 1.5. 
    // Оскільки MapLibre працює за експоненційною шкалою (база 2), використовуємо логарифм.
    let optimal = 1.5 + Math.log2(minDimension / 720);
    // Обмежуємо мінімальний та максимальний зум для безпеки
    if (optimal < 0.5) optimal = 0.5;
    if (optimal > 3.0) optimal = 3.0;
    return optimal;
  }
}
