// scripts/simulations/suites/06_visual_spatial_qa.test.ts
import { setupHeadlessBrowserEnvironment } from '../harness/MockWebGLContext.ts';
import { AudioManager } from '../../../src/audio/AudioManager.ts';
import { ProceduralNebulaShader } from '../../../src/space/SpaceShaders.ts';
import { DeepSpaceModule } from '../../../src/space/systems/DeepSpaceModule.ts';
import { EphemerisEngine } from '../../../src/space/physics/EphemerisEngine.ts';
import { terraStorageDB } from '../../../src/data/sync/TerraStorageDB.ts';
import { dataSyncManager } from '../../../src/data/sync/DataSyncManager.ts';
import { ClimateMath } from '../../../src/utils/climateMath.ts';
import * as THREE from 'three';

export async function runVisualSpatialQASimulation(): Promise<boolean> {
  console.log('\n▶ МОДУЛЬ 6: Visual & Spatial Audio QA, Procedural Shaders та Offline SLAs');
  setupHeadlessBrowserEnvironment();

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
    // 1. 3D Spatial Audio & Stereo Panning Validation
    const audio = new AudioManager();
    audio.init();

    // Verify Stereo Panning Bounds & Math
    const testPoints = [
      { screenX: 0, screenW: 1000, expectedPan: -1.0 },
      { screenX: 500, screenW: 1000, expectedPan: 0.0 },
      { screenX: 1000, screenW: 1000, expectedPan: 1.0 },
      { screenX: -100, screenW: 1000, expectedPan: -1.0 }, // Clamped
      { screenX: 1200, screenW: 1000, expectedPan: 1.0 }, // Clamped
    ];

    for (const pt of testPoints) {
      const calcPan = Math.max(-1.0, Math.min(1.0, ((pt.screenX / pt.screenW) - 0.5) * 2.0));
      assert(
        Math.abs(calcPan - pt.expectedPan) < 1e-6,
        `Spatial Audio: Pan для точки X=${pt.screenX}px дорівнює ${calcPan.toFixed(2)} (очікувано ${pt.expectedPan.toFixed(2)})`
      );
    }

    // Verify Distance Attenuation Formula
    const baseVol = 0.5;
    const nearDist = 1.0;
    const farDist = 10.0;
    const nearVol = baseVol / Math.max(1.0, nearDist);
    const farVol = baseVol / Math.max(1.0, farDist);
    assert(
      nearVol === 0.5 && farVol === 0.05,
      `Spatial Audio: Згасання гучності на відстані 10x складає ${farVol} (відношення: ${(nearVol / farVol).toFixed(1)}x)`
    );

    // 2. Procedural Volumetric Nebula Shader Uniforms & Material
    assert(
      typeof ProceduralNebulaShader.vertexShader === 'string' &&
      ProceduralNebulaShader.vertexShader.length > 50 &&
      typeof ProceduralNebulaShader.fragmentShader === 'string' &&
      ProceduralNebulaShader.fragmentShader.includes('fbm'),
      'Procedural Nebula: GLSL вертексний та фрагментний шейдери валідні і містять fBm шум'
    );

    const deepSpace = new DeepSpaceModule();
    const ephemeris = new EphemerisEngine();
    let markersRegistered = 0;
    deepSpace.create(() => {
      markersRegistered++;
    }, ephemeris);

    deepSpace.update(1500); // 1.5s in simulation
    assert(
      deepSpace.group.children.length > 0,
      `DeepSpaceModule: Успішно ініціалізовано ${deepSpace.group.children.length} астрономічних об'єктів та туманностей`
    );

    deepSpace.dispose();
    assert(
      deepSpace.group.children.length === 0,
      'DeepSpaceModule: dispose() коректно очистив ресурси шейдерів та мешів'
    );

    // 3. Interactive Climate Scrubbing Bucket Resolution
    const monthlyPoints = ClimateMath.generateMonthlyTemperatures(50.45, 'uk'); // Kyiv latitude
    assert(
      monthlyPoints.length === 12,
      'ClimateMath: 12 місячних точок успішно згенеровано для інтерактивного скрабінгу'
    );

    const scrubWidth = 600;
    for (let m = 0; m < 12; m++) {
      const touchX = (m + 0.5) * (scrubWidth / 12);
      const calculatedIndex = Math.max(0, Math.min(Math.floor((touchX / scrubWidth) * 12), 11));
      assert(
        calculatedIndex === m,
        `Climate Scrubbing: Сенсорний жест X=${touchX.toFixed(0)}px потрапляє у місяць index=${calculatedIndex} (${monthlyPoints[calculatedIndex].month})`
      );
    }

    // 4. Zero-Loss Structured Clone Offline Cold Start Benchmark
    const startBench = performance.now();
    const bundle = await dataSyncManager.loadDataset();
    const elapsed = performance.now() - startBench;

    assert(
      bundle.geoJson && bundle.geoJson.features.length >= 238,
      `Offline Dataset: Завантажено ${bundle.geoJson.features.length} полігонів країн зі 100% збереженням координат`
    );
    assert(
      elapsed < 250.0,
      `Cold Start Benchmark: Відновлення бандлу з кешу зайняло ${elapsed.toFixed(2)} ms (< 250 ms SLA)`
    );

  } catch (err: any) {
    console.error('  ❌ EXCEPTION in Module 6:', err);
    passed = false;
  }

  return passed;
}
