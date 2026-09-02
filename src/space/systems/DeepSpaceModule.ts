import * as THREE from 'three';
import { CONSTELLATIONS, DEEP_SPACE_OBJECTS } from '../DeepSpaceData.ts';
import { SpaceProceduralTextures } from '../SpaceProceduralTextures.ts';
import { CELESTIAL_SPHERE_RADIUS, BODY_NAMES } from '../core/SpaceConstants.ts';
import { ProceduralNebulaShader } from '../SpaceShaders.ts';
import type { MarkerRegistrationCallback } from '../SpaceTypes.ts';
import type { EphemerisEngine } from '../physics/EphemerisEngine.ts';

export class DeepSpaceModule {
  public group: THREE.Group;
  private registeredBodyKeys: string[] = [];
  private nebulaMaterials: THREE.ShaderMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  public create(
    registerMarker: MarkerRegistrationCallback,
    ephemeris: EphemerisEngine
  ) {
    const radius = CELESTIAL_SPHERE_RADIUS;
    const _scratchVec = new THREE.Vector3();

    // 1. Constellations
    CONSTELLATIONS.forEach((constellation) => {
      const starPositions: THREE.Vector3[] = [];
      const linePositions: number[] = [];

      constellation.stars.forEach((star, sIdx) => {
        const pos = new THREE.Vector3();
        ephemeris.setVectorFromRaDec(pos, star.ra, star.dec, radius);
        starPositions.push(pos);

        // Register each star of the constellation as an individual celestial marker
        const starDummy = new THREE.Object3D();
        starDummy.position.copy(pos);
        this.group.add(starDummy);

        const starKey = `STAR_${constellation.id}_${sIdx}`;
        BODY_NAMES[starKey] = {
          uk: star.name.uk,
          en: star.name.en,
        };
        this.registeredBodyKeys.push(starKey);
        registerMarker(starDummy, starKey, star.color || constellation.color || '#aaccff', 0.80, 'deep');
      });

      // Register one central title marker for the constellation
      if (starPositions.length > 0) {
        const centerPos = new THREE.Vector3();
        starPositions.forEach((p) => centerPos.add(p));
        centerPos.divideScalar(starPositions.length);

        const dummy = new THREE.Object3D();
        dummy.position.copy(centerPos);
        this.group.add(dummy);

        const constId = `CONST_${constellation.id}`;
        BODY_NAMES[constId] = {
          uk: constellation.name.uk,
          en: constellation.name.en,
        };
        this.registeredBodyKeys.push(constId);
        registerMarker(dummy, constId, constellation.color || '#4488ff', 0.85, 'deep');
      }

      constellation.lines.forEach((pair) => {
        const p1 = starPositions[pair[0]];
        const p2 = starPositions[pair[1]];
        if (p1 && p2) {
          linePositions.push(p1.x, p1.y, p1.z);
          linePositions.push(p2.x, p2.y, p2.z);
        }
      });

      if (linePositions.length > 0) {
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(linePositions, 3)
        );

        const lineMat = new THREE.LineBasicMaterial({
          color: constellation.color || 0x4488ff,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const lines = new THREE.LineSegments(lineGeom, lineMat);
        lines.renderOrder = -50;
        lines.frustumCulled = false;
        this.group.add(lines);

        // Constellation Vertex Star Nodes (Illuminated circular points on every vertex)
        const nodePositions: number[] = [];
        starPositions.forEach((sp) => nodePositions.push(sp.x, sp.y, sp.z));
        const nodeGeom = new THREE.BufferGeometry();
        nodeGeom.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
        const nodeMat = new THREE.PointsMaterial({
          map: SpaceProceduralTextures.createStarTexture(),
          color: new THREE.Color(constellation.color || '#aaccff'),
          size: 7.0,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const nodePoints = new THREE.Points(nodeGeom, nodeMat);
        nodePoints.renderOrder = -49;
        nodePoints.frustumCulled = false;
        this.group.add(nodePoints);
      }
    });

    // 2. Deep Space Objects (DSO)
    DEEP_SPACE_OBJECTS.forEach((dso) => {
      const dummy = new THREE.Object3D();
      ephemeris.setVectorFromRaDec(_scratchVec, dso.ra, dso.dec, radius);
      dummy.position.copy(_scratchVec);

      if (dso.type === 'blackhole') {
        const diskRadius = radius * 0.008 * ((dso.size || 3.0) / 3.0);
        const bhGeom = new THREE.CircleGeometry(diskRadius * 0.35, 32);
        const bhMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          depthWrite: false,
        });
        const bhMesh = new THREE.Mesh(bhGeom, bhMat);
        bhMesh.lookAt(0, 0, 0);
        dummy.add(bhMesh);

        const diskGeom = new THREE.RingGeometry(diskRadius * 0.38, diskRadius, 32);
        const diskMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(dso.haloColor || '#ffaa44'),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const diskMesh = new THREE.Mesh(diskGeom, diskMat);
        diskMesh.rotation.x = Math.PI / 3;
        dummy.add(diskMesh);
      } else if (dso.type === 'nebula') {
        const nebulaGeom = new THREE.PlaneGeometry(1, 1);
        const nebulaMat = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0.0 },
            coreColor: { value: new THREE.Color(dso.color || '#aaccff') },
            midColor: { value: new THREE.Color(dso.haloColor || '#aa44ff') },
            haloColor: { value: new THREE.Color(0x1a0533) },
            density: { value: 1.1 },
            opacity: { value: 0.85 },
          },
          vertexShader: ProceduralNebulaShader.vertexShader,
          fragmentShader: ProceduralNebulaShader.fragmentShader,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const nebulaMesh = new THREE.Mesh(nebulaGeom, nebulaMat);
        const r = radius * 0.02 * ((dso.size || 3.0) / 3.0);
        const scaleMult = 2.4;
        nebulaMesh.scale.set(r * scaleMult, r * scaleMult, 1);
        nebulaMesh.lookAt(0, 0, 0);
        dummy.add(nebulaMesh);
        this.nebulaMaterials.push(nebulaMat);
      } else {
        const mat = SpaceProceduralTextures.getDeepSpaceMaterial(
          dso.type,
          dso.haloColor || dso.color
        );
        const sprite = new THREE.Sprite(mat);
        const r = radius * 0.02 * ((dso.size || 3.0) / 3.0);
        const scaleMult = dso.type === 'galaxy' ? 2.5 : 1.2;
        sprite.scale.set(r * scaleMult, r * scaleMult, 1);
        dummy.add(sprite);
      }

      dummy.userData = {
        isDeepSpace: true,
        nameObj: dso.name,
        type: dso.type,
      };

      const id = `DS_${dso.id}`;
      BODY_NAMES[id] = dso.name;
      this.registeredBodyKeys.push(id);
      this.group.add(dummy);
      registerMarker(dummy, id, dso.haloColor || dso.color, 0.75, 'deep');
    });
  }

  public setSiderealRotation(stRad: number) {
    this.group.rotation.y = stRad;
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
  }

  public update(time: number): void {
    const tSec = time * 0.001;
    for (let i = 0; i < this.nebulaMaterials.length; i++) {
      this.nebulaMaterials[i].uniforms.time.value = tSec;
    }
  }

  public dispose() {
    for (let i = 0; i < this.nebulaMaterials.length; i++) {
      this.nebulaMaterials[i].dispose();
    }
    this.nebulaMaterials = [];

    this.group.traverse((child) => {
      const mesh = child as any;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material && !(mesh instanceof THREE.Sprite)) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (mesh.material.map) mesh.material.map.dispose();
          mesh.material.dispose();
        }
      }
    });

    this.registeredBodyKeys.forEach((key) => {
      delete BODY_NAMES[key];
    });
    this.registeredBodyKeys = [];
    this.group.clear();
  }
}
