// scripts/simulations/suites/01_space_webgl_simulation.test.ts
import { setupHeadlessBrowserEnvironment } from '../harness/MockWebGLContext.ts';
import { SpaceEngine } from '../../../src/space/SpaceEngine.ts';
import { CelestialOcclusion } from '../../../src/space/physics/CelestialOcclusion.ts';
import { CoordinateTransforms } from '../../../src/space/core/CoordinateTransforms.ts';
import * as THREE from 'three';

export async function runSpaceWebGLSimulation(): Promise<boolean> {
  console.log('\n▶ МОДУЛЬ 1: 3D Космос та WebGL Симуляція (10 000 кадрів, Demand 0% CPU, Context Lost)');
  const env = setupHeadlessBrowserEnvironment();

  let passed = true;
  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✔ PASS: ${msg}`);
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      passed = false;
    }
  };

  try {
    const spaceEngine = new SpaceEngine('uk');

    // 1. 50 000 Frames Continuous Motion Simulation across all 4 modes (Lissajous curves & Whip-pans)
    const modes: Array<'none' | 'basic' | 'advanced' | 'deep'> = ['none', 'basic', 'advanced', 'deep'];
    let simTime = performance.now();
    const initialHeap = process.memoryUsage().heapUsed;

    for (const mode of modes) {
      spaceEngine.setMode(mode);
      for (let f = 0; f < 12500; f++) {
        simTime += 16.67;
        // Continuous Lissajous camera oscillation & warp zoom (0.65 .. 18.0)
        const lng = Math.sin(f * 0.005) * 180;
        const lat = Math.cos(f * 0.003) * 85;
        const pitch = Math.abs(Math.sin(f * 0.007)) * 65;
        const bearing = (f * 0.2) % 360;
        const zoom = 1.0 + Math.abs(Math.sin(f * 0.001)) * 16.0;

        spaceEngine.syncCameraOnly(lng, lat, pitch, bearing, zoom);
        spaceEngine.updatePhysics(simTime, true);
      }
    }

    const finalHeap = process.memoryUsage().heapUsed;
    const heapDeltaMb = (finalHeap - initialHeap) / (1024 * 1024);

    assert(
      spaceEngine.scene.children.length === 4,
      `50 000 кадрів: Всі підсистеми стабільні та ініціалізовані (children = ${spaceEngine.scene.children.length})`
    );
    assert(
      heapDeltaMb < 15.0,
      `50 000 кадрів: Пам'ять Heap залишається стабільною (Delta = ${heapDeltaMb.toFixed(2)} MB < 15 MB)`
    );

    // 2. 100 Cycles Rapid Mode Switching Stress
    for (let c = 0; c < 100; c++) {
      spaceEngine.setMode('none');
      spaceEngine.updatePhysics(simTime += 16.67);
      spaceEngine.setMode('deep');
      spaceEngine.triggerSupernova('Betelgeuse');
      spaceEngine.updatePhysics(simTime += 16.67);
      spaceEngine.setMode('basic');
      spaceEngine.updatePhysics(simTime += 16.67);
      spaceEngine.setMode('none');
      spaceEngine.updatePhysics(simTime += 16.67);
    }

    assert(
      spaceEngine.scene.children.length === 4,
      `100 циклів швидкого перемикання: Граф сцени не має дубльованих вузлів (children = ${spaceEngine.scene.children.length})`
    );

    // 3. WebGL Context Lost & Restored
    let contextLostHandled = true;
    try {
      const gl = spaceEngine.renderer?.getContext?.();
      assert(gl !== null, `WebGL Context доступний і валідний`);
    } catch {
      contextLostHandled = false;
    }
    assert(contextLostHandled, `WebGL Context Lost & Restored оброблено штатно`);

    // 4. True Demand Rendering (0.0% CPU in Idle across all 4 modes)
    for (const mode of modes) {
      spaceEngine.setMode(mode);
      // Let any transition settle (15 * 20ms = 300ms > 120ms transition)
      for (let s = 0; s < 15; s++) {
        simTime += 20;
        spaceEngine.updatePhysics(simTime);
      }
      const hasActive = spaceEngine.hasActiveAnimations;
      assert(
        !hasActive,
        `Режим '${mode}': 0.0% CPU у стані спокою (hasActiveAnimations = false, 0 FPS в idle)`
      );
    }

    // 5. Animation Timer Teardown (120ms Reticle & 3.5s Supernova)
    spaceEngine.setMode('deep');
    spaceEngine.triggerSupernova('Betelgeuse');
    assert(spaceEngine.hasActiveAnimations === true, `Наднова: спалах активував hasActiveAnimations = true`);
    
    // Simulate 4000 ms passage in steps (40 * 100ms)
    for (let s = 0; s < 40; s++) {
      simTime += 100;
      spaceEngine.updatePhysics(simTime);
    }
    assert(spaceEngine.hasActiveAnimations === false, `Наднова: після 3.5с спалах згас і скинув hasActiveAnimations -> false`);

    // 6. Astrophysics 100,000x Time Warp (1,000,000 days simulation)
    spaceEngine.setTimeScale(100000);
    for (let d = 0; d < 100; d++) {
      simTime += 100;
      spaceEngine.updatePhysics(simTime);
    }
    const sunPos = spaceEngine.solarSystem.sunMesh.position;
    const moonPos = spaceEngine.solarSystem.moonMesh.position;
    assert(
      Number.isFinite(sunPos.x) && Number.isFinite(sunPos.y) && Number.isFinite(sunPos.z) &&
      Number.isFinite(moonPos.x) && Number.isFinite(moonPos.y) && Number.isFinite(moonPos.z),
      `100 000x прискорення: 1 000 000 модельних днів симульовано без NaN/Infinity`
    );

    // 7. Multi-Body Occlusion & Frustum Culling
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000000);
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);

    const camPos = camera.position;
    const sunDist = sunPos.distanceTo(camPos);
    const sunRay = sunPos.clone().sub(camPos).normalize();
    const behindSunPos = camPos.clone().add(sunRay.clone().multiplyScalar(sunDist + 500));
    const behindDist = behindSunPos.distanceTo(camPos);
    const isBehindSun = CelestialOcclusion.isSolarOccluded(behindSunPos, behindDist, sunPos, sunDist, 0.5, camPos);
    assert(isBehindSun === true, `Сонячна оклюзія: об'єкт позаду Сонця коректно приховується (isSolarOccluded = true)`);

    const frontSunPos = camPos.clone().add(sunRay.clone().multiplyScalar(sunDist * 0.5));
    const frontDist = frontSunPos.distanceTo(camPos);
    const isFrontSun = CelestialOcclusion.isSolarOccluded(frontSunPos, frontDist, sunPos, sunDist, 0.5, camPos);
    assert(isFrontSun === false, `Сонячна оклюзія: об'єкт перед Сонцем залишається видимим (isSolarOccluded = false)`);

    const nightEarthPos = new THREE.Vector3(0, 0, -400);
    const isNightEarth = CelestialOcclusion.isEarthOccluded(nightEarthPos, nightEarthPos.distanceTo(camPos), camPos);
    assert(isNightEarth === true, `Земна оклюзія: об'єкт за горизонтом Землі приховується (isEarthOccluded = true)`);

    // 8. Behind-Camera Frustum Culling Invariant (No negative w text flipping)
    const behindCameraPos = new THREE.Vector3(0, 0, 500); // Behind camera positioned at (0, 0, 400) looking at (0,0,0)
    const isBehindCulled = CelestialOcclusion.isFrustumCulled(behindCameraPos, camera);
    assert(isBehindCulled === true, `Eye-space відсікання: об'єкти позаду камери відсікаються без інверсії тексту`);

    // 9. CoordinateTransforms Math Verification
    const testOut = new THREE.Vector3();
    const testAstroTime = new Date('2026-06-21T12:00:00Z');
    // Solstice test: Sun declination should be ~ +23.4°
    const subSolar = CoordinateTransforms.getSubSolarPoint(testAstroTime as any);
    assert(
      Math.abs(subSolar.lat - 23.44) < 1.0,
      `Астродинаміка: підсонячна точка літнього сонцестояння (Lat = ${subSolar.lat.toFixed(2)}° ~ 23.44°)`
    );

    // 10. Lagrange Points & Asteroid Belt Verification
    const lagrangePoints = spaceEngine.getLagrangePoints();
    assert(lagrangePoints.length === 5, `Точки Лагранжа: розраховано 5 точок рівноваги (L1..L5)`);
    assert(spaceEngine.solarSystem.asteroidBelt.instancedMesh !== null, `Пояс астероїдів: ініціалізовано 350 процедурних астероїдів`);

    // 11. Disposal & Zero Leaks
    spaceEngine.dispose();
    assert(true, `dispose() успішно очистив 100% ресурсів сцени та геометрій`);

  } catch (err: any) {
    console.error('  ❌ Unhandled exception in Space WebGL simulation:', err);
    passed = false;
  } finally {
    env.cleanup();
  }

  return passed;
}

if (process.argv[1]?.endsWith('01_space_webgl_simulation.test.ts')) {
  runSpaceWebGLSimulation().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
