import type { Map as MapLibreMap } from 'maplibre-gl';
import type { AppLanguage, SpaceMode } from '../../types';
import { SpaceEngine } from '../../space/SpaceEngine';
import { SpaceBridge } from '../../space/SpaceBridge';

export class MapSpaceController {
  public spaceEngine: SpaceEngine | null = null;
  public spaceBridge: SpaceBridge | null = null;
  public currentSpaceMode: SpaceMode = 'none';
  private currentLabelsVisible: boolean = true;

  public isSupported(): boolean {
    return true;
  }

  public warmUpIdle(map: MapLibreMap | null, currentLang: AppLanguage) {
    if (!map || this.spaceEngine) return;
    const runWarmup = () => {
      if (this.spaceEngine || !map) return;
      try {
        this.spaceEngine = new SpaceEngine(currentLang);
        this.spaceEngine.labelsVisible = this.currentLabelsVisible;
        this.spaceBridge = new SpaceBridge(this.spaceEngine);
        if (!map.getLayer(this.spaceBridge.id)) {
          try {
            map.addLayer(this.spaceBridge as any, 'world-base-layer');
          } catch {
            map.addLayer(this.spaceBridge as any);
          }
        }
        this.spaceEngine.setMode('none');
      } catch (e) {
        console.debug('[MapSpaceController] Idle warmup skipped:', e);
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(runWarmup, { timeout: 2000 });
    } else {
      setTimeout(runWarmup, 800);
    }
  }

  public setSpaceMode(
    mode: SpaceMode,
    map: MapLibreMap | null,
    currentLang: AppLanguage
  ) {
    this.currentSpaceMode = mode;
    if (!map) return;

    if (!this.isSupported()) return;

    if (mode === 'none') {
      if (this.spaceEngine) {
        this.spaceEngine.setMode('none');
      }
      map.triggerRepaint();
      return;
    }

    if (!this.spaceEngine) {
      this.spaceEngine = new SpaceEngine(currentLang);
      this.spaceEngine.labelsVisible = this.currentLabelsVisible;
      this.spaceBridge = new SpaceBridge(this.spaceEngine);
    }

    if (this.spaceBridge && !map.getLayer(this.spaceBridge.id)) {
      try {
        map.addLayer(this.spaceBridge as any, 'world-base-layer');
      } catch {
        try {
          map.addLayer(this.spaceBridge as any);
        } catch (e) {
          console.warn('[MapSpaceController] Failed to add SpaceBridge layer:', e);
        }
      }
    }

    if (this.spaceEngine) {
      this.spaceEngine.setMode(mode);
      map.triggerRepaint();
    }
  }

  public setSpaceLabelsVisible(visible: boolean, map: MapLibreMap | null) {
    this.currentLabelsVisible = visible;
    if (this.spaceEngine) {
      this.spaceEngine.applyLabelsVisibility(visible);
      map?.triggerRepaint();
    }
  }

  public setTimeScale(scale: number, map: MapLibreMap | null) {
    if (this.spaceEngine) {
      this.spaceEngine.setTimeScale(scale);
      map?.triggerRepaint();
    }
  }

  public updateAstronomicalPositions(date?: Date) {
    if (this.spaceEngine && this.spaceEngine.isActive) {
      this.spaceEngine.updateAstronomicalPositions(date);
    }
  }

  public destroy(map: MapLibreMap | null) {
    if (this.spaceBridge) {
      if (map && map.getLayer(this.spaceBridge.id)) {
        try {
          map.removeLayer(this.spaceBridge.id);
        } catch {}
      }
      try {
        this.spaceBridge.onRemove();
      } catch {}
      this.spaceBridge = null;
    }
    if (this.spaceEngine) {
      this.spaceEngine.dispose();
      this.spaceEngine = null;
    }
  }
}
