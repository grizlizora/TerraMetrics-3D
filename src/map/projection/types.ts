import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapInteractionManager } from '../interactions/MapInteractionManager';

export interface ProjectionTransitionContext {
  map: MapLibreMap;
  interactions: MapInteractionManager;
  onThemeRefresh: () => void;
  onReframeSelection: () => void;
}
