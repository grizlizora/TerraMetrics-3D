import * as THREE from 'three';

export interface PlanetaryBody {
  name: string;
  radius: number;
  color: string;
  tilt: number;
  rotationSpeed: number;
  mesh: THREE.Mesh;
  material: THREE.Material;
  orbitRadius: number;
  parent?: THREE.Object3D;
  minApparentSize: number;
}

export interface MoonBody {
  name: string;
  radius: number;
  dist: number;
  period: number;
  mesh: THREE.Mesh;
  startingPhase: number;
}

export interface PlanetDef {
  name: string;
  radius: number;
  color: string;
  tex?: string;
  tilt: number;
  rot: number;
  minSize: number;
  atmosphere?: string;
  hasRings?: boolean;
  hasMoons?: boolean;
  aurora?: boolean;
  procedural?: boolean;
}

export const PLANET_DEFINITIONS: PlanetDef[] = [
  { name: 'Mercury', radius: 1148, color: '#aaaaaa', tex: '/assets/planets/mercurymap.jpg', tilt: 0.03, rot: 58.646, minSize: 18 },
  { name: 'Venus', radius: 2851, color: '#e3bb76', tex: '/assets/planets/venusmap.jpg', tilt: 177.3, rot: -243.02, minSize: 22, atmosphere: '#e8c988' },
  { name: 'Mars', radius: 1598, color: '#cc5533', tex: '/assets/planets/marsmap1k.jpg', tilt: 25.2, rot: 1.026, minSize: 20 },
  { name: 'Jupiter', radius: 16738, color: '#d39c7e', tex: '/assets/planets/jupitermap.jpg', tilt: 3.1, rot: 0.4135, minSize: 32, hasMoons: true, aurora: true },
  { name: 'Saturn', radius: 13958, color: '#e2bf7d', tex: '/assets/planets/saturnmap.jpg', tilt: 26.7, rot: 0.444, minSize: 28, hasRings: true, hasMoons: true },
  { name: 'Uranus', radius: 6018, color: '#7de2d1', tex: '/assets/planets/uranusmap.jpg', tilt: 97.8, rot: -0.718, minSize: 24, hasRings: true },
  { name: 'Neptune', radius: 5843, color: '#4b70dd', tex: '/assets/planets/neptunemap.jpg', tilt: 28.3, rot: 0.671, minSize: 24, atmosphere: '#4b88ff' },
  { name: 'Pluto', radius: 554, color: '#967155', tilt: 122.5, rot: -6.387, minSize: 16, procedural: true, hasMoons: true, atmosphere: '#88aaff' },
];

export const JUPITER_MOONS_DEF = [
  { name: 'Io', radius: 430, dist: 28000, period: 1.77, color: '#e6c84b', phase: 0.0 },
  { name: 'Europa', radius: 368, dist: 35000, period: 3.55, color: '#c8b496', phase: Math.PI * 0.5 },
  { name: 'Ganymede', radius: 620, dist: 45000, period: 7.15, color: '#968c82', phase: Math.PI },
  { name: 'Callisto', radius: 568, dist: 60000, period: 16.69, color: '#645a50', phase: Math.PI * 1.5 },
];

export const SUN_RADIUS = 163950;
export const MOON_RADIUS = 819;
