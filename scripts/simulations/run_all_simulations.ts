// scripts/simulations/run_all_simulations.ts
import { runSpaceWebGLSimulation } from './suites/01_space_webgl_simulation.test.ts';
import { runMobileGesturesUISimulation } from './suites/02_mobile_gestures_ui.test.ts';
import { runAnalyticsMatrixScanner } from './suites/03_analytics_matrix_scanner.test.ts';
import { runPerfZeroGCProfiler } from './suites/04_perf_zero_gc_profiler.test.ts';
import { runStorageCryptoChaos } from './suites/05_storage_crypto_chaos.test.ts';

async function main() {
  console.log('======================================================================');
  console.log(' 🧪 TerraMetrics-3D: Master Simulation & Stress Testing Suite');
  console.log('======================================================================');

  const startTime = performance.now();

  const results = [
    await runSpaceWebGLSimulation(),
    await runMobileGesturesUISimulation(),
    await runAnalyticsMatrixScanner(),
    await runPerfZeroGCProfiler(),
    await runStorageCryptoChaos(),
  ];

  const durationMs = performance.now() - startTime;
  const allPassed = results.every(Boolean);

  console.log('\n======================================================================');
  if (allPassed) {
    console.log(` 🏁 Підсумок тестування: ВСІ 5 МОДУЛІВ ПРОЙДЕНО (100% Успіх)`);
    console.log(` ⏱️ Загальний час виконання: ${(durationMs / 1000).toFixed(2)}s`);
    console.log('======================================================================\n');
    process.exit(0);
  } else {
    console.error(` ❌ Підсумок тестування: ВИЯВЛЕНО ПОМИЛКИ`);
    console.error('======================================================================\n');
    process.exit(1);
  }
}

main();
