import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { AU, CELESTIAL_SPHERE_RADIUS, J2000_MS } from '../core/SpaceConstants.ts';
import { CoordinateTransforms } from '../core/CoordinateTransforms.ts';

export class EphemerisEngine {
  public simTimeDays = 0;
  public timeScale = 1;

  private _cachedSimDate = new Date();
  private _cachedAstroTime: Astronomy.AstroTime | null = null;
  private _lastAstroCalcMs = 0;
  private _cachedPositions: Record<string, { pos: THREE.Vector3; lastCalc: number }> = {};
  private _simResultScratch: { astroTime: Astronomy.AstroTime; stRad: number; now: number } | null = null;

  constructor() {
    this.setDate(new Date());
  }

  private _cachedGeoVectors: Record<string, { x: number; y: number; z: number; lastCalc: number }> = {};

  public setDate(date: Date) {
    this.simTimeDays = (date.getTime() - J2000_MS) / 86400000;
    this._cachedSimDate = new Date(date.getTime());
    this._cachedAstroTime = new Astronomy.AstroTime(this._cachedSimDate);
    this._lastAstroCalcMs = 0;
    this._cachedPositions = {};
    this._cachedGeoVectors = {};
  }

  public updateSimulationTime(dtMs: number): {
    astroTime: Astronomy.AstroTime;
    stRad: number;
    now: number;
  } {
    this.simTimeDays += ((dtMs / 1000) * this.timeScale) / 86400;
    this._cachedSimDate.setTime(J2000_MS + this.simTimeDays * 86400000);

    const now = performance.now();
    // Cache AstroTime object when timeScale is 1, recompute periodically
    if (!this._cachedAstroTime || Math.abs(this.timeScale) > 1 || now - this._lastAstroCalcMs > 500) {
      this._cachedAstroTime = new Astronomy.AstroTime(this._cachedSimDate);
      this._lastAstroCalcMs = now;
    }

    const astroTime = this._cachedAstroTime;
    const gstHours = Astronomy.SiderealTime(astroTime);
    const stRad = (gstHours / 24) * Math.PI * 2;

    if (!this._simResultScratch) {
      this._simResultScratch = { astroTime, stRad, now };
    } else {
      this._simResultScratch.astroTime = astroTime;
      this._simResultScratch.stRad = stRad;
      this._simResultScratch.now = now;
    }

    return this._simResultScratch;
  }

  public getMapboxPos(
    bodyName: string,
    astroTime: Astronomy.AstroTime,
    out: THREE.Vector3
  ): THREE.Vector3 {
    const now = performance.now();
    let cachedVec = this._cachedGeoVectors[bodyName];
    if (!cachedVec || Math.abs(this.timeScale) > 1 || now - cachedVec.lastCalc > 2000) {
      const geoVec = Astronomy.GeoVector(bodyName as Astronomy.Body, astroTime, true);
      if (!geoVec) {
        out.set(0, 0, 0);
        return out;
      }
      if (!cachedVec) {
        cachedVec = { x: geoVec.x * AU, y: geoVec.y * AU, z: geoVec.z * AU, lastCalc: now };
        this._cachedGeoVectors[bodyName] = cachedVec;
      } else {
        cachedVec.x = geoVec.x * AU;
        cachedVec.y = geoVec.y * AU;
        cachedVec.z = geoVec.z * AU;
        cachedVec.lastCalc = now;
      }
    }

    const gstHours = Astronomy.SiderealTime(astroTime);
    const stRad = (gstHours / 24) * Math.PI * 2;

    CoordinateTransforms.j2000EquatorialToMapLibre(
      cachedVec,
      stRad,
      out
    );

    return out;
  }

  public setVectorFromRaDec(
    target: THREE.Vector3,
    raHours: number,
    decDeg: number,
    distance = CELESTIAL_SPHERE_RADIUS
  ) {
    CoordinateTransforms.raDecToMapLibreSphere(raHours, decDeg, distance, target);
  }

  public computeLunarEclipse(astroTime: Astronomy.AstroTime): {
    eclipseRedness: number;
    eclipseDarkening: number;
  } {
    let eclipseDarkening = 1.0;
    let eclipseRedness = 0.0;
    try {
      const sunVec = Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, true);
      const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true);
      if (sunVec && moonVec) {
        const angleSunMoon = Astronomy.AngleBetween(sunVec, moonVec);
        const eclipseDiff = 180 - angleSunMoon;

        if (eclipseDiff < 1.0) {
          const depth = 1.0 - eclipseDiff;
          eclipseDarkening = 1.0 - depth * 0.85;
          eclipseRedness = depth;
        }
      }
    } catch {
      // Fallback default
    }

    return { eclipseRedness, eclipseDarkening };
  }
}
