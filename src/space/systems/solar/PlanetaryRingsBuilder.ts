import * as THREE from 'three';

export class PlanetaryRingsBuilder {
  public static createRings(mesh: THREE.Mesh, name: string, radius: number): THREE.Mesh {
    const isSaturn = name === 'Saturn';
    const innerR = radius * (isSaturn ? 1.25 : 1.4);
    const outerR = radius * (isSaturn ? 2.35 : 1.8);

    const ringGeom = new THREE.RingGeometry(innerR, outerR, 64);
    const pos = ringGeom.attributes.position;
    const uvs = ringGeom.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const d = Math.sqrt(x * x + y * y);
      const u = (d - innerR) / (outerR - innerR);
      uvs.setXY(i, u, 0.5);
    }

    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 1;
    const ctx = ringCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      if (isSaturn) {
        grad.addColorStop(0.0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.1, 'rgba(210,180,140,0.85)');
        grad.addColorStop(0.5, 'rgba(180,150,110,0.9)');
        grad.addColorStop(0.65, 'rgba(0,0,0,0.1)');
        grad.addColorStop(0.75, 'rgba(200,170,130,0.75)');
        grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      } else {
        grad.addColorStop(0.0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.3, 'rgba(125,226,209,0.4)');
        grad.addColorStop(0.8, 'rgba(125,226,209,0.6)');
        grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1);
    }

    const ringTex = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    mesh.add(ringMesh);
    return ringMesh;
  }
}
