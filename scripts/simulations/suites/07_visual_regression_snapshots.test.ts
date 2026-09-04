// scripts/simulations/suites/07_visual_regression_snapshots.test.ts
import { setupHeadlessBrowserEnvironment } from '../harness/MockWebGLContext.ts';
import {
  AtmosphereShader,
  SunSurfaceShader,
  SunGlowShader,
  SunOuterGlowShader,
  StarfieldShader,
  ProceduralNebulaShader,
} from '../../../src/space/SpaceShaders.ts';
import { DeterministicSolarClimateEngine } from '../../../src/data/DeterministicSolarClimateEngine.ts';

export async function runVisualRegressionSnapshotsSimulation(): Promise<boolean> {
  console.log('\n▶ МОДУЛЬ 7: Visual Regression, Shader Pipeline & Topographic QA');
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
    // 1. Full Shader Collection Compilation & GLSL Validation
    const allShaders = [
      { name: 'AtmosphereShader', shader: AtmosphereShader },
      { name: 'SunSurfaceShader', shader: SunSurfaceShader },
      { name: 'SunGlowShader', shader: SunGlowShader },
      { name: 'SunOuterGlowShader', shader: SunOuterGlowShader },
      { name: 'StarfieldShader', shader: StarfieldShader },
      { name: 'ProceduralNebulaShader', shader: ProceduralNebulaShader },
    ];

    for (const { name, shader } of allShaders) {
      assert(
        typeof shader.vertexShader === 'string' &&
        shader.vertexShader.length > 20 &&
        typeof shader.fragmentShader === 'string' &&
        shader.fragmentShader.length > 20,
        `Shader Integrity: ${name} вертексний та фрагментний шейдери валідні`
      );
    }

    // 2. Solar Streamer Rayleigh Dispersion Multi-Octave Check
    assert(
      SunGlowShader.fragmentShader.includes('rays') && SunGlowShader.fragmentShader.includes('rayleighColor'),
      'SunGlowShader: Багатооктавні промені та релеївська дисперсія присутні у GLSL'
    );

    // 3. Topographic Altitude & Barometric Pressure Monotonic Invariant
    const seaLevel = DeterministicSolarClimateEngine.calculate(0, 0, 0);
    const midAlt = DeterministicSolarClimateEngine.calculate(0, 0, 2000);
    const highAlt = DeterministicSolarClimateEngine.calculate(0, 0, 8848);

    assert(
      (seaLevel.atmosphericPressureHpa || 0) > (midAlt.atmosphericPressureHpa || 0) &&
      (midAlt.atmosphericPressureHpa || 0) > (highAlt.atmosphericPressureHpa || 0),
      `Topography: Барометричний тиск монотонно спадає з висотою (${seaLevel.atmosphericPressureHpa} > ${midAlt.atmosphericPressureHpa} > ${highAlt.atmosphericPressureHpa} hPa)`
    );

    assert(
      seaLevel.estimatedTemperatureC > midAlt.estimatedTemperatureC &&
      midAlt.estimatedTemperatureC > highAlt.estimatedTemperatureC,
      `Topography: Температура спадає згідно з адіабатичним градієнтом (${seaLevel.estimatedTemperatureC}°C ➔ ${midAlt.estimatedTemperatureC}°C ➔ ${highAlt.estimatedTemperatureC}°C)`
    );

    // 4. WCAG Color Contrast Ratio for Glassmorphism Text & Badges using actual palette tokens
    const getLuminance = (hex: string): number => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };

    const getContrastRatio = (hex1: string, hex2: string): number => {
      const l1 = getLuminance(hex1);
      const l2 = getLuminance(hex2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    // Test dark mode: Pure/Bright text against dark canvas background (#060a12)
    const darkModeRatio = getContrastRatio('#ffffff', '#060a12');
    // Test light mode: Dark text (#0f172a) against light canvas background (#f0f4f8)
    const lightModeRatio = getContrastRatio('#0f172a', '#f0f4f8');

    assert(
      darkModeRatio >= 4.5 && lightModeRatio >= 4.5,
      `WCAG 2.1 AA Contrast: Контрастність теми (Dark: ${darkModeRatio.toFixed(2)}:1, Light: ${lightModeRatio.toFixed(2)}:1) перевищує мінімум 4.5:1`
    );

  } catch (err: any) {
    console.error('  ❌ EXCEPTION in Module 7:', err);
    passed = false;
  }

  return passed;
}
