# TerraMetrics 3D: High-Level Architecture Guide 🏛️🌐

## 1. System Architecture Diagram

```mermaid
graph TD
    User([User / AI Agent]) --> UI[React 19 & Tailwind v4 UI Suite]
    UI --> Store[Zustand 5 App Store]
    
    subgraph Map & Rendering Engine
        Store --> Hooks[Modular Canvas Hooks]
        Hooks --> Engine[MapEngine Facade]
        Engine --> MapLibre[MapLibre GL JS v5]
        Engine --> SpaceBridge[SpaceBridge: CustomLayerInterface]
        SpaceBridge --> Three[Three.js r185 WebGL Scene]
        Three --> Shaders[Custom GLSL: Corona, Atmosphere, Nebula, Stars]
        Three --> Ephemeris[NASA VSOP87 Astronomical Dynamics]
    end

    subgraph Data & Storage Layer
        Engine --> DataLoader[DataLoader & Web Worker]
        DataLoader --> SWR[DataSyncManager: SWR Delta Sync]
        SWR --> L1[(L1: In-Memory Cache <1ms)]
        SWR --> L2[(L2: IndexedDB <15ms)]
        SWR --> L3[(L3: Bundled Assets & PWA SW)]
        SWR --> Remote[Google Drive / Remote Manifest SWR]
    end

    subgraph Audio & Hardware
        UI --> Audio[AudioManager: Procedural Web Audio API]
        UI --> Native[Capacitor 7: Haptics, Back Button, Status Bar]
    end
```

---

## 2. Key Architectural Invariants

### 120 FPS Zero-GC SLA
- All hot-loop matrix transformations, coordinate conversions, and ephemeris calculations reuse preallocated scratch vectors and quaternions.
- Verified by automated continuous frame profiler (`ZeroGCSpy`) across 1,200 continuous frames.

### WebGL State Multiplexing
- Three.js and MapLibre share a single WebGL2 canvas context via `CustomLayerInterface`.
- Full attribute array unbinding, texture unbinding, program resets, and `painterContext.setDirty()` eliminate state collisions.

### 100% Deterministic Offline Operation
- When offline, `DeterministicSolarClimateEngine` models solar geometry, Tetens vapor pressure, and atmospheric insolation without network latency.
- IndexedDB + Service Worker precaches offline dataset fallback.
