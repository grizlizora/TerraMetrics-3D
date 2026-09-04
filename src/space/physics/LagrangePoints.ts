import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { CoordinateTransforms } from '../core/CoordinateTransforms.ts';

export interface LagrangePointInfo {
  name: string;
  descriptionUk: string;
  descriptionEn: string;
  position: THREE.Vector3;
  distanceKm: number;
}

/**
 * LagrangePointsCalculator: Computes real-time 3D equilibrium coordinates (L1 - L5)
 * for the Sun-Earth gravitational two-body system.
 */
export class LagrangePointsCalculator {
  private static _sunVecScratch = new THREE.Vector3();
  private static _unitSunScratch = new THREE.Vector3();
  private static _crossScratch = new THREE.Vector3();
  private static _eclipticPoleScratch = new THREE.Vector3();

  // Earth obliquity J2000 eps = 23.43928 deg
  private static readonly SIN_EPS = 0.397777156;
  private static readonly COS_EPS = 0.917482062;

  // Mass ratio alpha = M_earth / (M_sun + M_earth) ≈ 3.003e-6
  // Hill sphere scale factor: (alpha / 3)^(1/3) ≈ 0.010006
  private static readonly HILL_RATIO = 0.010006;

  // Pre-allocated object pool for zero GC pressure during updates
  private static _posL1 = new THREE.Vector3();
  private static _posL2 = new THREE.Vector3();
  private static _posL3 = new THREE.Vector3();
  private static _posL4 = new THREE.Vector3();
  private static _posL5 = new THREE.Vector3();

  private static _cachedResult: LagrangePointInfo[] = [
    {
      name: 'Sun-Earth L1',
      descriptionUk: 'Точка гравітаційної рівноваги між Сонцем і Землею (1.5 млн км, місії SOHO, DSCOVR)',
      descriptionEn: 'Gravitational equilibrium point between Sun and Earth (1.5M km, SOHO, DSCOVR)',
      position: LagrangePointsCalculator._posL1,
      distanceKm: 1.5e6,
    },
    {
      name: 'Sun-Earth L2',
      descriptionUk: 'Точка позаду Землі (1.5 млн км, космічні телескопи JWST, Gaia, Euclid)',
      descriptionEn: 'Point behind Earth (1.5M km, space telescopes JWST, Gaia, Euclid)',
      position: LagrangePointsCalculator._posL2,
      distanceKm: 1.5e6,
    },
    {
      name: 'Sun-Earth L3',
      descriptionUk: 'Протилежна точка за Сонцем на орбіті Землі (~300 млн км)',
      descriptionEn: 'Opposite point behind the Sun along Earth orbit (~300M km)',
      position: LagrangePointsCalculator._posL3,
      distanceKm: 3.0e8,
    },
    {
      name: 'Sun-Earth L4',
      descriptionUk: 'Троянська точка (60° попереду Землі на орбіті, стабільна рівновага)',
      descriptionEn: 'Trojan point (60° ahead of Earth in orbit, stable equilibrium)',
      position: LagrangePointsCalculator._posL4,
      distanceKm: 1.5e8,
    },
    {
      name: 'Sun-Earth L5',
      descriptionUk: 'Грецька точка (60° позаду Землі на орбіті, стабільна рівновага)',
      descriptionEn: 'Greek point (60° behind Earth in orbit, stable equilibrium)',
      position: LagrangePointsCalculator._posL5,
      distanceKm: 1.5e8,
    },
  ];

  /**
   * Computes all 5 Sun-Earth Lagrange points for a given astronomical time.
   */
  public static computeSunEarthPoints(
    _astroTime: Astronomy.AstroTime,
    stRad: number,
    cachedSunGeo: { x: number; y: number; z: number }
  ): LagrangePointInfo[] {
    CoordinateTransforms.j2000EquatorialToMapLibre(cachedSunGeo, stRad, this._sunVecScratch);

    const rSun = this._sunVecScratch.length();
    if (rSun === 0) return [];

    this._unitSunScratch.copy(this._sunVecScratch).normalize();

    // L1: Between Earth and Sun (~1.5 million km from Earth towards Sun)
    const dL1L2 = rSun * this.HILL_RATIO;
    this._posL1.copy(this._unitSunScratch).multiplyScalar(dL1L2);

    // L2: Behind Earth away from Sun (~1.5 million km from Earth away from Sun)
    this._posL2.copy(this._unitSunScratch).multiplyScalar(-dL1L2);

    // L3: Opposite side of Sun from Earth along Sun vector (~2 AU from Earth)
    // Distance from Earth is rSun + rSun * (1 + 5/12 * alpha) ≈ 2.0 * rSun
    this._posL3.copy(this._unitSunScratch).multiplyScalar(rSun * 2.0);

    // Ecliptic pole normal in J2000 equatorial: (0, -sin(eps), cos(eps))
    CoordinateTransforms.j2000EquatorialToMapLibre(
      { x: 0, y: -this.SIN_EPS, z: this.COS_EPS },
      stRad,
      this._eclipticPoleScratch
    );
    this._eclipticPoleScratch.normalize();

    // Vector in ecliptic plane perpendicular to Earth-Sun line
    this._crossScratch.crossVectors(this._eclipticPoleScratch, this._unitSunScratch).normalize();

    const cos60 = 0.5;
    const sin60 = 0.8660254;

    this._posL4
      .copy(this._unitSunScratch)
      .multiplyScalar(rSun * cos60)
      .addScaledVector(this._crossScratch, rSun * sin60);

    this._posL5
      .copy(this._unitSunScratch)
      .multiplyScalar(rSun * cos60)
      .addScaledVector(this._crossScratch, -rSun * sin60);

    return this._cachedResult;
  }
}
