import * as THREE from 'three';

/**
 * SpaceBridge — єдиний міст між MapLibre GL JS та Three.js.
 * 
 * Реалізує MapLibre CustomLayerInterface, дозволяючи Three.js рендерити
 * ПРЯМО в WebGL-контексті MapLibre. Це забезпечує:
 * - 0 мікро-затримок (один кадр = одна відмальовка)
 * - 1 WebGL-контекст замість 2 (менше навантаження на GPU)
 * - Ідеальну синхронізацію камери без подій-посередників
 */
export class SpaceBridge {
  constructor(spaceEngine) {
    // MapLibre CustomLayerInterface обов'язкові поля
    this.id = 'space-engine-layer';
    this.type = 'custom';
    this.renderingMode = '3d';
    
    this.spaceEngine = spaceEngine;
    this.renderer = null;
    this.map = null;
  }

  /**
   * Викликається MapLibre, коли шар додається на карту.
   * Тут ми створюємо Three.js рендерер, що РОЗДІЛЯЄ WebGL-контекст з MapLibre.
   */
  onAdd(map, gl) {
    this.map = map;
    
    // Створюємо Three.js рендерер, що використовує ТОЙ САМИЙ WebGL-контекст і canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: false,
      alpha: true
    });
    
    // КРИТИЧНО: Three.js НЕ повинен очищувати canvas — це робить MapLibre
    this.renderer.autoClear = false;
    
    // Тонове відображення (HDR → SDR) для реалістичного освітлення
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Тіні від Сонця
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Передаємо рендерер у SpaceEngine (він більше не створює свій)
    this.spaceEngine.attachRenderer(this.renderer, this.map);
  }

  /**
   * Викликається MapLibre КОЖЕН КАДР — це наш єдиний рендер-цикл.
   * Вся магія тут: синхронізація камери + фізика + рендер в ОДНОМУ кадрі.
   */
  render(gl, matrix) {
    if (!this.spaceEngine || !this.spaceEngine.isActive || !this.renderer) return;
    
    // 1. Оновлюємо фізику (позиції планет, анімації, час)
    const now = performance.now();
    this.spaceEngine.updatePhysics(now);
    
    // 2. Синхронізуємо камеру Three.js з поточним станом MapLibre
    const center = this.map.getCenter();
    this.spaceEngine.syncCameraOnly(
      center.lng,
      center.lat,
      this.map.getPitch(),
      this.map.getBearing(),
      this.map.getZoom()
    );
    
    // 3. Зберігаємо стан WebGL MapLibre, рендеримо Three.js, відновлюємо стан
    this.renderer.resetState();
    this.renderer.render(this.spaceEngine.scene, this.spaceEngine.camera);
    this.renderer.resetState();
    
    // 4. Просимо MapLibre перемалювати наступний кадр (для безперервних анімацій)
    if (this.spaceEngine.mode !== 'none') {
      this.map.triggerRepaint();
    }
  }

  /**
   * Викликається MapLibre при видаленні шару. 
   * Вивантажуємо Three.js ресурси, щоб не було витоків пам'яті.
   */
  onRemove(map, gl) {
    if (this.spaceEngine) {
      this.spaceEngine.dispose();
    }
    this.renderer = null;
    this.map = null;
  }
}
