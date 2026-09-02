import * as THREE from 'three';
import { StarfieldShader } from '../SpaceShaders.ts';
import { CELESTIAL_SPHERE_RADIUS } from '../core/SpaceConstants.ts';
import { CONSTELLATIONS } from '../DeepSpaceData.ts';
import type { MarkerRegistrationCallback } from '../SpaceTypes.ts';
import type { EphemerisEngine } from '../physics/EphemerisEngine.ts';

interface SupernovaFlash {
  mesh: THREE.Mesh;
  halo: THREE.Sprite;
  startTime: number;
  duration: number;
  peakRadius: number;
}

export class StarfieldSystem {
  public group: THREE.Group;
  public starMaterial: THREE.ShaderMaterial | null = null;
  public starPoints: THREE.Points | null = null;
  public supernovaCandidates: { name: string; pos: THREE.Vector3; color: THREE.Color }[] = [];
  public flashes: SupernovaFlash[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  public create(
    registerMarker: MarkerRegistrationCallback,
    ephemeris: EphemerisEngine
  ) {
    const starCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);

    const radius = CELESTIAL_SPHERE_RADIUS;
    const colorChoices = [
      new THREE.Color('#9bb0ff'), // O-type (35,000K Blue)
      new THREE.Color('#bbccff'), // B-type (20,000K Blue-white)
      new THREE.Color('#f8f9ff'), // A-type (9,000K White)
      new THREE.Color('#ffffed'), // F-type (7,000K Yellow-white)
      new THREE.Color('#fff4e8'), // G-type (5,700K Solar Yellow)
      new THREE.Color('#ffd2a1'), // K-type (4,500K Amber Orange)
      new THREE.Color('#ff7b7b'), // M-type (3,000K Red)
    ];

    const _scratchVec = new THREE.Vector3();
    let starIdx = 0;

    // 1. Seed all authentic Constellation Stars directly into the star point cloud
    CONSTELLATIONS.forEach((constellation) => {
      constellation.stars.forEach((star) => {
        if (starIdx < starCount) {
          ephemeris.setVectorFromRaDec(_scratchVec, star.ra, star.dec, radius);
          positions[starIdx * 3] = _scratchVec.x;
          positions[starIdx * 3 + 1] = _scratchVec.y;
          positions[starIdx * 3 + 2] = _scratchVec.z;

          const col = new THREE.Color(star.color || constellation.color || '#bbddff');
          colors[starIdx * 3] = col.r;
          colors[starIdx * 3 + 1] = col.g;
          colors[starIdx * 3 + 2] = col.b;

          const mag = star.mag !== undefined ? star.mag : 2.0;
          sizes[starIdx] = Math.min(10.0, Math.max(3.8, 4.5 + (2.5 - mag) * 1.8));
          phases[starIdx] = Math.random() * Math.PI * 2;
          starIdx++;
        }
      });
    });

    // 2. Navigation Stars & Supernova Candidates (Standalone stars outside standard constellations)
    const namedStars = [
      { name: 'Sirius', ra: 6.7525, dec: -16.7161, mag: -1.46, color: '#ffffff' },
      { name: 'Canopus', ra: 6.3992, dec: -52.6957, mag: -0.74, color: '#f0f8ff' },
      { name: 'Vega', ra: 18.6156, dec: 38.7836, mag: 0.03, color: '#bbd5ff' },
      { name: 'Altair', ra: 19.8464, dec: 8.8683, mag: 0.77, color: '#f5f8ff' },
      { name: 'Arcturus', ra: 14.2610, dec: 19.1824, mag: -0.05, color: '#ffaa55' },
      { name: 'Polaris', ra: 2.5303, dec: 89.2641, mag: 1.98, color: '#ffeecc' },
      { name: 'Antares', ra: 16.4901, dec: -26.4320, mag: 1.06, color: '#ff4422' },
      { name: 'Spica', ra: 13.4199, dec: -11.1613, mag: 0.98, color: '#99ccff' },
      { name: 'Aldebaran', ra: 4.5987, dec: 16.5093, mag: 0.85, color: '#ff8844' },
      { name: 'Capella', ra: 5.2822, dec: 45.9980, mag: 0.08, color: '#fff4cc' },
      { name: 'Pollux', ra: 7.7553, dec: 28.0262, mag: 1.14, color: '#ffaa66' },
      { name: 'Fomalhaut', ra: 22.9608, dec: -29.6222, mag: 1.17, color: '#eef4ff' },
    ];

    namedStars.forEach((star) => {
      const dummy = new THREE.Object3D();
      ephemeris.setVectorFromRaDec(_scratchVec, star.ra, star.dec, radius);
      dummy.position.copy(_scratchVec);
      this.group.add(dummy);

      this.supernovaCandidates.push({
        name: star.name,
        pos: dummy.position.clone(),
        color: new THREE.Color(star.color),
      });

      registerMarker(dummy, star.name, star.color, 0.85, 'deep');

      // Also register into point cloud if not already covered
      if (starIdx < starCount) {
        positions[starIdx * 3] = _scratchVec.x;
        positions[starIdx * 3 + 1] = _scratchVec.y;
        positions[starIdx * 3 + 2] = _scratchVec.z;

        const col = new THREE.Color(star.color);
        colors[starIdx * 3] = col.r;
        colors[starIdx * 3 + 1] = col.g;
        colors[starIdx * 3 + 2] = col.b;

        sizes[starIdx] = Math.min(11.0, Math.max(4.0, 5.0 + (2.5 - star.mag) * 1.9));
        phases[starIdx] = Math.random() * Math.PI * 2;
        starIdx++;
      }
    });

    // 3. Fill remaining positions with rich Milky Way procedural background stars
    for (; starIdx < starCount; starIdx++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      const isBand = Math.random() < 0.65;
      const bandSpread = isBand ? (Math.random() - 0.5) * 0.28 : (Math.random() - 0.5) * Math.PI;
      const effectivePhi = isBand ? Math.PI / 2 + bandSpread : phi;

      const x = radius * Math.sin(effectivePhi) * Math.cos(theta);
      const y = radius * Math.sin(effectivePhi) * Math.sin(theta);
      const z = radius * Math.cos(effectivePhi);

      // (-y, z, x) maplibre unrotated spherical basis
      positions[starIdx * 3] = -y;
      positions[starIdx * 3 + 1] = z;
      positions[starIdx * 3 + 2] = x;

      const col = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[starIdx * 3] = col.r;
      colors[starIdx * 3 + 1] = col.g;
      colors[starIdx * 3 + 2] = col.b;

      sizes[starIdx] = 2.0 + Math.random() * 3.2;
      phases[starIdx] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        atmosphere: { value: 1.0 },
      },
      vertexShader: StarfieldShader.vertexShader,
      fragmentShader: StarfieldShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.starPoints = new THREE.Points(geometry, this.starMaterial);
    this.starPoints.renderOrder = -100;
    this.starPoints.frustumCulled = false;
    this.group.add(this.starPoints);
  }

