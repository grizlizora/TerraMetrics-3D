// scripts/simulations/suites/04_perf_zero_gc_profiler.test.ts
import { setupHeadlessBrowserEnvironment } from '../harness/MockWebGLContext.ts';
import { ZeroGCSpy } from '../harness/ZeroGCSpy.ts';
import { LeakTracker } from '../harness/LeakTracker.ts';
import { SpaceEngine } from '../../../src/space/SpaceEngine.ts';

export async function runPerfZeroGCProfiler(): Promise<boolean> {
  console.log('\n▶ МОДУЛЬ 4: Профілювання продуктивності, Zero-GC (120 FPS) та витоків ресурсів');
  let passed = true;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✔ PASS: ${msg}`);
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      passed = false;
    }
  };

  const env = setupHeadlessBrowserEnvironment();

  try {
    // 1. Hot-Loop Zero-GC Assertion (1200 frames @ 120 FPS)
    const spaceEngine = new SpaceEngine('uk');
    spaceEngine.setMode('deep'); // heaviest mode

    // Warmup JIT (100 frames)
    let simTime = performance.now();
    for (let i = 0; i < 100; i++) {
      simTime += 8.33;
      spaceEngine.updatePhysics(simTime);
    }

    const spy = new ZeroGCSpy();
    spy.start();

    // 1200 hot loop frames
    for (let i = 0; i < 1200; i++) {
      simTime += 8.33;
      spaceEngine.updatePhysics(simTime);
    }

    const stats = spy.stop();
    spaceEngine.dispose();

    assert(
      stats.totalAllocations === 0,
      `Zero-GC Гарячий цикл: 1200 кадрів (@ 120 FPS) — строго ${stats.totalAllocations} виділень об'єктів у кадрі (clones: ${stats.threeClones}, heapDelta: ${stats.heapDeltaKb.toFixed(1)} KB)`
    );

    // 2. Lifecycle LeakTracker Verification
    const tracker = new LeakTracker();
    tracker.enable();

    // Run 10 sequential create -> stress -> dispose cycles
    for (let c = 0; c < 10; c++) {
      const se = new SpaceEngine('uk');
      se.setMode('deep');
      for (let f = 0; f < 20; f++) {
        se.updatePhysics(simTime += 16.67);
      }
      se.dispose();
    }

    await new Promise(r => setTimeout(r, 20));

    const leakReport = tracker.getResidualState();
    tracker.disable();

    if (!leakReport.passed) {
      console.log('    Residual leaks details:', JSON.stringify(leakReport, null, 2));
    }
    assert(
      leakReport.passed,
      `Життєвий цикл (10 циклів Mount/Unmount): 0 залишкових глобальних слухачів подій та таймерів`
    );

    // 3. Low-End Mobile Hardware Profiling (MAX_TEXTURE_SIZE=2048, 4x CPU throttle simulation)
    const lowEndEngine = new SpaceEngine('uk');
    lowEndEngine.setMode('deep');

    const tThrottleStart = performance.now();
    for (let f = 0; f < 500; f++) {
      // 4x simulated CPU load per frame
      for (let busy = 0; busy < 2000; busy++) {
        Math.sqrt(busy * 3.14159);
      }
      simTime += 16.67;
      lowEndEngine.updatePhysics(simTime, true);
    }
    const frameTimeAvg = (performance.now() - tThrottleStart) / 500;
    lowEndEngine.dispose();

    assert(
      frameTimeAvg < 8.33,
      `Емуляція Low-End пристрою (4x CPU навантаження): середній час оновлення кадру ${frameTimeAvg.toFixed(3)} ms (< 8.33 ms бюджет 120 FPS)`
    );

  } catch (err: any) {
    console.error('  ❌ Unhandled exception in Perf Zero-GC Profiler:', err);
    passed = false;
  } finally {
    env.cleanup();
  }

  return passed;
}

if (process.argv[1]?.endsWith('04_perf_zero_gc_profiler.test.ts')) {
  runPerfZeroGCProfiler().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
