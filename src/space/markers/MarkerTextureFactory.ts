import * as THREE from 'three';
import { SpaceProceduralTextures } from '../SpaceProceduralTextures.ts';
import type { ReticleCacheItem } from '../SpaceTypes.ts';

export class MarkerTextureFactory {
  public static createLabelSprite(displayName: string, name: string): {
    sprite: THREE.Sprite;
    canvas: HTMLCanvasElement;
  } {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    SpaceProceduralTextures.drawLabelCanvas(canvas, displayName, name);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.0,
      rotation: 0,
    });

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 9999;
    sprite.visible = false;

    return { sprite, canvas };
  }

  public static updateLabelCanvas(
    canvas: HTMLCanvasElement,
    displayName: string,
    name: string,
    texture: THREE.Texture
  ): void {
    SpaceProceduralTextures.drawLabelCanvas(canvas, displayName, name);
    texture.needsUpdate = true;
  }

  public static getOrCreateReticleSprite(
    colorStr: string,
    sharedReticles: Record<string, ReticleCacheItem>
  ): THREE.Sprite {
    let cached = sharedReticles[colorStr];
    if (!cached) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      SpaceProceduralTextures.drawReticleCanvas(canvas, colorStr, true);

      const tex = new THREE.CanvasTexture(canvas);
      cached = { canvas, tex };
      sharedReticles[colorStr] = cached;
    }

    const material = new THREE.SpriteMaterial({
      map: cached.tex,
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.0,
    });

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 9998;
    sprite.visible = false;
    sprite.position.set(0, 0, 0);

    return sprite;
  }

  public static disposeLabel(sprite: THREE.Sprite, canvas: HTMLCanvasElement): void {
    sprite.removeFromParent();
    if (sprite.material.map) {
      sprite.material.map.dispose();
    }
    sprite.material.dispose();

    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  public static disposeReticleSprite(sprite: THREE.Sprite): void {
    sprite.removeFromParent();
    // Material is individual, texture is shared
    sprite.material.dispose();
  }

  public static disposeSharedReticles(sharedReticles: Record<string, ReticleCacheItem>): void {
    Object.keys(sharedReticles).forEach((k) => {
      const item = sharedReticles[k];
      if (item) {
        if (item.tex) {
          item.tex.dispose();
        }
        if (item.canvas) {
          item.canvas.width = 0;
          item.canvas.height = 0;
        }
      }
    });
  }
}
