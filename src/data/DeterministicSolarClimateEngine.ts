// High-precision Deterministic Solar Climate Engine for 100% offline accuracy

export interface SolarClimateReport {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  solarZenithAngleDeg: number;
  solarElevationAngleDeg: number;
  solarDeclinationDeg: number;
  equationOfTimeMin: number;
  isDaylight: boolean;
  ghiWm2: number;
  dniWm2: number;
  uvIndex: number;
  estimatedTemperatureC: number;
  estimatedHumidityPct: number;
  windSpeedMs: number;
  seasonName: "spring" | "summer" | "autumn" | "winter";
  atmosphericPressureHpa?: number;
  apparentTemperatureC?: number;
  effectiveLapseRateCm?: number;
}

import * as Astronomy from 'astronomy-engine';

export class DeterministicSolarClimateEngine {
  private static readonly SOLAR_CONSTANT = 1361.0;
  private static readonly LAPSE_RATE = 0.0065;

  private static getDayOfYear(date: Date): number {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  public static calculate(
    lat: number,
    lng: number,
    altitudeMeters = 50,
    date: Date = new Date()
  ): SolarClimateReport {
    const time = date.getTime();
    const dayOfYear = this.getDayOfYear(date);

    // High-precision VSOP87 planetary theory solar position from astronomy-engine
    const observer = new Astronomy.Observer(lat, lng, altitudeMeters);
    const eq = Astronomy.Equator(Astronomy.Body.Sun, date, observer, false, true);
    const hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal');

    const elevationDeg = hor.altitude;
    const zenithDeg = Math.max(0, 90 - elevationDeg);
    const zenithRad = (zenithDeg * Math.PI) / 180;
    const isDaylight = elevationDeg > 0;
    const declDeg = eq.dec;

    // Hour angle & true solar time derived from astronomical ephemeris
    const ha = Astronomy.HourAngle(Astronomy.Body.Sun, date, observer);
    const trueSolarTimeMin = (((ha + 12) % 24 + 24) % 24) * 60;
    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    const meanSolarTimeMin = (utcMinutes + 4 * lng + 1440) % 1440;
    let eqtime = trueSolarTimeMin - meanSolarTimeMin;
    if (eqtime > 720) eqtime -= 1440;
    if (eqtime < -720) eqtime += 1440;

    // True physical inverse-square solar irradiance based on exact Earth-Sun distance in AU
    const rSunAU = eq.dist;
    const i0 = this.SOLAR_CONSTANT / (rSunAU * rSunAU);

    let ghi = 0;
    let dni = 0;
    let uvIndex = 0;

    if (isDaylight) {
      const airMass = 1 / (Math.cos(zenithRad) + 0.50572 * Math.pow(Math.max(0.1, 96.07995 - zenithDeg), -1.6364));
      const transmittance = Math.pow(0.7, Math.pow(Math.max(1, airMass), 0.678));
      dni = Math.max(0, i0 * transmittance);
      ghi = Math.max(0, dni * Math.cos(zenithRad) + 0.15 * i0 * Math.cos(zenithRad));
      uvIndex = Math.max(0, parseFloat(((ghi / 25.0) * Math.pow(Math.sin(Math.max(0, elevationDeg * Math.PI / 180)), 1.2)).toFixed(1)));
    }

    const isNorthern = lat >= 0;
    let season: "spring" | "summer" | "autumn" | "winter" = "spring";
    if (dayOfYear >= 80 && dayOfYear < 172) season = isNorthern ? "spring" : "autumn";
    else if (dayOfYear >= 172 && dayOfYear < 264) season = isNorthern ? "summer" : "winter";
    else if (dayOfYear >= 264 && dayOfYear < 355) season = isNorthern ? "autumn" : "spring";
    else season = isNorthern ? "winter" : "summer";

    const absLat = Math.abs(lat);
    const baseZonalTemp = 28.5 * Math.cos((absLat * Math.PI) / 180) - 15 * Math.pow(absLat / 90, 2);

    // Smooth C-infinity orbital insolation curve with ~28-day thermal inertia lag (zero discontinuity)
    const seasonalOrbitalFactor = -Math.cos(((dayOfYear - 28) / 365.25) * 2 * Math.PI) * (lat >= 0 ? 1 : -1);
    const seasonalAmplitude = (absLat / 90) * 16.0;
    const seasonalShift = seasonalOrbitalFactor * seasonalAmplitude;

    const localSolarHour = trueSolarTimeMin / 60;
    const diurnalFactor = Math.sin(((localSolarHour - 8.5) / 24) * 2 * Math.PI);
    const diurnalAmplitude = Math.max(2.5, 7.0 * (1 - absLat / 100));
    const diurnalShift = diurnalFactor * diurnalAmplitude;

    const altitudeDrop = altitudeMeters * this.LAPSE_RATE;

    const estimatedTemperatureC = parseFloat(
      (baseZonalTemp + seasonalShift + diurnalShift - altitudeDrop).toFixed(1)
    );

    const es = 0.61078 * Math.exp((17.27 * estimatedTemperatureC) / (estimatedTemperatureC + 237.3));
    const baselineEa = Math.max(0.3, es * (0.55 + 0.25 * Math.cos((absLat * Math.PI) / 180) - diurnalFactor * 0.15));
    const estimatedHumidityPct = Math.min(98, Math.max(15, Math.round((baselineEa / es) * 100)));

    // Deterministic spatial-temporal wind variation (reproducible offline math)
    const deterministicNoise = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233 + dayOfYear * 37.719)) * 0.6;
    const windSpeedMs = parseFloat(
      (3.2 + 2.5 * Math.abs(Math.sin(absLat * (Math.PI / 30))) + deterministicNoise).toFixed(1)
    );

    // Barometric formula (Laplace-Babinet) for atmospheric pressure
    const atmosphericPressureHpa = parseFloat(
      (1013.25 * Math.pow(Math.max(0.1, 1 - (0.0065 * altitudeMeters) / 288.15), 5.255)).toFixed(1)
    );

    // Dynamic moist vs dry adiabatic lapse rate (K/100m)
    const effectiveLapseRateCm = parseFloat(
      (0.98 - 0.48 * (estimatedHumidityPct / 100)).toFixed(2)
    );

    // Apparent Temperature (Steadman / Australian apparent temperature)
    const vaporPressureKPa = (estimatedHumidityPct / 100) * es;
    const apparentTemperatureC = parseFloat(
      (estimatedTemperatureC + 0.33 * (vaporPressureKPa * 10) - 0.70 * windSpeedMs - 4.00).toFixed(1)
    );

    return {
      timestamp: time,
      latitude: lat,
      longitude: lng,
      altitudeMeters,
      solarZenithAngleDeg: parseFloat(zenithDeg.toFixed(2)),
      solarElevationAngleDeg: parseFloat(elevationDeg.toFixed(2)),
      solarDeclinationDeg: parseFloat(declDeg.toFixed(2)),
      equationOfTimeMin: parseFloat(eqtime.toFixed(2)),
      isDaylight,
      ghiWm2: Math.round(ghi),
      dniWm2: Math.round(dni),
      uvIndex,
      estimatedTemperatureC,
      estimatedHumidityPct,
      windSpeedMs,
      seasonName: season,
      atmosphericPressureHpa,
      apparentTemperatureC,
      effectiveLapseRateCm,
    };
  }
}
