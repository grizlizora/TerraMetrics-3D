import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';

/**
 * Pure Astrodynamics & Trigonometric Coordinate Transform Functions
 * Formulates exact transformations between J2000 Geocentric Equatorial Frame (ICRF),
 * Earth-Centered Earth-Fixed (ECEF) MapLibre 3D Frame, and Spherical Geographic Coordinates.
 */
export class CoordinateTransforms {
  /**
   * Transforms J2000 Equatorial vector (x_eq, y_eq, z_eq) into MapLibre ECEF 3D coordinates at sidereal time stRad (GMST)
   */
  public static j2000EquatorialToMapLibre(
    geoVec: { x: number; y: number; z: number },
    stRad: number,
    out: THREE.Vector3
  ): THREE.Vector3 {
    const sinSt = Math.sin(stRad);
    const cosSt = Math.cos(stRad);

    const geoX = geoVec.x * sinSt - geoVec.y * cosSt;
    const geoY = geoVec.z;
    const geoZ = geoVec.x * cosSt + geoVec.y * sinSt;

    return out.set(geoX, geoY, geoZ);
  }

  /**
   * Converts Right Ascension (hours) and Declination (degrees) to MapLibre unrotated sphere position (-y, z, x)
   */
  public static raDecToMapLibreSphere(
    raHours: number,
    decDeg: number,
    radius: number,
    out: THREE.Vector3
  ): THREE.Vector3 {
    const theta = (raHours / 24) * Math.PI * 2;
    const phi = ((90 - decDeg) * Math.PI) / 180;

    const j2000_x = radius * Math.sin(phi) * Math.cos(theta);
    const j2000_y = radius * Math.sin(phi) * Math.sin(theta);
    const j2000_z = radius * Math.cos(phi);

    return out.set(-j2000_y, j2000_z, j2000_x);
  }

  /**
   * Converts geographic Latitude/Longitude into MapLibre 3D cartesian coordinates
   */
  public static geographicToMapLibre(
    latDeg: number,
    lonDeg: number,
    radius: number,
    out: THREE.Vector3
  ): THREE.Vector3 {
    const phi = (latDeg * Math.PI) / 180;
    const lambda = (lonDeg * Math.PI) / 180;

    const x = -radius * Math.cos(phi) * Math.sin(lambda);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.cos(lambda);

    return out.set(x, y, z);
  }

  /**
   * Computes geographic Sub-Solar Point (Lat, Lon) on Earth for a given Astronomy.AstroTime or Date
   */
  public static getSubSolarPoint(timeInput: Astronomy.AstroTime | Date): { lat: number; lon: number } {
    const astroTime = timeInput instanceof Date ? new Astronomy.AstroTime(timeInput) : timeInput;
    const observer = new Astronomy.Observer(0, 0, 0);
    const sunEq = Astronomy.Equator(Astronomy.Body.Sun, astroTime, observer, true, true);
    const gmstHours = Astronomy.SiderealTime(astroTime);
    const gmstRad = (gmstHours / 24) * Math.PI * 2;
    const raRad = (sunEq.ra / 24) * Math.PI * 2;

    let lonRad = raRad - gmstRad;
    while (lonRad > Math.PI) lonRad -= 2 * Math.PI;
    while (lonRad < -Math.PI) lonRad += 2 * Math.PI;

    return {
      lat: sunEq.dec,
      lon: (lonRad * 180) / Math.PI,
    };
  }

  /**
   * Computes geographic Sub-Lunar Point (Lat, Lon) on Earth for a given Astronomy.AstroTime or Date
   */
  public static getSubLunarPoint(timeInput: Astronomy.AstroTime | Date): { lat: number; lon: number } {
    const astroTime = timeInput instanceof Date ? new Astronomy.AstroTime(timeInput) : timeInput;
    const observer = new Astronomy.Observer(0, 0, 0);
    const moonEq = Astronomy.Equator(Astronomy.Body.Moon, astroTime, observer, true, true);
    const gmstHours = Astronomy.SiderealTime(astroTime);
    const gmstRad = (gmstHours / 24) * Math.PI * 2;
    const raRad = (moonEq.ra / 24) * Math.PI * 2;

    let lonRad = raRad - gmstRad;
    while (lonRad > Math.PI) lonRad -= 2 * Math.PI;
    while (lonRad < -Math.PI) lonRad += 2 * Math.PI;

    return {
      lat: moonEq.dec,
      lon: (lonRad * 180) / Math.PI,
    };
  }
}
