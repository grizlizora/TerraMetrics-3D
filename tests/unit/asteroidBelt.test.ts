import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { AsteroidBeltSystem } from '../../src/space/systems/solar/AsteroidBeltSystem.ts';

describe('AsteroidBeltSystem', () => {
  it('creates instanced mesh and updates transform matrices without error', () => {
    const parentGroup = new THREE.Group();
    const belt = new AsteroidBeltSystem();
    belt.init(parentGroup);

    assert.ok(belt.instancedMesh !== null, 'InstancedMesh must be initialized');
    assert.strictEqual(belt.instancedMesh.count, 350, 'Must have 350 asteroid instances');
    assert.strictEqual(parentGroup.children.length, 1, 'Parent group must contain belt group');

    const sunPos = new THREE.Vector3(1000, 2000, 3000);
    belt.update(100.5, sunPos);

    const mat = new THREE.Matrix4();
    belt.instancedMesh.getMatrixAt(0, mat);
    const pos = new THREE.Vector3();
    pos.setFromMatrixPosition(mat);
    assert.ok(!Number.isNaN(pos.x), 'Matrix pos.x must not be NaN');
    assert.ok(!Number.isNaN(pos.y), 'Matrix pos.y must not be NaN');
    assert.ok(!Number.isNaN(pos.z), 'Matrix pos.z must not be NaN');

    belt.setVisible(false);
    assert.strictEqual(belt.group.visible, false);

    belt.clear();
    assert.strictEqual(belt.instancedMesh, null, 'InstancedMesh should be cleared on dispose');
  });
});