  public setSiderealRotation(stRad: number) {
    this.group.rotation.y = stRad;
  }

  public update(now: number, isDeepMode: boolean) {
    if (this.starMaterial) {
      this.starMaterial.uniforms.time.value = now * 0.001;
    }

    // Supernova animations
    if (this.flashes.length > 0) {
      for (let i = this.flashes.length - 1; i >= 0; i--) {
        const flash = this.flashes[i];
        const elapsed = (now - flash.startTime) / 1000;
        const progress = elapsed / flash.duration;

        if (progress >= 1.0 || !isDeepMode) {
          this.group.remove(flash.mesh);
          this.group.remove(flash.halo);
          flash.mesh.geometry.dispose();
          (flash.mesh.material as THREE.Material).dispose();
          (flash.halo.material as THREE.SpriteMaterial).map?.dispose();
          flash.halo.material.dispose();
          this.flashes.splice(i, 1);
          continue;
        }

        const scale = (0.05 + Math.sin(progress * Math.PI) * 0.95) * flash.peakRadius;
        flash.mesh.scale.set(scale, scale, scale);
        flash.halo.scale.set(scale * 2.5, scale * 2.5, 1);

        const opacity = Math.max(0, 1.0 - progress);
        (flash.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
        (flash.halo.material as THREE.SpriteMaterial).opacity = opacity * 0.8;
      }
    }

    // Rare natural cosmic supernova in deep space mode
    if (isDeepMode && this.flashes.length === 0 && now - this.lastAutoSupernova > 75000) {
      this.lastAutoSupernova = now;
      this.triggerSupernova();
    }
  }

  private lastAutoSupernova = 0;

  public triggerSupernova(candidateName?: string) {
    const candidate = candidateName
      ? this.supernovaCandidates.find((c) => c.name.toLowerCase() === candidateName.toLowerCase())
      : this.supernovaCandidates[Math.floor(Math.random() * this.supernovaCandidates.length)];

    if (!candidate) return;

    const geom = new THREE.SphereGeometry(1, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: candidate.color,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(candidate.pos);

    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const ctx = haloCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, candidate.color.getStyle());
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.position.copy(candidate.pos);

    this.group.add(mesh);
    this.group.add(halo);

    this.flashes.push({
      mesh,
      halo,
      startTime: performance.now(),
      duration: 3.5,
      peakRadius: 450000,
    });
  }

  public clearFlashes() {
    this.flashes.forEach((flash) => {
      this.group.remove(flash.mesh);
      this.group.remove(flash.halo);
      flash.mesh.geometry.dispose();
      (flash.mesh.material as THREE.Material).dispose();
      const map = (flash.halo.material as THREE.SpriteMaterial).map;
      if (map) {
        const img = map.image as any;
        if (img && typeof img.width === 'number') {
          img.width = 0;
          img.height = 0;
        }
        map.dispose();
      }
      flash.halo.material.dispose();
    });
    this.flashes = [];
  }

  public setVisible(visible: boolean) {
    this.group.visible = visible;
    if (!visible) {
      this.clearFlashes();
    }
  }

  public dispose() {
    this.clearFlashes();

    if (this.starPoints) {
      this.group.remove(this.starPoints);
      this.starPoints.geometry.dispose();
      this.starPoints = null;
    }

    if (this.starMaterial) {
      this.starMaterial.dispose();
      this.starMaterial = null;
    }

    this.group.clear();
    this.supernovaCandidates = [];
  }
}
