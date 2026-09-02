// scripts/generate_docs.ts: Automated API & Architecture Documentation Generator
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  console.log('======================================================');
  console.log(' 📚 TerraMetrics-3D: Generating Technical API Docs   ');
  console.log('======================================================');

  const docsDir = resolve(process.cwd(), 'docs');
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }

  const apiDocContent = `# TerraMetrics 3D: Architecture & API Reference 🌍📖

## Overview
TerraMetrics 3D is a high-performance geospatial analytics engine and WebGL celestial visualization platform.

---

## 🏛️ Core Architectural Subsystems

### 1. WebGL Multiplexing & Space Bridge
- **Class:** \`SpaceBridge\` (\`src/space/SpaceBridge.ts\`)
- **Integration:** Implements MapLibre GL JS \`CustomLayerInterface\`.
- **Key Responsibilities:**
  - Injects Three.js scene directly into MapLibre WebGL state machine.
  - Zero-State Contamination: Disables all vertex attrib arrays, clears program & VAOs, sets \`painterContext.setDirty()\`.
  - Demand rendering: Sleeps render loop when stationary and animations are idle.

### 2. Astronomical Physics & Ephemerides
- **Class:** \`EphemerisEngine\` (\`src/space/physics/EphemerisEngine.ts\`)
- **Class:** \`LagrangePointsCalculator\` (\`src/space/physics/LagrangePoints.ts\`)
- **Algorithms:**
  - NASA VSOP87 planetary theory (\`astronomy-engine\`).
  - J2000 ICRF to ECEF transformation via Greenwich Sidereal Time (GST).
  - 3D Lagrange points ($L_1 - L_5$) restricted three-body gravitational solver with Hill sphere ratio ($0.010006$).

### 3. Deterministic Solar Climate Engine
- **Class:** \`DeterministicSolarClimateEngine\` (\`src/data/DeterministicSolarClimateEngine.ts\`)
- **Formulas:**
  - Equation of Time & Solar Declination.
  - Air mass transmittance & DNI/GHI direct/diffuse radiation.
  - Tetens vapor pressure & Laplace-Babinet barometric hypsometry.
  - Dynamic moist/dry adiabatic lapse rates ($\\Gamma_m \\approx 4.5\\dots 6.5 \\text{ K/km}$ vs $\\Gamma_d = 9.8 \\text{ K/km}$).

### 4. Storage & Delta Sync Architecture (L1 ➔ L2 ➔ L3)
- **Class:** \`DataSyncManager\` (\`src/data/sync/DataSyncManager.ts\`)
- **Class:** \`TerraStorageDB\` (\`src/data/sync/TerraStorageDB.ts\`)
- **Tiers:**
  - **L1:** In-memory cached bundle (<1ms).
  - **L2:** IndexedDB \`terrametrics_data_v1\` (<15ms).
  - **L3:** Bundled fallback assets & PWA Service Worker.
- **Security:** SHA-256 integrity verification, rollback on corruption, XOR+Base64Url link obfuscation.

### 5. Procedural Web Audio Synthesis
- **Class:** \`AudioManager\` (\`src/audio/AudioManager.ts\`)
- **Features:**
  - 100% procedural synthesis (0 audio files downloaded).
  - 14 distinct tone envelopes, 3D stereo panning, distance attenuation.
  - Cinematic dual-oscillator space ambient drone (43.65 Hz / 65.41 Hz) with 0.08 Hz slow LFO modulation.

### 6. AI Agent & Programmatic Live UI API
- **Class:** \`ExternalAPI\` (\`src/api/ExternalAPI.ts\`)
- **Namespace:** \`window.TerraMetricsAPI\`
- **Methods:**
  - \`getVisibleControls()\`: Returns bounding boxes and actions for all visible buttons/inputs.
  - \`getAppState()\`: Returns current category, submode, coordinates, space mode, and theme.
  - \`getLagrangePoints()\`: Returns real-time 3D coordinates of all 5 Lagrange points.
  - \`getOfflineStatus()\`: Returns connection, IndexedDB, and Service Worker status.

---

## 🧪 Testing & QA Verification
- **Unit Tests:** \`npm run test:unit\`
- **Storage E2E:** \`npm run test:storage\`
- **Simulation Suite (7 Modules):** \`npm run test:simulations\`
- **SAST Security Audit:** \`npm run security:audit\`
`;

  const outputPath = resolve(docsDir, 'API.md');
  writeFileSync(outputPath, apiDocContent, 'utf-8');
  console.log(`✅ [Docs] Generated technical documentation at: ${outputPath}`);
  console.log('======================================================\n');
}

main();
