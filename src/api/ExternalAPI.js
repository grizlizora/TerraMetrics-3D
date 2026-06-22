import * as THREE from 'three';
import { StreamManager } from './StreamManager.js';

export class ExternalAPI {
  constructor(mapEngine, dataLoader, uiManager) {
    this.mapEngine = mapEngine;
    this.dataLoader = dataLoader;
    this.uiManager = uiManager;
    this.streamManager = new StreamManager();
    
    // Register globally for external scripts/tools
    window.TerraMetricsAPI = this;
    
    // Live UI API State
    this.observer = null;
    this.lastStateHash = '';
    
    // Setup UI Observer
    this.setupObserver();
    setTimeout(() => this.broadcastUpdate(), 1000);
    
    console.log("🌍 TerraMetricsAPI initialized globally. Ready for external connections.");
  }
  
  // -- UI Live API Methods --
  
  getVisibleControls() {
    return this.scanUI();
  }
  
  onUpdate(callback) {
    window.addEventListener('terra-api-update', (e) => callback(e.detail));
  }
  
  setupObserver() {
    const targetNode = document.body;
    const config = { attributes: true, childList: true, subtree: true, attributeFilter: ['class', 'style', 'data-api-action'] };

    let timeout = null;
    const callback = (mutationsList) => {
      const relevantChange = mutationsList.some(m => {
        if (m.target.hasAttribute && m.target.hasAttribute('data-api-id')) return true;
        if (m.target.querySelector && m.target.querySelector('[data-api-id]')) return true;
        return false;
      });

      if (relevantChange) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.broadcastUpdate();
        }, 150);
      }
    };

    this.observer = new MutationObserver(callback);
    this.observer.observe(targetNode, config);
  }

  scanUI() {
    const elements = document.querySelectorAll('[data-api-id]');
    const controls = [];

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        return;
      }
      
      let parent = el.parentElement;
      let isVisible = true;
      while (parent && parent !== document.body) {
        const pStyle = window.getComputedStyle(parent);
        if (pStyle.display === 'none' || pStyle.visibility === 'hidden' || parseFloat(pStyle.opacity) === 0) {
          isVisible = false;
          break;
        }
        parent = parent.parentElement;
      }

      if (!isVisible) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
        return;
      }

      controls.push({
        id: el.getAttribute('data-api-id'),
        text: el.innerText.trim() || el.getAttribute('title') || '',
        action: el.getAttribute('data-api-action'),
        isActive: el.classList.contains('active'),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          centerX: Math.round(rect.x + rect.width / 2),
          centerY: Math.round(rect.y + rect.height / 2)
        }
      });
    });

    return controls;
  }

  broadcastUpdate() {
    const currentState = this.scanUI();
    const stateHash = JSON.stringify(currentState.map(c => c.id + c.isActive + c.rect.x + c.rect.y + c.rect.width));
    if (this.lastStateHash === stateHash) return;
    
    this.lastStateHash = stateHash;

    const event = new CustomEvent('terra-api-update', {
      detail: {
        timestamp: Date.now(),
        controls: currentState
      }
    });
    window.dispatchEvent(event);
  }

  clickControl(id) {
    const el = document.querySelector(`[data-api-id="${id}"]`);
    if (el) {
      el.click();
      return true;
    }
    console.warn(`TerraMetricsAPI: Control with id '${id}' not found or not clickable.`);
    return false;
  }
  
  // -- Нові методи для трансляції (Video Streaming) --
  async startLiveStream(options) {
    return await this.streamManager.startLiveStream(options);
  }
  
  stopLiveStream() {
    this.streamManager.stopLiveStream();
  }
  
  async recordStream(options) {
    return await this.streamManager.recordStream(options);
  }
  
  stopRecording() {
    this.streamManager.stopRecording();
  }
  
  /**
   * Отримує поточний стан камери (і в 2D, і в 3D просторах)
   */
  getCameraState() {
    const is3D = this.mapEngine.projection === 'globe' && this.mapEngine.spaceEngine?.isActive;
    const state = { mode: is3D ? '3D' : '2D' };
    
    // Mapbox camera
    if (this.mapEngine.map) {
      const center = this.mapEngine.map.getCenter();
      state.mapbox = {
        lng: center.lng,
        lat: center.lat,
        zoom: this.mapEngine.map.getZoom(),
        pitch: this.mapEngine.map.getPitch(),
        bearing: this.mapEngine.map.getBearing()
      };
    }
    
    // SpaceEngine camera
    if (this.mapEngine.spaceEngine && this.mapEngine.spaceEngine.camera) {
      const cam = this.mapEngine.spaceEngine.camera;
      state.space = {
        position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        rotation: { x: cam.rotation.x, y: cam.rotation.y, z: cam.rotation.z }
      };
    }
    
    return state;
  }
  
  /**
   * Отримує 3D координати Землі та Місяця (і Сонця)
   */
  getEarthAndMoonPosition() {
    const state = {
      earth: { position: { x: 0, y: 0, z: 0 } }, // Земля завжди в центрі SpaceEngine
      moon: null,
      sun: null
    };
    
    const se = this.mapEngine.spaceEngine;
    if (se) {
      if (se.moonMesh) {
        state.moon = { position: { x: se.moonMesh.position.x, y: se.moonMesh.position.y, z: se.moonMesh.position.z } };
      }
      if (se.sunMesh) {
        state.sun = { position: { x: se.sunMesh.position.x, y: se.sunMesh.position.y, z: se.sunMesh.position.z } };
      }
    }
    
    return state;
  }
  
  /**
   * Перевіряє, які об'єкти зараз потрапляють в поле зору (в кадр)
   */
  getObjectsInFieldOfView() {
    const visibleObjects = {
      planets: [],
      countries: [],
      continents: []
    };
    
    const se = this.mapEngine.spaceEngine;
    const is3D = this.mapEngine.projection === 'globe' && se?.isActive;
    
    // Check 3D space objects
    if (is3D && se.camera) {
      const frustum = new THREE.Frustum();
      const projScreenMatrix = new THREE.Matrix4();
      projScreenMatrix.multiplyMatrices(se.camera.projectionMatrix, se.camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);
      
      const checkMesh = (mesh, name) => {
        if (!mesh || !mesh.visible) return;
        
        let inView = false;
        // Bounding sphere check
        if (mesh.geometry && mesh.geometry.boundingSphere) {
           const sphere = mesh.geometry.boundingSphere.clone();
           sphere.applyMatrix4(mesh.matrixWorld);
           inView = frustum.intersectsSphere(sphere);
        } else {
           // Point check fallback
           const pos = new THREE.Vector3();
           mesh.getWorldPosition(pos);
           inView = frustum.containsPoint(pos);
        }
        
        if (inView) {
          visibleObjects.planets.push(name);
        }
      };
      
      if (se.sunMesh) checkMesh(se.sunMesh, 'Sun');
      if (se.moonMesh) checkMesh(se.moonMesh, 'Moon');
      
      if (se.planetaryBodies) {
        se.planetaryBodies.forEach(body => {
          checkMesh(body.mesh, body.name);
        });
      }
    }
    
    // Check Mapbox 2D objects (Countries & Continents on Earth)
    if (this.mapEngine.map) {
      try {
        const features = this.mapEngine.map.queryRenderedFeatures({ layers: ['country-fills'] });
        const uniqueIso = new Set();
        const uniqueCont = new Set();
        
        features.forEach(f => {
           if (f.properties['ISO3166-1-Alpha-3']) uniqueIso.add(f.properties['ISO3166-1-Alpha-3']);
           if (f.properties.continent) uniqueCont.add(f.properties.continent);
        });
        
        visibleObjects.countries = Array.from(uniqueIso);
        visibleObjects.continents = Array.from(uniqueCont);
      } catch (e) {
        // May fail if style not loaded yet
      }
    }
    
    return visibleObjects;
  }
  
  /**
   * Розраховує параметри фокусу для об'єкта
   */
  calculateFocusParams(targetName) {
    const se = this.mapEngine.spaceEngine;
    
    // 1. Is it a Space object?
    if (se) {
      let targetMesh = null;
      if (targetName.toLowerCase() === 'sun') targetMesh = se.sunMesh;
      else if (targetName.toLowerCase() === 'moon') targetMesh = se.moonMesh;
      else if (se.planetaryBodies) {
        const body = se.planetaryBodies.find(b => b.name.toLowerCase() === targetName.toLowerCase());
        if (body) targetMesh = body.mesh;
      }
      
      if (targetMesh) {
         const pos = new THREE.Vector3();
         targetMesh.getWorldPosition(pos);
         return { type: '3d_object', position: { x: pos.x, y: pos.y, z: pos.z } };
      }
    }
    
    // 2. Is it a country?
    const geoJson = this.dataLoader.getGeoJson();
    if (geoJson) {
      const countryFeature = geoJson.features.find(f => 
        f.properties['ISO3166-1-Alpha-3'].toLowerCase() === targetName.toLowerCase() ||
        (f.properties.name && f.properties.name.toLowerCase() === targetName.toLowerCase())
      );
      
      if (countryFeature) {
        return { type: 'country', iso: countryFeature.properties['ISO3166-1-Alpha-3'], center: countryFeature.properties.center, geometry: countryFeature.geometry };
      }
      
      // 3. Is it a continent?
      const enToUk = {
        'азія': 'Asia', 'європа': 'Europe', 'африка': 'Africa', 
        'північна америка': 'North America', 'південна америка': 'South America', 
        'океанія': 'Oceania', 'світ': 'World'
      };
      const engName = enToUk[targetName.toLowerCase()] || targetName;
      const continentFeatures = geoJson.features.filter(f => f.properties.continent && f.properties.continent.toLowerCase() === engName.toLowerCase());
      
      if (continentFeatures.length > 0 || engName.toLowerCase() === 'world') {
        return { type: 'continent', name: engName };
      }
    }
    
    return null;
  }
  
  /**
   * Виконує фокусування (рух камери) на заданий об'єкт
   */
  focusOn(targetName) {
    const params = this.calculateFocusParams(targetName);
    if (!params) {
      console.warn(`TerraMetricsAPI: Об'єкт '${targetName}' не знайдено.`);
      return false;
    }
    
    if (params.type === '3d_object') {
       console.log("TerraMetricsAPI: Координати об'єкта:", params.position);
       console.warn("TerraMetricsAPI: Фокусування на 3D планетах автоматично не реалізовано через прив'язку камери до поверхні Землі в Mapbox.");
       // Тут сторонній код може розрахувати власну траєкторію
       return params;
    } else if (params.type === 'country') {
       this.mapEngine.flyToGeometryBounds(params.geometry, params.center);
       if (this.uiManager) {
           const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === params.iso);
           this.uiManager.showCountryStats(params.iso, feature ? feature.properties.name : params.iso);
       }
       return true;
    } else if (params.type === 'continent') {
       this.mapEngine.flyToContinent(params.name, this.dataLoader.getGeoJson());
       if (this.uiManager) {
           this.uiManager.showContinentStats(params.name);
       }
       return true;
    }
    return false;
  }
}
