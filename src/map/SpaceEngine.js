import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { CONSTELLATIONS, DEEP_SPACE_OBJECTS } from './DeepSpaceData.js';

export class SpaceEngine {
  constructor(containerId, initialLang = 'uk') {
    this.containerId = containerId;
    this.container = containerId ? document.getElementById(containerId) : null;
    this.isActive = true; // Активно тільки для 3D глобуса
    this.bridged = false; // true = рендером керує SpaceBridge (єдиний canvas)
    this.currentLang = initialLang;
    
    this.init();
  }

  init() {
    // Сцена (створюється завжди, навіть без контейнера)
    this.scene = new THREE.Scene();
    
    this.markers = []; // Масив спрайтів позначок
    this.markerData = []; // Дані для оновлення (ім'я, переклади, колір)
    this.sharedReticles = {}; // Кеш для кружечків
    this.labelsVisible = true; // Стан позначок (true = завжди видно, false = тільки при наведенні)
    
    // Трекінг миші для hover-ефекту (слухаємо глобально, оскільки Mapbox може перекривати canvas)
    this.mouse = new THREE.Vector2(-9999, -9999);
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    // Запускаємо анімацію (лише у standalone-режимі; у bridged режимі SpaceBridge керує циклом)
    this.animate = this.animate.bind(this);
    
    // Ініціалізація камери космосу
    this.camera = new THREE.PerspectiveCamera(
      45, 
      window.innerWidth / window.innerHeight, 
      1000, // ВАЖЛИВО: near=1000 вирішує проблему артефактів (Z-fighting) для гіганських об'єктів
      50000000
    );
    // Початкова позиція в центрі сфери
    this.camera.position.set(0, 0, 0);

    // Renderer створюється лише у standalone-режимі (з контейнером).
    // У bridged-режимі renderer прийде через attachRenderer() від SpaceBridge.
    this.renderer = null;

    // Створення космічних об'єктів
    this.createStars();
    this.createDeepSpaceObjects();
    
    this.planetaryBodies = [];
    this.flashes = [];
    this.lastTime = performance.now();
    
    // Орбітальний час (у днях) та масштаб швидкості. 
    // Ви геніально підмітили: оскільки ми збільшили візуальний розмір планет (~100x), 
    // ми повинні пропорційно збільшити їхню базову швидкість, інакше вони здаватимуться нерухомими гігантами.
    // Синхронізація з реальним календарем: Епоха J2000
    const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
    this.simTimeDays = (Date.now() - J2000) / 86400000;
    this.timeScale = 1; // Режим "Прямий ефір": 1 секунда реального часу = 1 секунда симуляції

    const flashTex = this.createFlashTexture();
    for (let i = 0; i < 15; i++) {
      const mat = new THREE.SpriteMaterial({ map: flashTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      this.flashes.push({ sprite, active: false, life: 0, maxLife: 1000, baseScale: 1 });
      this.scene.add(sprite);
    }

    this.createSun();
    this.createLights(); // Світло від Сонця
    this.createMoon();
    this.createPlanets();
    this.setMode('none'); // Початковий режим: Вимкнено

    // Обробка зміни розміру вікна (Debounced для оптимізації)
    this.resizeTimeout = null;
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.onWindowResize();
      }, 150);
    }, false);
  }

  /**
   * Підключення зовнішнього рендерера (від SpaceBridge).
   * Після виклику SpaceEngine працює у bridged-режимі:
   * - Рендером керує SpaceBridge.render()
   * - Власний rAF-цикл не запускається
   */
  attachRenderer(renderer, map) {
    this.renderer = renderer;
    this.map = map;
    this.bridged = true;
    console.log('[SpaceEngine] Attached to shared WebGL context (bridged mode)');
  }

  /**
   * Оновлення камери БЕЗ рендерингу.
   * Використовується SpaceBridge для синхронізації камери в єдиному кадрі.
   */
  syncCameraOnly(lng, lat, pitch, bearing, zoom = 1) {
    if (!this.camera) return;

    const deg2rad = Math.PI / 180;
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(
      (-lat + pitch) * deg2rad,
      -lng * deg2rad,
      -bearing * deg2rad,
      "YXZ"
    );

    const earthRadius = 100;
    const distance = earthRadius + 400 / Math.pow(2, Math.max(0, zoom - 1));
    this.camera.translateZ(distance);
  }

  /**
   * Оновлення фізики (позиції планет, анімації) БЕЗ рендерингу.
   * Використовується SpaceBridge.render() для оновлення стану кожного кадру.
   */
  updatePhysics(time) {
    if (!this.isActive) return;

    const dt = time - this.lastTime;
    this.lastTime = time;
    if (dt <= 0 || dt > 1000) return; // Захист від першого кадру та пауз вкладки

    this.simTimeDays += ((dt / 1000) * this.timeScale) / 86400;
    this._runPhysicsFrame(time, dt);
  }

  createStars() {
    const starCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount); 

    const famousStars = [
      { name: 'Betelgeuse', ra: 5.9, dec: 7.4, color: 0xffaa55, size: 8, candidate: true }, 
      { name: 'Antares', ra: 16.5, dec: -26.4, color: 0xff8844, size: 7.5, candidate: true }, 
      { name: 'Rigel', ra: 5.2, dec: -8.2, color: 0xaaffff, size: 7.8, candidate: true }, 
      { name: 'Eta Carinae', ra: 10.7, dec: -59.7, color: 0xffffff, size: 7.0, candidate: true }, 
      { name: 'Spica', ra: 13.4, dec: -11.1, color: 0x88bbff, size: 7.2, candidate: true }, 
      { name: 'Sirius', ra: 6.7, dec: -16.7, color: 0xffffff, size: 9.0, candidate: false }, 
      { name: 'Canopus', ra: 6.4, dec: -52.7, color: 0xffffee, size: 8.5, candidate: false }
    ];

    this.starsGroup = new THREE.Group();
    this.scene.add(this.starsGroup);

    let i = 0;
    this.supernovaCandidates = [];

    famousStars.forEach(star => {
      const theta = (star.ra / 24) * Math.PI * 2;
      const phi = (90 - star.dec) * (Math.PI / 180);
      const r = 45000000; // Фізично коректна нескінченність на краю камери
      
      const j2000_x = r * Math.sin(phi) * Math.cos(theta);
      const j2000_y = r * Math.sin(phi) * Math.sin(theta);
      const j2000_z = r * Math.cos(phi);
      
      positions[i * 3] = j2000_y;
      positions[i * 3 + 1] = j2000_z;
      positions[i * 3 + 2] = j2000_x;
      
      const color = new THREE.Color(star.color);
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
      sizes[i] = star.size * 2.5; // Збільшено пропорційно до нових розмірів
      phases[i] = Math.random() * Math.PI * 2;
      
      // Додаємо позначку для знаменитої зірки поза Сонячною системою
      const dummy = new THREE.Group();
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      this.starsGroup.add(dummy);
      this.createMarker(dummy, star.name, '#' + color.getHexString());

      if (star.candidate) {
        this.supernovaCandidates.push({ index: i, originalColor: color.clone(), name: star.name });
      }
      i++;
    });

    for (; i < starCount; i++) {
      let phi, theta;
      if (Math.random() < 0.6) {
        const bandSpread = (Math.random() - 0.5) * 0.5; 
        phi = Math.PI / 2 + bandSpread;
        theta = Math.random() * Math.PI * 2;
      } else {
        phi = Math.acos(2 * Math.random() - 1);
        theta = Math.random() * Math.PI * 2;
      }
      
      const r = 45000000; // Зірки фону також на краю Сонячної системи
      let vx = r * Math.sin(phi) * Math.cos(theta);
      let vy = r * Math.sin(phi) * Math.sin(theta);
      let vz = r * Math.cos(phi);
      
      const tilt = Math.PI / 4;
      positions[i * 3] = vx;
      positions[i * 3 + 1] = vy * Math.cos(tilt) - vz * Math.sin(tilt);
      positions[i * 3 + 2] = vy * Math.sin(tilt) + vz * Math.cos(tilt);
      
      let c = new THREE.Color();
      const randType = Math.random();
      if (randType < 0.1) c.setHex(0xffaa55); 
      else if (randType < 0.3) c.setHex(0xffddaa); 
      else if (randType < 0.9) c.setHex(0xffffff); 
      else c.setHex(0xaaffff); 
      
      // Яскравість адаптована під ToneMapping, але МЕНША за bloomPass.threshold (5.0), щоб зорі НЕ "розмивалися" в плями!
      const brightness = 1.0 + Math.random() * 1.5;
      colors[i * 3] = c.r * brightness; colors[i * 3 + 1] = c.g * brightness; colors[i * 3 + 2] = c.b * brightness;
      sizes[i] = 3 + Math.random() * 4; // Реалістичний дрібний розмір
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const vertexShader = `
      attribute float size;
      attribute float phase;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        vColor = color;
        vPhase = phase;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size; // Зірки в реальності не зменшуються з відстанню, вони є точковими джерелами світла
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform float atmosphere;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if(ll > 0.5) discard;
        
        // В атмосфері (atmosphere = 1.0) зорі сильно мерехтять через заломлення світла
        // У космосі (atmosphere = 0.0) зорі світять абсолютно стабільно і монолітно
        float twinkleAmount = 0.6 * atmosphere;
        float twinkle = (1.0 - twinkleAmount) + twinkleAmount * sin(time * 3.0 + vPhase);
        
        float alpha = (0.5 - ll) * 2.0;
        gl_FragColor = vec4(vColor * twinkle, alpha * twinkle);
      }
    `;

    this.starUniforms = { 
      time: { value: 0 },
      atmosphere: { value: 1.0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.starUniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starfield = new THREE.Points(geometry, material);
    this.starfield.renderOrder = -10; // Зірки завжди найдалі (на самому фоні)
    this.starsGroup.add(this.starfield);
  }

  createDeepSpaceObjects() {
    this.deepSpaceGroup = new THREE.Group();
    this.deepSpaceGroup.visible = false; // Вимкнено за замовчуванням
    this.scene.add(this.deepSpaceGroup);
    
    // Сузір'я
    CONSTELLATIONS.forEach(constellation => {
      const group = new THREE.Group();
      
      const starPositions = [];
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: new THREE.Color(constellation.color), 
        transparent: true, 
        opacity: 0.3 
      });

      constellation.stars.forEach((star, index) => {
        const theta = (star.ra / 24) * Math.PI * 2;
        const phi = (90 - star.dec) * (Math.PI / 180);
        const r = 45000000;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        starPositions[index] = new THREE.Vector3(y, z, x);
        
        const dummy = new THREE.Group();
        dummy.position.copy(starPositions[index]);
        group.add(dummy);
        
        const id = `DS_${constellation.id}_${index}`;
        
        // Створюємо комбіновану назву для зірки та сузір'я
        const starNameObj = {
          en: star.name ? `${star.name.en} (${constellation.name.en})` : constellation.name.en,
          uk: star.name ? `${star.name.uk} (${constellation.name.uk})` : constellation.name.uk
        };
        SpaceEngine.BODY_NAMES[id] = starNameObj;
        
        dummy.userData = { 
          isDeepSpace: true,
          nameObj: starNameObj,
          type: 'constellation'
        };

        this.createMarker(dummy, id, constellation.color);
      });

      // Лінії
      const linePoints = [];
      constellation.lines.forEach(pair => {
        linePoints.push(starPositions[pair[0]]);
        linePoints.push(starPositions[pair[1]]);
      });
      
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lines = new THREE.LineSegments(geometry, lineMaterial);
      group.add(lines);
      
      this.deepSpaceGroup.add(group);
    });

    this.sharedDSMaterials = this.sharedDSMaterials || {};

    const getDSMaterial = (type, color) => {
      const key = `${type}_${color}`;
      if (this.sharedDSMaterials[key]) return this.sharedDSMaterials[key];

      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      
      if (type === 'galaxy') {
          ctx.ellipse(64, 64, 60, 20, Math.PI/4, 0, Math.PI*2);
      } else if (type === 'nebula' || type === 'cluster') {
          ctx.arc(64, 64, 50, 0, Math.PI*2);
      } else if (type === 'exoplanet') {
          ctx.arc(64, 64, 25, 0, Math.PI*2);
      } else if (type === 'star_peculiar') {
          // Зірка з променями
          ctx.arc(64, 64, 20, 0, Math.PI*2);
          ctx.moveTo(64, 10); ctx.lineTo(64, 118);
          ctx.moveTo(10, 64); ctx.lineTo(118, 64);
          ctx.lineWidth = 4;
          ctx.strokeStyle = grad;
          ctx.stroke();
      }
      ctx.fill();
      
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ 
        map: tex, 
        color: 0xffffff, 
        transparent: true, 
        blending: THREE.AdditiveBlending,
        depthWrite: false // Запобігає проблемам з Z-буфером для напівпрозорих об'єктів
      });
      this.sharedDSMaterials[key] = mat;
      return mat;
    };

    // Далекі об'єкти
    DEEP_SPACE_OBJECTS.forEach(obj => {
      const theta = (obj.ra / 24) * Math.PI * 2;
      const phi = (90 - obj.dec) * (Math.PI / 180);
      const r = 45000000;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const dummy = new THREE.Group();
      dummy.position.set(y, z, x);
      
      if (obj.type === 'blackhole') {
        const bhGeo = new THREE.CircleGeometry(r * 0.005, 32);
        const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
        const bhMesh = new THREE.Mesh(bhGeo, bhMat);
        bhMesh.renderOrder = -5; // Далекий космос поверх зірок, але під системою
        bhMesh.lookAt(0, 0, 0); // Повертаємо до центру
        
        // Додамо акреційний диск
        const diskGeo = new THREE.RingGeometry(r * 0.006, r * 0.012, 32);
        const diskMat = new THREE.MeshBasicMaterial({ color: obj.color || 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false });
        const diskMesh = new THREE.Mesh(diskGeo, diskMat);
        diskMesh.renderOrder = -5;
        diskMesh.lookAt(0, 0, 0);
        diskMesh.rotation.x += Math.PI / 3;
        
        dummy.add(bhMesh);
        dummy.add(diskMesh);
      } else {
        const mat = getDSMaterial(obj.type, obj.color);
        const sprite = new THREE.Sprite(mat);
        sprite.renderOrder = -5; // Далекий космос під системою
        let scaleMult = 0.02;
        if (obj.type === 'exoplanet') scaleMult = 0.005;
        if (obj.type === 'star_peculiar') scaleMult = 0.015;
        sprite.scale.set(r * scaleMult, r * scaleMult, 1);
        dummy.add(sprite);
      }
      
      dummy.userData = { 
        isDeepSpace: true,
        nameObj: obj.name,
        type: obj.type
      };
      
      const id = `DS_${obj.id}`;
      SpaceEngine.BODY_NAMES[id] = obj.name;
      this.deepSpaceGroup.add(dummy);
      this.createMarker(dummy, id, obj.haloColor || obj.color);
    });
  }

  setDeepSpaceVisible(visible) {
    if (this.deepSpaceGroup) {
      this.deepSpaceGroup.visible = visible;
    }
  }

  createGlowTexture() {
    // Цей метод більше не використовується для Сонця (замінений на ShaderMaterial),
    // але залишений для сумісності з іншими елементами, якщо такі є.
    return null;
  }

  createMoonGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    // В космосі немає атмосфери, тому Місяць майже не має ореолу
    // Лише мікроскопічний відблиск на лінзі камери
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); 
    gradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.03)'); 
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    
    return new THREE.CanvasTexture(canvas);
  }

  createFlashTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)'); 
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)'); 
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)'); 
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  createProceduralTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (type === 'jupiter') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.1) * Math.sin(y * 0.05) + Math.cos(y * 0.2);
        ctx.fillStyle = `rgb(${Math.floor(200 + noise * 55)}, ${Math.floor(170 + noise * 50)}, ${Math.floor(130 + noise * 40)})`;
        ctx.fillRect(0, y, 512, 1);
      }
      ctx.fillStyle = 'rgba(180, 80, 50, 0.8)';
      ctx.beginPath(); ctx.ellipse(256, 170, 30, 15, 0, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'saturn') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.15) + Math.cos(y * 0.05);
        ctx.fillStyle = `rgb(${Math.floor(230 + noise * 25)}, ${Math.floor(210 + noise * 25)}, ${Math.floor(170 + noise * 25)})`;
        ctx.fillRect(0, y, 512, 1);
      }
    } else if (type === 'mars') {
      ctx.fillStyle = 'rgb(180, 80, 50)';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(100, 40, 20, 0.4)';
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random()*512, Math.random()*256, 20+Math.random()*40, 10+Math.random()*20, Math.random()*Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'uranus') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.05);
        ctx.fillStyle = `rgb(${Math.floor(200 + noise * 10)}, ${Math.floor(230 + noise * 10)}, ${Math.floor(240 + noise * 10)})`; // Soft cyan
        ctx.fillRect(0, y, 512, 1);
      }
    } else if (type === 'neptune') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.2) + Math.cos(y * 0.08);
        ctx.fillStyle = `rgb(${Math.floor(40 + noise * 20)}, ${Math.floor(80 + noise * 30)}, ${Math.floor(200 + noise * 40)})`; // Deep azure blue
        ctx.fillRect(0, y, 512, 1);
      }
      ctx.fillStyle = 'rgba(20, 40, 150, 0.6)';
      ctx.beginPath(); ctx.ellipse(150, 140, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'titan') {
      ctx.fillStyle = 'rgb(220, 140, 40)'; // Dense orange atmosphere
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = 'rgba(255, 180, 80, 0.1)';
        ctx.beginPath();
        ctx.arc(Math.random()*512, Math.random()*256, 10+Math.random()*40, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'pluto') {
      ctx.fillStyle = 'rgb(140, 110, 90)'; // Tan/Brown base
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(240, 230, 210, 0.8)'; // Bright icy heart (Tombaugh Regio)
      ctx.beginPath(); 
      ctx.ellipse(230, 130, 40, 50, -0.3, 0, Math.PI * 2); 
      ctx.ellipse(280, 130, 40, 50, 0.3, 0, Math.PI * 2); 
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(195, 150); ctx.lineTo(315, 150); ctx.lineTo(255, 210); ctx.fill();
    } else if (type === 'charon') {
      ctx.fillStyle = 'rgb(120, 120, 120)'; // Grey base
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(100, 40, 30, 0.8)'; // Mordor Macula
      ctx.fillRect(0, 0, 512, 40); 
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
        ctx.beginPath(); ctx.arc(Math.random()*512, Math.random()*256, 5+Math.random()*15, 0, Math.PI * 2); ctx.fill();
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  static BODY_NAMES = {
    'Sun':         { uk: '☀️ Сонце',   en: '☀️ Sun' },
    'Moon':        { uk: '🌕 Місяць',  en: '🌕 Moon' },
    'Mercury':     { uk: '☿ Меркурій', en: '☿ Mercury' },
    'Venus':       { uk: '♀ Венера',   en: '♀ Venus' },
    'Mars':        { uk: '♂ Марс',     en: '♂ Mars' },
    'Jupiter':     { uk: '♃ Юпітер',  en: '♃ Jupiter' },
    'Saturn':      { uk: '♄ Сатурн',  en: '♄ Saturn' },
    'Uranus':      { uk: '⛢ Уран',    en: '⛢ Uranus' },
    'Neptune':     { uk: '♆ Нептун',  en: '♆ Neptune' },
    'Pluto':       { uk: '🔵 Плутон',  en: '🔵 Pluto' },
    'Titan':       { uk: 'Титан',      en: 'Titan' },
    'Charon':      { uk: 'Харон',      en: 'Charon' },
    'Io':          { uk: 'Іо',         en: 'Io' },
    'Europa':      { uk: 'Європа',     en: 'Europa' },
    'Ganymede':    { uk: 'Ганімед',    en: 'Ganymede' },
    'Callisto':    { uk: 'Калісто',    en: 'Callisto' },
    'Betelgeuse':  { uk: 'Бетельгейзе',en: 'Betelgeuse' },
    'Antares':     { uk: 'Антарес',    en: 'Antares' },
    'Rigel':       { uk: 'Рігель',     en: 'Rigel' },
    'Eta Carinae': { uk: 'Ета Кіля',   en: 'Eta Carinae' },
    'Spica':       { uk: 'Спіка',      en: 'Spica' },
    'Sirius':      { uk: 'Сіріус',     en: 'Sirius' },
    'Canopus':     { uk: 'Канопус',    en: 'Canopus' }
  };

  _drawLabelCanvas(canvas, displayName, name) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    
    const isGiant = name === 'Sun' || name === 'Moon';
    
    // Для гігантів текст рівно по центру. Для звичайних об'єктів — піднятий вгору, щоб не перекривати кружечок
    const textY = isGiant ? 64 : 32;
    
    ctx.font = 'bold 22px Arial'; // Трохи менший, але чіткіший шрифт
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Текстова тінь (Outline effect) для максимальної читабельності на будь-якому фоні
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(displayName, 256 + 2, textY + 2);
    ctx.fillText(displayName, 256 - 2, textY - 2);
    ctx.fillText(displayName, 256 + 2, textY - 2);
    ctx.fillText(displayName, 256 - 2, textY + 2);
    ctx.fillText(displayName, 256, textY + 3);
    ctx.fillText(displayName, 256, textY - 3);

    // Текст назви
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.fillText(displayName, 256, textY);
  }

  _drawReticleCanvas(canvas, colorStr, withHalo = true) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    
    // Центральна крапка
    ctx.beginPath();
    ctx.arc(32, 32, 3, 0, Math.PI * 2);
    ctx.fillStyle = colorStr;
    ctx.fill();
    
    if (withHalo) {
      // Ореол
      ctx.beginPath();
      ctx.arc(32, 32, 8, 0, Math.PI * 2);
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  createMarker(parentMesh, name, colorStr) {
    const displayName = (SpaceEngine.BODY_NAMES[name]?.[this.currentLang]) || name;
    
    const isGiant = name === 'Sun' || name === 'Moon';

    // 1. Label Sprite (Text)
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    this._drawLabelCanvas(labelCanvas, displayName, name);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.SpriteMaterial({
      map: labelTex,
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
      transparent: true,
      opacity: this.labelsVisible ? 0.9 : 0.0
    });
    
    const labelSprite = new THREE.Sprite(labelMat);
    labelSprite.scale.set(0.28, 0.07, 1);
    labelSprite.renderOrder = 9999;
    
    // Для звичайних планет/зірок піднімаємо текст вище, для гігантів - по центру, 
    // АЛЕ Сонце піднімаємо дуже високо, щоб текст не "з'їдався" інтенсивним сяйвом (HDR Bloom)
    if (name === 'Sun') {
      const radius = (parentMesh.geometry && parentMesh.geometry.parameters && parentMesh.geometry.parameters.radius) ? parentMesh.geometry.parameters.radius : 0;
      labelSprite.position.y = radius * 2.8; // Відводимо текст ЩЕ ВИЩЕ над Сонцем (етап 1 + ще вище)
    } else if (!isGiant) {
      // Витягуємо фактичний радіус 3D геометрії (сфери), щоб текст не провалювався всередину планети
      const radius = (parentMesh.geometry && parentMesh.geometry.parameters && parentMesh.geometry.parameters.radius) ? parentMesh.geometry.parameters.radius : 0;
      // Зміщуємо текст над планетою + невеликий запас.
      labelSprite.position.y = radius * 1.35; 
    }
    parentMesh.add(labelSprite);
    
    // 2. Reticle Sprite (Circle)
    let reticleSprite = null;
    if (!isGiant) {
      let cached = this.sharedReticles[colorStr];
      if (!cached) {
        const reticleCanvas = document.createElement('canvas');
        reticleCanvas.width = 64;
        reticleCanvas.height = 64;
        this._drawReticleCanvas(reticleCanvas, colorStr, this.labelsVisible);

        const reticleTex = new THREE.CanvasTexture(reticleCanvas);
        const reticleMat = new THREE.SpriteMaterial({
          map: reticleTex,
          color: 0xffffff,
          depthTest: false,
          depthWrite: false,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.6 // Базова прозорість цілевказівника
        });
        cached = { canvas: reticleCanvas, tex: reticleTex, mat: reticleMat };
        this.sharedReticles[colorStr] = cached;
      }
      
      reticleSprite = new THREE.Sprite(cached.mat);
      reticleSprite.scale.set(0.04, 0.04, 1);
      reticleSprite.renderOrder = 9998;
      parentMesh.add(reticleSprite);
    }

    this.markers.push(labelSprite);
    if (reticleSprite) this.markers.push(reticleSprite);
    
    // Зберігаємо метадані
    this.markerData.push({ labelSprite, reticleSprite, labelCanvas, colorStr, name, parentMesh });
  }

  // Викликати при зміні мови
  updateMarkersLanguage(lang) {
    this.currentLang = lang;
    this.markerData.forEach(({ labelCanvas, name, labelSprite }) => {
      const displayName = (SpaceEngine.BODY_NAMES[name]?.[lang]) || name;
      this._drawLabelCanvas(labelCanvas, displayName, name);
      labelSprite.material.map.needsUpdate = true;
    });
    if (this.isActive && this.renderer) this.renderer.render(this.scene, this.camera);
  }

  onMouseMove(event) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  setLabelsVisible(visible) {
    if (this.labelsVisible === visible) return;
    this.labelsVisible = visible;
    
    // Оновлюємо кешовані кружечки (перемальовуємо canvas лише один раз на кожен колір)
    if (this.sharedReticles) {
      Object.keys(this.sharedReticles).forEach(colorStr => {
        const cached = this.sharedReticles[colorStr];
        this._drawReticleCanvas(cached.canvas, colorStr, visible);
        cached.tex.needsUpdate = true;
      });
    }

    // Оновлюємо прозорість текстових позначок
    this.markerData.forEach(data => {
      if (data.labelSprite) {
        data.labelSprite.material.opacity = visible ? 0.9 : 0.0;
      }
    });
  }

  createSun() {
    const sunRadius = 163950; // Зменшено з 327900 (тепер масштаб 15x замість 30x), щоб візуально не "поглинати" Меркурій
    const sunGeom = new THREE.SphereGeometry(sunRadius, 32, 32);
    
    // Завантажуємо реальну текстуру Сонця
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/assets/textures/sun.jpg', () => {
      if (this.isActive && this.renderer) this.renderer.render(this.scene, this.camera);
    });

    const sunMat = new THREE.MeshBasicMaterial({ 
      map: texture,
      color: new THREE.Color().setRGB(1.2, 1.2, 1.2) // Нормальна яскравість (текстура Сонця тепер буде видимою)
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);

    // Реалістичне 32-бітне світіння Сонця (Без banding артефактів)
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(1.0, 0.7, 0.3) },
        intensity: { value: 1.5 } // Зменшено, оскільки більше немає BloomPass
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float intensity;
        varying vec2 vUv;
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          if (dist > 0.5) discard;
          
          // Експоненційний спад для м'якої корони
          float glow = exp(-dist * 12.0);
          // Жорстке надяскраве ядро
          float core = exp(-dist * 40.0);
          
          vec3 finalColor = color * glow + vec3(1.0) * core;
          
          // Множимо на intensity
          gl_FragColor = vec4(finalColor * intensity, glow * 0.9);
        }
      `,
      transparent: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Використовуємо PlaneGeometry замість Sprite, щоб уникнути багів з кастомним ShaderMaterial
    const planeGeom = new THREE.PlaneGeometry(1, 1);
    
    this.sunGlow = new THREE.Mesh(planeGeom, glowMaterial);
    this.sunGlow.scale.set(sunRadius * 4, sunRadius * 4, 1);
    this.scene.add(this.sunGlow);
    
    // Зовнішнє м'яке сяйво
    const outerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(1.0, 0.85, 0.5) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
          vec2 center = vec2(0.5);
          float dist = distance(vUv, center);
          if (dist > 0.5) discard;
          float glow = exp(-dist * 3.5);
          float softEdge = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(color, glow * softEdge * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.outerGlow = new THREE.Mesh(planeGeom, outerGlowMaterial);
    this.outerGlow.scale.set(sunRadius * 12, sunRadius * 12, 1);
    this.scene.add(this.outerGlow);
    
    // Позначка Сонця
    this.createMarker(this.sunMesh, "Sun", "#ffcc00");
    
    // Повертаємо сонячні спалахи з правильним радіусом
    // this.createSolarFlares(sunRadius); // Вимкнено, оскільки створює баг "риски"

    this.scene.add(this.sunMesh);
    this.sunMesh.scale.set(1, 1, 1);
  }

  createSolarFlares(sunRadius) {
    this.prominences = [];
    const flareCount = 12; // Збільшуємо кількість для більш активного Сонця
    const colors = [0xffaa00, 0xff5500, 0xffcc44]; // Плазмова палітра

    for (let i = 0; i < flareCount; i++) {
      const group = new THREE.Group();
      
      // Кожен протуберанець складається з 2-3 переплетених плазмових "канатів"
      const tubesCount = 2 + Math.floor(Math.random() * 2);
      const baseRadius = sunRadius * (0.05 + Math.random() * 0.15);
      for (let j = 0; j < tubesCount; j++) {
        const radius = baseRadius * (0.9 + Math.random() * 0.2); 
        const tube = sunRadius * (0.015 + Math.random() * 0.025); // Значно товстіші труби!
        
        const flareGeom = new THREE.TorusGeometry( radius, tube, 8, 16, Math.PI );
        
        // Кастомний шейдер для м'яких, "пухнастих" країв плазми (ефект Френеля)
        const flareMat = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]) },
            opacity: { value: 0.0 }
          },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            varying vec3 vNormal;
            void main() {
              // Яскрава серцевина і прозорі краї (чим ближче нормаль до камери, тим яскравіше)
              float intensity = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
              intensity = pow(intensity, 1.5); // Загострюємо ядро
              
              gl_FragColor = vec4(color * 10.0, intensity * opacity); // Множимо на 10.0, щоб пробити поріг Bloom (5.0)
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const flare = new THREE.Mesh(flareGeom, flareMat);
        
        // Злегка зміщуємо осі, щоб труби перепліталися
        flare.rotation.x = (Math.random() - 0.5) * 0.4;
        flare.rotation.y = (Math.random() - 0.5) * 0.4;
        flare.rotation.z = (Math.random() - 0.5) * 0.4;
        
        group.add(flare);
      }
      
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      
      group.position.setFromSphericalCoords(sunRadius, phi, theta);
      group.lookAt(0, 0, 0);
      group.rotateX(-Math.PI / 2);
      group.rotateY(Math.random() * Math.PI);
      
      this.sunMesh.add(group);
      
      // Динамічний життєвий цикл (Тепер у СТРОГОМУ ПРЯМОМУ ЕФІРІ)
      // У реальності протуберанці існують від кількох годин до тижнів.
      // Задаємо час життя від 2 до 10 ДНІВ (в мілісекундах)
      const daysToMs = 86400000;
      const lifeSpanMs = (2 + Math.random() * 8) * daysToMs;
      
      this.prominences.push({
        group: group,
        baseScale: 0.5 + Math.random() * 1.0,
        maxLife: lifeSpanMs,
        life: Math.random() * lifeSpanMs, // Випадкова фаза життя
        twistSpeed: (Math.random() - 0.5) * 0.000001, // Надвичайно повільне скручування в реальному часі
        sunRadius: sunRadius
      });
    }
  }

  createLights() {
    // Золота середина: 0.04 ambient light (глибокі, але не абсолютно чорні тіні)
    this.ambientLight = new THREE.AmbientLight(0x4466aa, 0.04);
    this.scene.add(this.ambientLight);

    // Інтенсивність 1.8 гарантує відмінне освітлення без "пересвіту" (washed out) на Місяці
    this.sunLight = new THREE.PointLight(0xfff5e6, 1.8, 0, 0);
    this.sunLight.position.set(0, 0, 0); // Сонце строго в центрі
    
    // Налаштування тіней від Сонця
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048; // Підвищена деталізація тіней
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1000;
    this.sunLight.shadow.camera.far = 100000000; // Покриває всю Сонячну систему (Плутон ~ 94,000,000)
    this.sunLight.shadow.bias = -0.0005; // Зменшення артефактів тіней

    this.scene.add(this.sunLight);
  }

  createMoon() {
    const geometry = new THREE.SphereGeometry(819, 32, 32); // 0.273 радіусів Землі * 30
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('/assets/textures/moon.jpg', () => {
      if (this.isActive && this.renderer) this.renderer.render(this.scene, this.camera);
    });
    
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture, 
      bumpScale: 0.05,
      roughness: 1.0,
      metalness: 0.0,
      emissive: new THREE.Color(0x223344), // Слабка підсвітка темної сторони, щоб Місяць не зникав у космосі
      emissiveIntensity: 0.4
    });

    this.moonMesh = new THREE.Mesh(geometry, material);
    
    const glowTexture = this.createMoonGlowTexture();
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8
    });
    
    const moonGlow = new THREE.Sprite(glowMaterial);
    // Збільшуємо світіння Місяця так, щоб воно було значно більшим за саму сферу (радіус 819)
    moonGlow.scale.set(3500, 3500, 1);
    this.moonMesh.add(moonGlow);

    this.planetaryBodies.push({ 
      mesh: this.moonMesh, 
      radius: 70, 
      name: 'Moon',
      orbitRadius: 0.05,
      orbitPeriod: 27.3,
      rotationPeriod: 655,
      startingPhase: 3.81, // Астрономічна фаза Місяця на J2000
      eccentricity: 0.054,
      orbitalInclination: 5.1 // Нахил орбіти Місяця
    });

    this.moonMesh.castShadow = true;
    this.moonMesh.receiveShadow = true;
    this.moonMesh.rotation.z = 1.5 * (Math.PI / 180);
    this.moonMesh.scale.set(1, 1, 1);
    this.moonMesh.visible = false;
    
    // Позначка Місяця
    this.createMarker(this.moonMesh, "Moon", "#ffffff");

    this.scene.add(this.moonMesh);
  }

  createPlanets() {
    this.planets = [];
    
    // startingPhase в радіанах, eccentricity (ексцентриситет), axialTilt (нахил осі обертання), orbitalInclination (нахил орбіти до екліптики)
    const planetConfigs = [
      { name: 'Mercury', markerColor: '#aaaaaa', radius: 1140, orbitRadius: 0.39, orbitPeriod: 88, rotationPeriod: 1407, startingPhase: 4.40, eccentricity: 0.205, axialTilt: 0.03, orbitalInclination: 7.0, textureUrl: '/assets/textures/moon.jpg', bumpScale: 0.02 },
      { name: 'Venus', markerColor: '#ffcc66', radius: 2850, orbitRadius: 0.72, orbitPeriod: 225, rotationPeriod: -5832, startingPhase: 3.17, eccentricity: 0.006, axialTilt: 177.3, orbitalInclination: 3.4, color: 0xffeedd, atmosColor: 0xffeedd },
      { name: 'Mars', markerColor: '#ff4422', radius: 1590, orbitRadius: 1.52, orbitPeriod: 687, rotationPeriod: 24.6, startingPhase: 6.20, eccentricity: 0.093, axialTilt: 25.1, orbitalInclination: 1.8, procedural: 'mars', bumpScale: 0.08 },
      { name: 'Jupiter', markerColor: '#ffaa88', radius: 32910, orbitRadius: 5.2, orbitPeriod: 4333, rotationPeriod: 9.9, startingPhase: 0.60, eccentricity: 0.048, axialTilt: 3.1, orbitalInclination: 1.3, procedural: 'jupiter', aurora: true },
      { name: 'Saturn', markerColor: '#eedd88', radius: 27420, orbitRadius: 9.5, orbitPeriod: 10759, rotationPeriod: 10.7, startingPhase: 0.87, eccentricity: 0.056, axialTilt: 26.7, orbitalInclination: 2.5, procedural: 'saturn', hasRings: true },
      { name: 'Uranus', markerColor: '#aaffff', radius: 25362, orbitRadius: 19.2, orbitPeriod: 30688, rotationPeriod: -17.2, startingPhase: 1.2, eccentricity: 0.046, axialTilt: 97.77, orbitalInclination: 0.77, procedural: 'uranus', hasUranusRings: true },
      { name: 'Neptune', markerColor: '#4466ff', radius: 24622, orbitRadius: 30.05, orbitPeriod: 60182, rotationPeriod: 16.1, startingPhase: 4.8, eccentricity: 0.009, axialTilt: 28.32, orbitalInclination: 1.77, procedural: 'neptune', atmosColor: 0x88aaff },
      { name: 'Pluto', markerColor: '#ddbb99', radius: 1188, orbitRadius: 39.48, orbitPeriod: 90560, rotationPeriod: -153.3, startingPhase: 2.5, eccentricity: 0.248, axialTilt: 122.5, orbitalInclination: 17.16, procedural: 'pluto', atmosColor: 0x445566 }
    ];

    planetConfigs.forEach(config => {
      let mat;
      if (config.procedural) {
        const tex = this.createProceduralTexture(config.procedural);
        mat = new THREE.MeshStandardMaterial({
          map: tex,
          bumpMap: config.bumpScale ? tex : null,
          bumpScale: config.bumpScale || 0,
          roughness: 0.8,
          metalness: 0.1
        });
      } else if (config.textureUrl) {
        const tex = new THREE.TextureLoader().load(config.textureUrl);
        mat = new THREE.MeshStandardMaterial({ 
          map: tex, 
          bumpMap: config.bumpScale ? tex : null,
          bumpScale: config.bumpScale || 0,
          roughness: 0.9 
        });
      } else {
        mat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 1.0 });
      }

      // Динамічний LOD на основі видимого розміру з Землі
      const apparentSize = config.radius / Math.max(0.1, config.orbitRadius || 0.1);
      let segments = 32;
      if (apparentSize < 100) segments = 8;        // Дуже далекі/дрібні (Плутон, далекі супутники)
      else if (apparentSize < 500) segments = 16;  // Далекі малі
      else if (apparentSize < 1500) segments = 24; // Середні (Уран, Нептун, Марс)
      else segments = 32;                          // Близькі гіганти (Юпітер, Сатурн, Венера)

      const geom = new THREE.SphereGeometry(config.radius, segments, segments);
      const planetMesh = new THREE.Mesh(geom, mat);
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      
      // Атмосферне світіння (Оптимізований Fresnel Shader)
      if (config.atmosColor) {
        if (!this.globalSunPosition) this.globalSunPosition = new THREE.Vector3(0, 0, 0);
        
        const atmosGeom = new THREE.SphereGeometry(config.radius * 1.05, segments, segments);
        const atmosMat = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(config.atmosColor) },
            sunPosition: { value: this.globalSunPosition },
            opacity: { value: config.name === 'Venus' ? 0.6 : 0.4 }
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform vec3 sunPosition;
            uniform float opacity;
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            void main() {
              // Fresnel: чим ближче нормаль до напрямку камери, тим прозоріше
              vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
              float fresnel = dot(viewDirection, vNormal);
              fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
              fresnel = pow(fresnel, 3.0); // Сила обідка

              // Термінатор: атмосфера світиться лише на денній стороні
              vec3 lightDirection = normalize(sunPosition - vWorldPosition);
              float lightIntensity = max(dot(vNormal, lightDirection), 0.0);
              float terminator = smoothstep(0.0, 0.3, lightIntensity);

              gl_FragColor = vec4(color, fresnel * terminator * opacity);
            }
          `,
          transparent: true,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const atmosMesh = new THREE.Mesh(atmosGeom, atmosMat);
        planetMesh.add(atmosMesh);
      }

      // Супутники Юпітера з фейковими тінями
      if (config.name === 'Jupiter') {
        this.createJupiterMoons(planetMesh, config.radius);
      }
      
      // Титан (супутник Сатурна)
      if (config.name === 'Saturn') {
        this.createSaturnMoons(planetMesh, config.radius);
      }
      
      // Харон (супутник Плутона)
      if (config.name === 'Pluto') {
        this.createPlutoMoons(planetMesh, config.radius);
      }

      // Фізично точний нахил осі
      const tiltRad = (config.axialTilt || 0) * (Math.PI / 180);
      planetMesh.rotation.z = tiltRad;
      planetMesh.scale.set(1, 1, 1);

      this.planetaryBodies.push({ 
        mesh: planetMesh, 
        radius: config.radius, 
        name: config.name,
        orbitRadius: config.orbitRadius,
        orbitPeriod: config.orbitPeriod,
        rotationPeriod: config.rotationPeriod,
        startingPhase: config.startingPhase,
        eccentricity: config.eccentricity,
        orbitalInclination: (config.orbitalInclination || 0) * (Math.PI / 180) // в радіанах
      });

      if (config.hasRings) this.createSaturnRings(planetMesh, config.radius);
      if (config.hasUranusRings) this.createUranusRings(planetMesh, config.radius);
      if (config.aurora) this.createAurora(planetMesh, config.radius);

      // Позначка Планети
      this.createMarker(planetMesh, config.name, config.markerColor || "#ffffff");

      planetMesh.visible = false;
      this.scene.add(planetMesh);
    });
  }

  createJupiterMoons(jupiterMesh, jRadius) {
    this.jupiterMoons = [];
    const moonData = [
      // Реальні фізичні пропорції: відстань у радіусах Юпітера (Rj = 16) та реальні дні
      // Радіуси тепер строго в масштабах: Earth Radius = 3000 (100 * 30)
      { name: 'Io', r: 858, d: jRadius * 5.9, period: 1.77, c: 0xffffaa }, // 0.286 ER
      { name: 'Europa', r: 735, d: jRadius * 9.4, period: 3.55, c: 0xeeeeee }, // 0.245 ER
      { name: 'Ganymede', r: 1239, d: jRadius * 15.0, period: 7.15, c: 0xcccccc }, // 0.413 ER
      { name: 'Callisto', r: 1134, d: jRadius * 26.3, period: 16.69, c: 0x888888 } // 0.378 ER
    ];
    
    // Спільний матеріал фейкової тіні (дуже швидкий)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 32; shadowCanvas.height = 32;
    const ctx = shadowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const shadowMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false });

    moonData.forEach(m => {
      const geom = new THREE.SphereGeometry(m.r, 8, 8); // LOD для дрібних супутників
      const mat = new THREE.MeshStandardMaterial({ color: m.c, roughness: 1.0 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      jupiterMesh.add(mesh); // Додаємо в локальний простір Юпітера
      
      // Позначка Супутника Юпітера (використовуємо індивідуальний колір)
      const hexColor = '#' + m.c.toString(16).padStart(6, '0');
      this.createMarker(mesh, m.name, hexColor);
      
      this.jupiterMoons.push({ mesh, dist: m.d, period: m.period, startingPhase: Math.random() * Math.PI * 2 });
    });
  }

  createSaturnRings(planetMesh, radius) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 1;
    const context = canvas.getContext('2d');
    
    const gradient = context.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, 'rgba(200, 180, 150, 0)');
    gradient.addColorStop(0.1, 'rgba(200, 180, 150, 0.8)');
    gradient.addColorStop(0.4, 'rgba(180, 160, 130, 0.9)');
    gradient.addColorStop(0.6, 'rgba(150, 130, 100, 0)');
    gradient.addColorStop(0.65, 'rgba(170, 150, 120, 0.7)');
    gradient.addColorStop(0.9, 'rgba(180, 160, 130, 0.4)');
    gradient.addColorStop(1, 'rgba(200, 180, 150, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 1);
    
    const ringGeom = new THREE.RingGeometry(radius * 1.3, radius * 2.2, 64);
    
    const pos = ringGeom.attributes.position;
    const uvs = ringGeom.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const len = Math.sqrt(pos.getX(i)**2 + pos.getY(i)**2);
        uvs.setXY(i, (len - radius*1.3) / (radius*2.2 - radius*1.3), 0);
    }
    
    const ringMat = new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, color: 0xffffff, roughness: 0.6,
      alphaTest: 0.1 // Дозволяє тіням відкидатися від прозорих пікселів
    });

    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2 + 0.3;
    ringMesh.receiveShadow = true;
    ringMesh.castShadow = true;
    planetMesh.add(ringMesh);
  }

  createUranusRings(planetMesh, radius) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 1;
    const context = canvas.getContext('2d');
    
    const gradient = context.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, 'rgba(200, 240, 255, 0)');
    gradient.addColorStop(0.3, 'rgba(200, 240, 255, 0.4)');
    gradient.addColorStop(0.4, 'rgba(180, 220, 255, 0)');
    gradient.addColorStop(0.7, 'rgba(220, 255, 255, 0.6)');
    gradient.addColorStop(0.9, 'rgba(200, 240, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(200, 240, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 1);
    
    const ringGeom = new THREE.RingGeometry(radius * 1.5, radius * 2.1, 64);
    const pos = ringGeom.attributes.position;
    const uvs = ringGeom.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const len = Math.sqrt(pos.getX(i)**2 + pos.getY(i)**2);
        uvs.setXY(i, (len - radius*1.5) / (radius*2.1 - radius*1.5), 0);
    }
    
    const ringMat = new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true, opacity: 0.6, // Кільця Урана набагато тьмяніші за Сатурнові
      side: THREE.DoubleSide, color: 0xffffff, roughness: 0.6,
      alphaTest: 0.1
    });

    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    // Планета вже нахилена на 97 градусів, тому просто ставимо перпендикулярно до її локальної осі Y
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.receiveShadow = true;
    ringMesh.castShadow = true;
    planetMesh.add(ringMesh);
  }

  createSaturnMoons(saturnMesh, sRadius) {
    this.saturnMoons = [];
    // Титан
    const m = { name: 'Titan', r: 2574, d: sRadius * 21.0, period: 15.94, procedural: 'titan' };
    
    const tex = this.createProceduralTexture(m.procedural);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1.0 });
    const geom = new THREE.SphereGeometry(m.r, 8, 8); // LOD для супутників Сатурна
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Густа атмосфера Титана
    const atmosGeom = new THREE.SphereGeometry(m.r * 1.1, 8, 8);
    const atmosMat = new THREE.MeshLambertMaterial({
      color: 0xffaa00, transparent: true, opacity: 0.4, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    mesh.add(new THREE.Mesh(atmosGeom, atmosMat));
    
    // Позначка Титана
    this.createMarker(mesh, m.name, "#ffaa00");
    
    saturnMesh.add(mesh);
    this.saturnMoons.push({ mesh, dist: m.d, period: m.period, startingPhase: Math.random() * Math.PI * 2 });
  }

  createPlutoMoons(plutoMesh, pRadius) {
    this.plutoMoons = [];
    // Харон: Дуже близько і дуже великий відносно Плутона!
    const m = { name: 'Charon', r: 606, d: pRadius * 16.5, period: 6.387, procedural: 'charon' };
    
    const tex = this.createProceduralTexture(m.procedural);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const geom = new THREE.SphereGeometry(m.r, 8, 8); // LOD Харона
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Позначка Харона
    this.createMarker(mesh, m.name, "#aaaaaa");
    
    plutoMesh.add(mesh);
    this.plutoMoons.push({ mesh, dist: m.d, period: m.period, startingPhase: Math.random() * Math.PI * 2 });
  }

  createAurora(planetMesh, radius) {
    // Товщина тора тепер пропорційна до радіуса планети (0.5% від радіуса)
    const auraGeom = new THREE.TorusGeometry(radius * 0.6, radius * 0.005, 16, 32);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
    
    const northAura = new THREE.Mesh(auraGeom, auraMat);
    northAura.position.y = radius * 0.8;
    northAura.rotation.x = Math.PI / 2;
    planetMesh.add(northAura);
    
    const southAura = new THREE.Mesh(auraGeom, auraMat);
    southAura.position.y = -radius * 0.8;
    southAura.rotation.x = Math.PI / 2;
    planetMesh.add(southAura);
  }

  syncCamera(lng, lat, pitch, bearing, zoom = 1) {
    if (!this.isActive || !this.camera) return;
    // Оновлюємо камеру
    this.syncCameraOnly(lng, lat, pitch, bearing, zoom);
    // Рендер (лише у standalone-режимі; у bridged режимі рендерить SpaceBridge)
    if (this.renderer && !this.bridged) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setActive(active) {
    if (this.isActive === active) return;
    this.isActive = active;
    if (this.container) {
      this.container.style.opacity = active ? '1' : '0';
      this.container.style.transition = 'opacity 1s ease-in-out';
    }
    
    // Перезапускаємо цикл анімації, якщо увімкнули SpaceEngine (наприклад, при поверненні в 3D)
    if (active) {
      this.lastTime = performance.now();
      requestAnimationFrame(this.animate);
    }
  }

  setMode(mode) {
    this.mode = mode;
    const showAdvanced = mode === 'advanced';
    const showBasic = mode !== 'none'; // Повністю вимкнено, якщо 'none'
    

    
    if (this.moonMesh) this.moonMesh.visible = showAdvanced;
    if (this.sunMesh) this.sunMesh.visible = showAdvanced;

    // Зорі видимі і в basic, і в advanced, але вимкнені в none
    if (this.starsGroup) {
      this.starsGroup.visible = showBasic;
    }

    // Вмикаємо/вимикаємо всі планетарні тіла
    this.planetaryBodies.forEach(body => {
      if (body.mesh) {
        body.mesh.visible = showAdvanced;
      }
      if (body.dummyGroup) {
        body.dummyGroup.visible = showBasic;
      }
    });

    // Підсонячні спалахи
    if (this.prominences) {
      this.prominences.forEach(p => { p.group.visible = showAdvanced; });
    }
    if (this.jupiterMoons) this.jupiterMoons.forEach(m => { m.mesh.visible = showAdvanced; });
    if (this.saturnMoons) this.saturnMoons.forEach(m => { m.mesh.visible = showAdvanced; });
    if (this.plutoMoons) this.plutoMoons.forEach(m => { m.mesh.visible = showAdvanced; });

    // Оновлюємо фізику ПЕРЕД першим рендером, щоб планети не "моргнули" на координатах (0,0,0)
    if (this.isActive && showAdvanced) {
      this._runPhysicsFrame(performance.now(), 0);
    }

    if (this.isActive && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Внутрішня функція фізики — спільна для animate() та updatePhysics().
   * Містить ВСЮ логіку оновлення позицій, анімацій, спалахів.
   */
  _runPhysicsFrame(time, dt) {

    // --- Абсолютно точна астрономічна фізика (VSOP87) ---
    const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
    const currentSimDate = new Date(J2000 + this.simTimeDays * 86400000);
    const astroTime = Astronomy.MakeTime(currentSimDate);
    
    // Зоряний час (Sidereal Time) для синхронізації обертання Землі
    const stRad = (Astronomy.SiderealTime(astroTime) / 24) * Math.PI * 2;
    const AU = 2348100; // Масштаб 1 А.О.
    
    if (this.starsGroup) {
      this.starsGroup.rotation.y = -stRad;
    }

    // Функція конвертації J2000 (Екваторіальні координати) у нашу Mapbox-орієнтовану систему
    const getMapboxPos = (bodyName) => {
      const vec = Astronomy.GeoVector(Astronomy.Body[bodyName], astroTime, true);
      const jx = vec.y * AU;
      const jy = vec.z * AU;
      const jz = vec.x * AU;
      
      const geoX = jx * Math.cos(stRad) - jz * Math.sin(stRad);
      const geoZ = jx * Math.sin(stRad) + jz * Math.cos(stRad);
      const geoY = jy;
      return new THREE.Vector3(geoX, geoY, geoZ);
    };

    // Розміщення Сонця
    if (this.sunMesh) {
      const sunPos = getMapboxPos('Sun');
      this.sunMesh.position.copy(sunPos);
      this.sunLight.position.copy(sunPos);
      this.sunMesh.rotation.y += ((dt / 1000) / (648 * 3600)) * Math.PI * 2 * this.timeScale;
      
      // Оновлюємо свічення Сонця (billboarding)
      if (this.sunGlow) {
        this.sunGlow.position.copy(sunPos);
        this.sunGlow.quaternion.copy(this.camera.quaternion);
        this.sunGlow.visible = this.sunMesh.visible;
      }
      if (this.outerGlow) {
        this.outerGlow.position.copy(sunPos);
        this.outerGlow.quaternion.copy(this.camera.quaternion);
        this.outerGlow.visible = this.sunMesh.visible;
      }

      if (this.globalSunPosition) {
        this.globalSunPosition.copy(sunPos);
      }
    }

    // Розрахунок Місячного Затемнення (Blood Moon)
    let eclipseDarkening = 1.0;
    let eclipseRedness = 0.0;
    const sunVec = Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, true);
    const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true);
    const angleSunMoon = Astronomy.AngleBetween(sunVec, moonVec);
    const eclipseDiff = 180 - angleSunMoon;

    if (eclipseDiff < 1.0) {
      const depth = 1.0 - eclipseDiff; 
      eclipseDarkening = 1.0 - (depth * 0.85); // Тінь Землі затемнює Місяць
      eclipseRedness = depth; // Червоне зміщення (Blood Moon) через атмосферу Землі
    }

    if (this.mode === 'advanced') {
      this.planetaryBodies.forEach(body => {
        if (!body.mesh) return;

        // Позиція для Місяця і Планет
        if (Astronomy.Body[body.name]) {
          const pos = getMapboxPos(body.name);
          body.mesh.position.copy(pos);
        }

        // Візуальне застосування місячного затемнення
        if (body.name === 'Moon' && body.mesh.material) {
          body.mesh.material.color.setRGB(
            eclipseDarkening, 
            eclipseDarkening * (1.0 - eclipseRedness * 0.6), 
            eclipseDarkening * (1.0 - eclipseRedness * 0.6)
          );
        }

      // --- Динамічне масштабування (LOD) ---
      // Робимо так, щоб планети не зникали, а ставали видимими крапками здалеку
      if (body.radius) {
        const dist = body.mesh.position.distanceTo(this.camera.position);
        const minApparentSize = 0.0003; // Регулює мінімальний розмір "крапки"
        const targetScale = Math.max(1, (dist * minApparentSize) / body.radius);
        body.mesh.scale.set(targetScale, targetScale, targetScale);
      }

      if (Astronomy.RotationAxis && Astronomy.Body[body.name]) {
        try {
          const axisInfo = Astronomy.RotationAxis(body.name, astroTime);
          body.mesh.rotation.y = (axisInfo.spin % 360) * (Math.PI / 180);
        } catch(e) {
          if (body.rotationPeriod) {
            body.mesh.rotation.y += ((dt / 1000) / (body.rotationPeriod * 3600)) * Math.PI * 2 * this.timeScale;
          }
        }
      } else if (body.rotationPeriod) {
        body.mesh.rotation.y += ((dt / 1000) / (body.rotationPeriod * 3600)) * Math.PI * 2 * this.timeScale;
      }
    });

    // 3. Супутники
    if (this.jupiterMoons && Astronomy.JupiterMoons) {
      const jMoons = Astronomy.JupiterMoons(astroTime);
      const keys = ['io', 'europa', 'ganymede', 'callisto'];
      const scaleFactor = 29.33; // Компенсація візуального 30x збільшення Юпітера

      this.jupiterMoons.forEach((moon, i) => {
        if (!keys[i]) return;
        const vec = jMoons[keys[i]];
        
        // Перетворення в координати Mapbox
        const jx = vec.y * AU;
        const jy = vec.z * AU;
        const jz = vec.x * AU;
        
        const geoX = jx * Math.cos(stRad) - jz * Math.sin(stRad);
        const geoZ = jx * Math.sin(stRad) + jz * Math.cos(stRad);
        const geoY = jy;
        
        moon.mesh.position.set(geoX * scaleFactor, geoY * scaleFactor, geoZ * scaleFactor);
      });
    }

    if (this.saturnMoons) {
      this.saturnMoons.forEach(moon => {
        const moonPhase = (this.simTimeDays / moon.period) * Math.PI * 2 + moon.startingPhase;
        const mx = Math.cos(moonPhase) * moon.dist;
        const mz = Math.sin(moonPhase) * moon.dist;
        moon.mesh.position.set(mx, 0, mz);
      });
    }

    if (this.plutoMoons) {
      this.plutoMoons.forEach(moon => {
        const moonPhase = (this.simTimeDays / moon.period) * Math.PI * 2 + moon.startingPhase;
        const mx = Math.cos(moonPhase) * moon.dist;
        const mz = Math.sin(moonPhase) * moon.dist;
        moon.mesh.position.set(mx, 0, mz);
      });
    }

    this.flashes.forEach(f => {
      if (f.active) {
        f.life -= dt;
        if (f.life <= 0) {
          f.active = false;
          f.sprite.visible = false;
        } else {
          const progress = f.life / f.maxLife;
          f.sprite.material.opacity = progress;
          const s = f.baseScale * (0.5 + 0.5 * progress);
          f.sprite.scale.set(s, s, 1);
        }
      }
    });

    // 4. Динаміка сонячних протуберанців
    if (this.prominences) {
      this.prominences.forEach(p => {
        p.life -= dt;
        
        if (p.life <= 0) {
          // Переродження: старий протуберанець зникає, новий з'являється у випадковому місці Сонця
          p.life = p.maxLife;
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = 2 * Math.PI * Math.random();
          p.group.position.setFromSphericalCoords(p.sunRadius, phi, theta);
          p.group.lookAt(0, 0, 0);
          p.group.rotateX(-Math.PI / 2);
          p.group.rotateY(Math.random() * Math.PI);
        } else {
          // Анімаційний цикл: зародження -> пік -> згасання (парабола)
          const progress = p.life / p.maxLife; // від 1.0 до 0.0
          const intensity = Math.sin(progress * Math.PI); 
          
          // Дихаючий масштаб: арка виростає з поверхні і занурюється назад
          const currentScale = p.baseScale * (0.2 + 0.8 * intensity);
          p.group.scale.set(currentScale, currentScale, currentScale);
          
          // Магнітне закручування плазмових канатів
          p.group.children.forEach((child, index) => {
            child.rotation.z += p.twistSpeed * (index + 1) * this.timeScale * (dt / 16.66);
            // Оскільки ми тепер використовуємо ShaderMaterial, звертаємося до uniforms
            if (child.material.uniforms) {
              child.material.uniforms.opacity.value = intensity * 0.8; // Плавно з'являється і зникає
            }
          });
        }
      });
    }

    // Старе обертання видалено, тепер воно в блоці розрахунку орбіт.

    if (this.mode === 'advanced' && Math.random() < 0.005 && this.planetaryBodies.length > 0) {
      const inactive = this.flashes.find(f => !f.active);
      if (inactive) {
        const target = this.planetaryBodies[Math.floor(Math.random() * this.planetaryBodies.length)];
        if (target.mesh.visible) {
          let color = 0xffffff;
          let scaleMultiplier = 0.05; // Всі спалахи мікроскопічні за замовчуванням
          let durationMult = 1.0;
          
          if (target.name === 'Jupiter') { color = 0x88ccff; scaleMultiplier = 0.15; durationMult = 2.0; } // Блискавки на Юпітері
          else if (target.name === 'Mars') { color = 0xffaa44; scaleMultiplier = 0.03; durationMult = 0.5; } // Пилинки/метеорити
          else if (target.name === 'Saturn') { color = 0xaaffff; scaleMultiplier = 0.1; durationMult = 1.5; } // Шторми
          else if (target.name === 'Venus') { color = 0xffffcc; scaleMultiplier = 0.08; durationMult = 1.2; } 
          else if (target.name === 'Moon') { color = 0xffffff; scaleMultiplier = 0.04; durationMult = 0.3; } // Крихітні кінетичні удари

          inactive.sprite.material.color.setHex(color);

          // Випадкова точка на сфері
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = 2 * Math.PI * Math.random();
          
          const r = target.radius + 0.2; // Майже на самій поверхні
          const x = r * Math.sin(phi) * Math.cos(theta);
          const y = r * Math.sin(phi) * Math.sin(theta);
          const z = r * Math.cos(phi);

          // Позиція у світі
          inactive.sprite.position.copy(target.mesh.position).add(new THREE.Vector3(x, y, z));
          
          // Ініціалізація (спалахи тепер дуже швидкі)
          inactive.active = true;
          inactive.maxLife = (50 + Math.random() * 100) * durationMult; // від 0.05 до 0.15 секунд
          inactive.life = inactive.maxLife;
          inactive.baseScale = target.radius * scaleMultiplier * (0.8 + Math.random() * 0.4); 
          inactive.sprite.visible = true;
        }
      }
    }

    } // Кінець блоку оптимізації CPU: ці обчислення відбуваються тільки в advanced mode

    // Оновлення шейдера зір та атмосферного розсіювання
    if (this.starUniforms && this.map) {
      this.starUniforms.time.value = time * 0.001;
      
      // Чим більший зум (ближче до Землі), тим товщий шар атмосфери, крізь який ми дивимося
      // Зум 1-3: глибокий космос (атмосфери майже немає)
      // Зум 5+: ми всередині або дуже близько до атмосфери
      const currentZoom = this.map.getZoom();
      let atmosLevel = Math.max(0, Math.min(1, (currentZoom - 2) / 3.0));
      this.starUniforms.atmosphere.value = atmosLevel;
    }

    // Подія Наднової
    if (this.mode === 'advanced' && this.supernovaCandidates && this.supernovaCandidates.length > 0) {
      if (!this.activeSupernova && Math.random() < 0.0003) { // Дуже рідко, раз на пару хвилин
        const candidate = this.supernovaCandidates[Math.floor(Math.random() * this.supernovaCandidates.length)];
        this.activeSupernova = {
          candidate: candidate,
          life: 0,
          maxLife: 6000 + Math.random() * 4000 // Тривалість 6-10 сек
        };
      }
      
      if (this.activeSupernova) {
        this.activeSupernova.life += dt;
        const progress = this.activeSupernova.life / this.activeSupernova.maxLife;
        
        const colors = this.starfield.geometry.attributes.color.array;
        const sizes = this.starfield.geometry.attributes.size.array;
        const idx = this.activeSupernova.candidate.index;
        
        if (progress >= 1.0) {
          // Залишається тьмяна нейтронна зоря/пульсар
          colors[idx*3] = 0.2; colors[idx*3+1] = 0.2; colors[idx*3+2] = 0.5;
          sizes[idx] = 2.0;
          
          this.supernovaCandidates = this.supernovaCandidates.filter(c => c.index !== idx);
          this.activeSupernova = null;
        } else {
          // Еволюція спалаху
          let intensity = 1.0;
          let currentSize = this.activeSupernova.candidate.size;
          if (progress < 0.1) {
            intensity = progress / 0.1; // швидке наростання
            currentSize = this.activeSupernova.candidate.size + intensity * 60.0;
          } else {
            intensity = 1.0 - ((progress - 0.1) / 0.9); // повільне згасання
            currentSize = 2.0 + intensity * 60.0;
          }
          
          const bc = this.activeSupernova.candidate.originalColor;
          colors[idx*3] = bc.r + (1.0 - bc.r) * intensity;
          colors[idx*3+1] = bc.g + (1.0 - bc.g) * intensity;
          colors[idx*3+2] = bc.b + (1.0 - bc.b) * intensity;
          
          sizes[idx] = currentSize;
        }
        this.starfield.geometry.attributes.color.needsUpdate = true;
        this.starfield.geometry.attributes.size.needsUpdate = true;
      }
    }

    // Оновлення hover-прозорості для позначок
    if (this.markerData && this.markerData.length > 0) {
      const halfWidth = window.innerWidth / 2;
      const halfHeight = window.innerHeight / 2;
      const vector = new THREE.Vector3();

      this.markerData.forEach(({ labelSprite, reticleSprite, name, parentMesh }) => {
        if (!parentMesh.visible) {
          labelSprite.visible = false;
          if (reticleSprite) reticleSprite.visible = false;
          return;
        }

        // Отримуємо глобальну позицію батьківського мешу
        parentMesh.getWorldPosition(vector);
        // Проєкція у 2D простір камери
        vector.project(this.camera);

        // Якщо об'єкт за камерою (z > 1), ховаємо
        if (vector.z > 1.0) {
          labelSprite.material.opacity = 0;
          labelSprite.visible = false;
          if (reticleSprite) reticleSprite.visible = false;
          return;
        }

        // Компенсуємо динамічне масштабування планети, щоб позначка не ставала гігантом
        const parentScale = parentMesh.scale.x || 1.0;
        // Для Сонця робимо саму мітку більшою, оскільки воно величезне
        const scaleMultiplier = name === 'Sun' ? 2.0 : 1.0;
        labelSprite.scale.set((0.28 * scaleMultiplier) / parentScale, (0.07 * scaleMultiplier) / parentScale, 1);
        
        if (reticleSprite) {
          reticleSprite.scale.set(0.04 / parentScale, 0.04 / parentScale, 1);
          const isDS = parentMesh.userData && parentMesh.userData.isDeepSpace;
          reticleSprite.visible = this.labelsVisible || isDS; // Цілевказівник завжди видимий, якщо увімкнено мітки або це Deep Space
        }

        // Переводимо нормалізовані координати (-1 до 1) у пікселі
        const px = (vector.x * halfWidth) + halfWidth;
        const py = -(vector.y * halfHeight) + halfHeight;

        // Перевірка на перекриття планетою (Occlusion)
        let isOccluded = false;
        if (parentMesh.parent && parentMesh.parent.geometry && parentMesh.parent.geometry.parameters) {
          const planetPos3D = new THREE.Vector3();
          parentMesh.parent.getWorldPosition(planetPos3D);
          
          const moonPos3D = new THREE.Vector3();
          parentMesh.getWorldPosition(moonPos3D);
          
          const distToPlanet = this.camera.position.distanceTo(planetPos3D);
          const distToMoon = this.camera.position.distanceTo(moonPos3D);
          
          if (distToMoon > distToPlanet) {
            // Супутник далі, ніж планета (позаду неї). Перевіряємо, чи перекриває його радіус планети на екрані.
            const pProj = planetPos3D.clone().project(this.camera);
            const planetPx = (pProj.x * halfWidth) + halfWidth;
            const planetPy = -(pProj.y * halfHeight) + halfHeight;
            
            const screenDist = Math.sqrt(Math.pow(px - planetPx, 2) + Math.pow(py - planetPy, 2));
            
            const pRadius = parentMesh.parent.geometry.parameters.radius * (parentMesh.parent.scale.x || 1);
            const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            const edgePos3D = planetPos3D.clone().add(rightVector.multiplyScalar(pRadius));
            const edgeProj = edgePos3D.project(this.camera);
            const edgePx = (edgeProj.x * halfWidth) + halfWidth;
            const edgePy = -(edgeProj.y * halfHeight) + halfHeight;
            
            const screenRadius = Math.sqrt(Math.pow(planetPx - edgePx, 2) + Math.pow(planetPy - edgePy, 2));
            
            if (screenDist < screenRadius * 1.05) { // 5% запас
              isOccluded = true;
            }
          }
        }

        // Обчислюємо відстань до миші
        const dx = px - this.mouse.x;
        const dy = py - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetOpacity = 0.0;
        // Позначки відображаються ТІЛЬКИ при наведенні, і тільки якщо увімкнена кнопка "Позначки"
        const isGiant = name === 'Sun' || name === 'Moon';
        const isSmallMoon = ['Io', 'Europa', 'Ganymede', 'Callisto', 'Titan', 'Charon'].includes(name);
        
        let hoverRadius = isSmallMoon ? 20 : 45;
        
        if (isGiant) {
          // Динамічний радіус наведення для гігантів (Сонце/Місяць), щоб працювало по всьому видимому об'єму
          const radius3D = parentMesh.geometry && parentMesh.geometry.parameters ? parentMesh.geometry.parameters.radius : 2000;
          // Для Сонця враховуємо величезну корону
          const multiplier = name === 'Sun' ? 2.5 : 1.2;
          
          const centerPos = new THREE.Vector3();
          parentMesh.getWorldPosition(centerPos);
          
          const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
          const edgePos = centerPos.clone().add(rightVector.multiplyScalar(radius3D * multiplier));
          
          const centerProj = centerPos.project(this.camera);
          const edgeProj = edgePos.project(this.camera);
          
          const cPx = (centerProj.x * halfWidth) + halfWidth;
          const cPy = -(centerProj.y * halfHeight) + halfHeight;
          const ePx = (edgeProj.x * halfWidth) + halfWidth;
          const ePy = -(edgeProj.y * halfHeight) + halfHeight;
          
          const screenRadius = Math.sqrt(Math.pow(cPx - ePx, 2) + Math.pow(cPy - ePy, 2));
          hoverRadius = Math.max(150, screenRadius); // Мінімум 150px
        }
        const isDS = parentMesh.userData && parentMesh.userData.isDeepSpace;
        let isCurrentlyHovered = false;
        if ((this.labelsVisible || isDS) && !isOccluded) {
          // Якщо кнопка "Позначки" увімкнена або це Deep Space об'єкт, дозволяємо hover-логіку
          if (dist < hoverRadius) {
            targetOpacity = (name === 'Sun') ? 1.0 : 0.9;
            isCurrentlyHovered = true;
          }
        }
        
        // Звук при наведенні / відведенні
        if (isCurrentlyHovered && !labelSprite.userData.isHovered) {
          labelSprite.userData.isHovered = true;
          if (this.audioManager) this.audioManager.playHoverIn();
        } else if (!isCurrentlyHovered && labelSprite.userData.isHovered) {
          labelSprite.userData.isHovered = false;
          if (this.audioManager) this.audioManager.playHoverOut();
        }

        // Спрайт цілевказівника завжди видимий (якщо не перекритий), але його вигляд (з ореолом чи без) залежить від кнопки
        if (reticleSprite) {
            reticleSprite.visible = !isOccluded;
        }

        // Плавна зміна прозорості ТІЛЬКИ для текстової мітки
        labelSprite.material.opacity += (targetOpacity - labelSprite.material.opacity) * 0.15 * (dt / 16.66);
        labelSprite.visible = labelSprite.material.opacity > 0.02;
      });
    }

  }

  /**
   * Standalone анімаційний цикл (використовується ЛИШЕ коли SpaceBridge НЕ підключений).
   * У bridged-режимі цей метод не викликається — SpaceBridge.render() керує всім.
   */
  animate(time) {
    if (!this.isActive || this.bridged) return;

    const dt = time - this.lastTime;
    this.lastTime = time;
    if (dt <= 0 || dt > 1000) { requestAnimationFrame(this.animate); return; }

    this.simTimeDays += ((dt / 1000) * this.timeScale) / 86400;
    this._runPhysicsFrame(time, dt);

    // Рендер (лише у standalone)
    if (this.mode !== 'none' && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
    
    // Наступний кадр
    requestAnimationFrame(this.animate);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.mode === 'advanced') this.renderer.render(this.scene, this.camera);
  }

  // Архітектурна чистота пам'яті: повне вивантаження 3D-рушія (опціонально для майбутнього)
  dispose() {
    console.log('[Optimization] Disposing SpaceEngine WebGL resources...');
    this.isActive = false;

    if (this.scene) {
      this.scene.traverse((object) => {
        if (!object.isMesh && !object.isSprite && !object.isLine && !object.isPoints) return;
        
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(mat => {
            if (mat.map) mat.map.dispose();
            if (mat.lightMap) mat.lightMap.dispose();
            if (mat.bumpMap) mat.bumpMap.dispose();
            if (mat.normalMap) mat.normalMap.dispose();
            if (mat.specularMap) mat.specularMap.dispose();
            if (mat.envMap) mat.envMap.dispose();
            mat.dispose();
          });
        }
      });
    }

    if (this.sharedReticles) {
      Object.values(this.sharedReticles).forEach(c => {
        if (c.tex) c.tex.dispose();
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      const gl = this.renderer.getContext();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }

    console.log('[Optimization] SpaceEngine disposal complete.');
  }
}
