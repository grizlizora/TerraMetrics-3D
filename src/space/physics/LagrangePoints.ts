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
  private static _orthoScratch = new THREE.Vector3();

  // Mass ratio alpha = M_earth / (M_sun + M_earth) ≈ 3.003e-6
  // Hill sphere scale factor: (alpha / 3)^(1/3) ≈ 0.010006
  private static readonly HILL_RATIO = 0.010006;

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
    const posL1 = new THREE.Vector3().copy(this._unitSunScratch).multiplyScalar(dL1L2);

    // L2: Behind Earth away from Sun (~1.5 million km from Earth away from Sun)
    const posL2 = new THREE.Vector3().copy(this._unitSunScratch).multiplyScalar(-dL1L2);

    // L3: Opposite side of Sun from Earth (~2 AU from Earth along Sun vector)
    const posL3 = new THREE.Vector3().copy(this._unitSunScratch).multiplyScalar(-rSun);

    // Find orbital plane normal using Earth's velocity vector / ecliptic axis
    const upAxis = new THREE.Vector3(0, 0, 1);
    this._crossScratch.crossVectors(this._unitSunScratch, upAxis).normalize();
    this._orthoScratch.crossVectors(this._crossScratch, this._unitSunScratch).normalize();

    const cos60 = 0.5;
    const sin60 = 0.8660254;

    const posL4 = new THREE.Vector3()
      .copy(this._unitSunScratch)
      .multiplyScalar(rSun * cos60)
      .addScaledVector(this._crossScratch, rSun * sin60);

    const posL5 = new THREE.Vector3()
      .copy(this._unitSunScratch)
      .multiplyScalar(rSun * cos60)
      .addScaledVector(this._crossScratch, -rSun * sin60);

    return [
      {
        name: 'Sun-Earth L1',
        descriptionUk: 'Точка гравітаційної рівноваги між Сонцем і Землею (1.5 млн км, місії SOHO, DSCOVR)',
        descriptionEn: 'Gravitational equilibrium point between Sun and Earth (1.5M km, SOHO, DSCOVR)',
        position: posL1,
        distanceKm: 1.5e6,
      },
      {
        name: 'Sun-Earth L2',
        descriptionUk: 'Точка позаду Землі (1.5 млн км, космічні телескопи JWST, Gaia, Euclid)',
        descriptionEn: 'Point behind Earth (1.5M km, space telescopes JWST, Gaia, Euclid)',
        position: posL2,
        distanceKm: 1.5e6,
      },
      {
        name: 'Sun-Earth L3',
        descriptionUk: 'Протилежна точка за Сонцем на орбіті Землі (~300 млн км)',
        descriptionEn: 'Opposite point behind the Sun along Earth orbit (~300M km)',
        position: posL3,
        distanceKm: 3.0e8,
      },
      {
        name: 'Sun-Earth L4',
        descriptionUk: 'Троянська точка (60° попереду Землі на орбіті, стабільна рівновага)',
        descriptionEn: 'Trojan point (60° ahead of Earth in orbit, stable equilibrium)',
        position: posL4,
        distanceKm: 1.5e8,
      },
      {
        name: 'Sun-Earth L5',
        descriptionUk: 'Грецька точка (60° позаду Землі на орбіті, стабільна рівновага)',
        descriptionEn: 'Greek point (60° behind Earth in orbit, stable equilibrium)',
        position: posL5,
        distanceKm: 1.5e8,
      },
    ];
  }
}
