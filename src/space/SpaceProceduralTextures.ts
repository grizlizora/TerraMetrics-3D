import * as THREE from 'three';

export class SpaceProceduralTextures {
  private static sharedDSMaterials: Record<string, THREE.SpriteMaterial> = {};
  private static _cachedTextures: Record<string, THREE.CanvasTexture> = {};

  public static createProceduralTexture(type: string): THREE.CanvasTexture {
    if (this._cachedTextures[type]) return this._cachedTextures[type];
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (!ctx) return new THREE.CanvasTexture(canvas);

    if (type === 'jupiter') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.1) * Math.sin(y * 0.05) + Math.cos(y * 0.2);
        ctx.fillStyle = `rgb(${Math.floor(200 + noise * 55)}, ${Math.floor(170 + noise * 50)}, ${Math.floor(130 + noise * 40)})`;
        ctx.fillRect(0, y, 512, 1);
      }
      ctx.fillStyle = 'rgba(180, 80, 50, 0.8)';
      ctx.beginPath();
      ctx.ellipse(256, 170, 30, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'saturn') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.15) + Math.cos(y * 0.05);
        ctx.fillStyle = `rgb(${Math.floor(230 + noise * 25)}, ${Math.floor(210 + noise * 25)}, ${Math.floor(170 + noise * 25)})`;
        ctx.fillRect(0, y, 512, 1);
      }
    } else if (type === 'mars') {
      ctx.fillStyle = 'rgb(180, 80, 50)';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(100, 40, 20, 0.4)';
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * 512,
          Math.random() * 256,
          20 + Math.random() * 40,
          10 + Math.random() * 20,
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else if (type === 'uranus') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.05);
        ctx.fillStyle = `rgb(${Math.floor(200 + noise * 10)}, ${Math.floor(230 + noise * 10)}, ${Math.floor(240 + noise * 10)})`;
        ctx.fillRect(0, y, 512, 1);
      }
    } else if (type === 'neptune') {
      for (let y = 0; y < 256; y++) {
        const noise = Math.sin(y * 0.2) + Math.cos(y * 0.08);
        ctx.fillStyle = `rgb(${Math.floor(40 + noise * 20)}, ${Math.floor(80 + noise * 30)}, ${Math.floor(200 + noise * 40)})`;
        ctx.fillRect(0, y, 512, 1);
      }
      ctx.fillStyle = 'rgba(20, 40, 150, 0.6)';
      ctx.beginPath();
      ctx.ellipse(150, 140, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'titan') {
      ctx.fillStyle = 'rgb(220, 140, 40)';
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = 'rgba(180, 100, 20, 0.2)';
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 256, 15 + Math.random() * 30, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'pluto') {
      ctx.fillStyle = 'rgb(140, 110, 90)';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(240, 230, 210, 0.8)';
      ctx.beginPath();
      ctx.ellipse(230, 130, 40, 50, -0.3, 0, Math.PI * 2);
      ctx.ellipse(280, 130, 40, 50, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(195, 150);
      ctx.lineTo(315, 150);
      ctx.lineTo(255, 210);
      ctx.fill();
    } else if (type === 'charon') {
      ctx.fillStyle = 'rgb(120, 120, 120)';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = 'rgba(100, 40, 30, 0.8)';
      ctx.fillRect(0, 0, 512, 40);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 256, 5 + Math.random() * 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    this._cachedTextures[type] = tex;
    return tex;
  }

  public static createMoonGlowTexture(): THREE.CanvasTexture {
    if (this._cachedTextures['moonGlow']) return this._cachedTextures['moonGlow'];
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      gradient.addColorStop(0.2, 'rgba(200, 220, 255, 0.04)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cachedTextures['moonGlow'] = tex;
    return tex;
  }

  public static createStarTexture(): THREE.CanvasTexture {
    if (this._cachedTextures['star']) return this._cachedTextures['star'];
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cachedTextures['star'] = tex;
    return tex;
  }

  public static createFlashTexture(): THREE.CanvasTexture {
    if (this._cachedTextures['flash']) return this._cachedTextures['flash'];
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this._cachedTextures['flash'] = tex;
    return tex;
  }

  public static drawLabelCanvas(canvas: HTMLCanvasElement, displayName: string, name: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 512, 128);

    const isGiant = name === 'Sun' || name === 'Moon';
    const textY = isGiant ? 64 : 32;

    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 6-pass dark outline for ultra-crisp contrast on bright or dark celestial backgrounds
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillText(displayName, 256 + 2, textY + 2);
    ctx.fillText(displayName, 256 - 2, textY - 2);
    ctx.fillText(displayName, 256 + 2, textY - 2);
    ctx.fillText(displayName, 256 - 2, textY + 2);
    ctx.fillText(displayName, 256, textY + 3);
    ctx.fillText(displayName, 256, textY - 3);

    // Primary text
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.fillText(displayName, 256, textY);
  }

  public static drawReticleCanvas(canvas: HTMLCanvasElement, colorStr: string, withHalo = true) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width || 128;
    const h = canvas.height || 128;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    if (withHalo) {
      const radius = cx * 0.72; // 72% extent of canvas radius

      // 1. Soft Outer Glow Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = colorStr;
      ctx.shadowBlur = 6;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.restore();

      // 2. Crisp Core Ring (Open center, clean enclosing framing)
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.95;
      ctx.stroke();
    }
  }

  public static getDeepSpaceMaterial(type: string, color: string): THREE.SpriteMaterial {
    const key = `${type}_${color}`;
    if (this.sharedDSMaterials[key]) return this.sharedDSMaterials[key];

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();

      if (type === 'galaxy') {
        ctx.ellipse(64, 64, 60, 20, Math.PI / 4, 0, Math.PI * 2);
      } else if (type === 'nebula' || type === 'cluster') {
        ctx.arc(64, 64, 50, 0, Math.PI * 2);
      } else if (type === 'exoplanet') {
        ctx.arc(64, 64, 25, 0, Math.PI * 2);
      } else if (type === 'star_peculiar') {
        ctx.arc(64, 64, 20, 0, Math.PI * 2);
        ctx.moveTo(64, 10);
        ctx.lineTo(64, 118);
        ctx.moveTo(10, 64);
        ctx.lineTo(118, 64);
        ctx.lineWidth = 4;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sharedDSMaterials[key] = mat;
    return mat;
  }

  public static disposeAll() {
    Object.keys(this.sharedDSMaterials).forEach((key) => {
      const mat = this.sharedDSMaterials[key];
      if (mat) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
    });
    this.sharedDSMaterials = {};

    Object.keys(this._cachedTextures).forEach((key) => {
      const tex = this._cachedTextures[key];
      if (tex) {
        tex.dispose();
      }
    });
    this._cachedTextures = {};
  }
}
