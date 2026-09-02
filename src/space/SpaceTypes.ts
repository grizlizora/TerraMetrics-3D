import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import type { AppLanguage } from '../types/index.ts';

export type SpaceModeType = 'none' | 'basic' | 'advanced' | 'deep';
export type MarkerTier = 'basic' | 'advanced' | 'deep';

export type MarkerRegistrationCallback = (
  parentMesh: THREE.Object3D,
  name: string,
  colorStr: string,
  scaleMult?: number,
  tier?: MarkerTier
) => void;

export interface MarkerItem {
  labelSprite: THREE.Sprite;
  reticleSprite: THREE.Sprite | null;
  labelCanvas: HTMLCanvasElement;
  colorStr: string;
  name: string;
  tier: MarkerTier;
  parentMesh: THREE.Object3D;
  scaleMult: number;
  visualOffset: number;
  radius: number;
  isHovered?: boolean;
  isTransitioning?: boolean;
  hoverStartTime?: number;
  startOpacity?: number;
  targetOpacity?: number;
  startScale?: number;
  targetScale?: number;
  currentScale?: number;
}

export interface ReticleCacheItem {
  canvas: HTMLCanvasElement;
  tex: THREE.CanvasTexture;
  mat?: THREE.SpriteMaterial;
}

export interface PlanetaryBody {
  mesh: THREE.Mesh;
  radius: number;
  name: string;
  orbitRadius?: number;
  orbitPeriod?: number;
  rotationPeriod?: number;
  startingPhase?: number;
  eccentricity?: number;
  axialTilt?: number;
  orbitalInclination?: number;
  bodyKey?: Astronomy.Body;
  color?: number;
  dummyGroup?: THREE.Group;
}
