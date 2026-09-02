import type { MarkerItem, MarkerTier, ReticleCacheItem, SpaceModeType } from '../SpaceTypes.ts';

export type { MarkerItem, MarkerTier, ReticleCacheItem, SpaceModeType };

export interface MarkerOcclusionResult {
  isCulled: boolean;
  transFactor: number;
  bodyDist: number;
  ndcX: number;
  ndcY: number;
  ndcZ: number;
}

export interface MarkerHoverParams {
  mouseX: number;
  mouseY: number;
  halfW: number;
  halfH: number;
  viewH: number;
  tanHalfFov: number;
}
