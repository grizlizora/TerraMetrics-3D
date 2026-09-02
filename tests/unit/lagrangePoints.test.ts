import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { LagrangePointsCalculator } from '../../src/space/physics/LagrangePoints.ts';
import { CoordinateTransforms } from '../../src/space/core/CoordinateTransforms.ts';
import { AU } from '../../src/space/core/SpaceConstants.ts';

describe('LagrangePointsCalculator', () => {
  it('computes 5 valid equilibrium points (L1 - L5) without NaN coordinates', () => {
    const astroTime = new Astronomy.AstroTime(new Date('2025-01-01T12:00:00Z'));
    const gstHours = Astronomy.SiderealTime(astroTime);
    const stRad = (gstHours / 24) * Math.PI * 2;
    const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, true)!;

    const points = LagrangePointsCalculator.computeSunEarthPoints(astroTime, stRad, {
      x: sunGeo.x * AU,
      y: sunGeo.y * AU,
      z: sunGeo.z * AU,
    });

    assert.strictEqual(points.length, 5);

    const names = points.map((p) => p.name);
    assert.ok(names.includes('Sun-Earth L1'));
    assert.ok(names.includes('Sun-Earth L2'));
    assert.ok(names.includes('Sun-Earth L3'));
    assert.ok(names.includes('Sun-Earth L4'));
    assert.ok(names.includes('Sun-Earth L5'));

    points.forEach((p) => {
      assert.ok(!Number.isNaN(p.position.x), p.name + ' X is NaN');
      assert.ok(!Number.isNaN(p.position.y), p.name + ' Y is NaN');
      assert.ok(!Number.isNaN(p.position.z), p.name + ' Z is NaN');
      assert.ok(p.distanceKm > 0, p.name + ' distance must be positive');
      assert.ok(p.descriptionUk.length > 0, p.name + ' must have UK description');
      assert.ok(p.descriptionEn.length > 0, p.name + ' must have EN description');
    });
  });

  it('L1 and L2 are located collinear with the Sun vector at appropriate Hill radius scaling', () => {
    const astroTime = new Astronomy.AstroTime(new Date('2025-06-21T12:00:00Z'));
    const stRad = 0;
    const sunGeo = { x: AU, y: 0, z: 0 };
    const sunMapLibre = new THREE.Vector3();
    CoordinateTransforms.j2000EquatorialToMapLibre(sunGeo, stRad, sunMapLibre);

    const points = LagrangePointsCalculator.computeSunEarthPoints(astroTime, stRad, sunGeo);
    const l1 = points.find((p) => p.name === 'Sun-Earth L1')!;
    const l2 = points.find((p) => p.name === 'Sun-Earth L2')!;

    assert.ok(l1.position.dot(sunMapLibre) > 0, 'L1 should point towards the Sun');
    assert.ok(l2.position.dot(sunMapLibre) < 0, 'L2 should point away from the Sun');
    assert.strictEqual(Math.round(l1.position.length()), Math.round(l2.position.length()));
  });
});
