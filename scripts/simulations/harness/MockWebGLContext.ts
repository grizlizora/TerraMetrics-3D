import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');
const publicDir = path.join(projectRoot, 'public');

export interface WebGLMockMetrics {
  drawCalls: number;
  buffersCreated: number;
  buffersDeleted: number;
  texturesCreated: number;
  texturesDeleted: number;
  programsCreated: number;
  activeTextures: number;
}

export function setupHeadlessBrowserEnvironment(): {
  cleanup: () => void;
  metrics: WebGLMockMetrics;
} {
  const metrics: WebGLMockMetrics = {
    drawCalls: 0,
    buffersCreated: 0,
    buffersDeleted: 0,
    texturesCreated: 0,
    texturesDeleted: 0,
    programsCreated: 0,
    activeTextures: 0,
  };

  const originalWindow = (globalThis as any).window;
  const originalDocument = (globalThis as any).document;
  const originalNavigator = (globalThis as any).navigator;

  // Mock Canvas 2D Context
  class MockCanvasRenderingContext2D {
    public canvas: any;
    public fillStyle: any = '#000000';
    public strokeStyle: any = '#000000';
    public lineWidth: number = 1;
    public font: string = '12px sans-serif';
    public textAlign: string = 'start';
    public textBaseline: string = 'alphabetic';

    constructor(canvas: any) {
      this.canvas = canvas;
    }

    clearRect() {}
    fillRect() {}
    strokeRect() {}
    beginPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    arc() {}
    ellipse() {}
    fill() {}
    stroke() {}
    fillText() {}
    strokeText() {}
    measureText(text: string) {
      return { width: text.length * 8, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2 };
    }
    createRadialGradient() {
      return {
        addColorStop: () => {},
      };
    }
    createLinearGradient() {
      return {
        addColorStop: () => {},
      };
    }
    drawImage() {}
    save() {}
    restore() {}
    setTransform() {}
    resetTransform() {}
    scale() {}
    rotate() {}
    translate() {}
  }

  // Mock WebGL2 Rendering Context
  class MockWebGL2RenderingContext {
    public canvas: any;
    public drawingBufferWidth = 1920;
    public drawingBufferHeight = 1080;

    // Constants
    public ARRAY_BUFFER = 0x8892;
    public ELEMENT_ARRAY_BUFFER = 0x8893;
    public TEXTURE0 = 0x84c0;
    public TEXTURE_2D = 0x0de1;
    public RGBA = 0x1908;
    public UNSIGNED_BYTE = 0x1401;
    public FLOAT = 0x1406;
    public TRIANGLES = 0x0004;
    public LINES = 0x0001;
    public POINTS = 0x0000;
    public COLOR_BUFFER_BIT = 0x4000;
    public DEPTH_BUFFER_BIT = 0x0100;
    public STENCIL_BUFFER_BIT = 0x0400;

    constructor(canvas: any) {
      this.canvas = canvas;
    }

    getExtension(name: string) {
      if (name === 'EXT_color_buffer_float' || name === 'OES_texture_float') {
        return {};
      }
      return null;
    }

    getParameter(pname: number) {
      if (pname === 0x8869) return 16; // MAX_VERTEX_ATTRIBS
      if (pname === 0x8b4c) return 16; // MAX_TEXTURE_IMAGE_UNITS
      if (pname === 0x84e8) return 16384; // MAX_TEXTURE_SIZE
      return 0;
    }

    createBuffer() {
      metrics.buffersCreated++;
      return { id: metrics.buffersCreated };
    }
    deleteBuffer() {
      metrics.buffersDeleted++;
    }
    bindBuffer() {}
    bufferData() {}
    bufferSubData() {}

    createTexture() {
      metrics.texturesCreated++;
      metrics.activeTextures++;
      return { id: metrics.texturesCreated };
    }
    deleteTexture() {
      metrics.texturesDeleted++;
      metrics.activeTextures = Math.max(0, metrics.activeTextures - 1);
    }
    bindTexture() {}
    activeTexture() {}
    texImage2D() {}
    texSubImage2D() {}
    texParameteri() {}
    generateMipmap() {}

    createProgram() {
      metrics.programsCreated++;
      return { id: metrics.programsCreated };
    }
    deleteProgram() {}
    useProgram() {}
    linkProgram() {}
    getProgramParameter() { return true; }
    getProgramInfoLog() { return ''; }

    createShader() { return { id: Math.random() }; }
    deleteShader() {}
    shaderSource() {}
    compileShader() {}
    getShaderParameter() { return true; }
    getShaderInfoLog() { return ''; }
    attachShader() {}
    detachShader() {}

    createVertexArray() { return { id: Math.random() }; }
    deleteVertexArray() {}
    bindVertexArray() {}

    enable() {}
    disable() {}
    depthFunc() {}
    depthMask() {}
    blendFunc() {}
    blendFuncSeparate() {}
    blendEquation() {}
    blendEquationSeparate() {}
    cullFace() {}
    frontFace() {}
    colorMask() {}
    clearColor() {}
    clearDepth() {}
    clear() {}
    viewport() {}
    scissor() {}

    drawArrays() {
      metrics.drawCalls++;
    }
    drawElements() {
      metrics.drawCalls++;
    }
    drawArraysInstanced() {
      metrics.drawCalls++;
    }
    drawElementsInstanced() {
      metrics.drawCalls++;
    }

    getUniformLocation() { return {}; }
    getAttribLocation() { return 0; }
    uniform1i() {}
    uniform1f() {}
    uniform2f() {}
    uniform3f() {}
    uniform4f() {}
    uniform1fv() {}
    uniform3fv() {}
    uniform4fv() {}
    uniformMatrix3fv() {}
    uniformMatrix4fv() {}
    enableVertexAttribArray() {}
    disableVertexAttribArray() {}
    vertexAttribPointer() {}
  }

  // Mock HTMLCanvasElement
  class MockHTMLCanvasElement {
    public width = 1920;
    public height = 1080;
    public style: any = {};
    private _ctx2d: any = null;
    private _gl: any = null;

    getContext(type: string) {
      if (type === '2d') {
        if (!this._ctx2d) this._ctx2d = new MockCanvasRenderingContext2D(this);
        return this._ctx2d;
      }
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        if (!this._gl) this._gl = new MockWebGL2RenderingContext(this);
        return this._gl;
      }
      return null;
    }

    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
    getBoundingClientRect() {
      return { top: 0, left: 0, width: this.width, height: this.height, x: 0, y: 0 };
    }
  }

  // Polyfill global environment
  const mockWindow: any = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    location: {
      href: 'http://localhost/',
      origin: 'http://localhost',
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb: Function) => setTimeout(() => cb(performance.now()), 16),
    cancelAnimationFrame: (id: any) => clearTimeout(id),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };

  const originalFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    if (urlStr.startsWith('/') || urlStr.startsWith('http://localhost') || !urlStr.startsWith('http')) {
      const cleanFileName = urlStr.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\//, '').split('?')[0];
      const localFilePath = path.join(publicDir, cleanFileName);
      if (fs.existsSync(localFilePath)) {
        const content = fs.readFileSync(localFilePath);
        return new Response(content, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return originalFetch ? originalFetch(url, init) : new Response('{}', { status: 200 });
  };

  class MockImageElement {
    public width = 512;
    public height = 512;
    public style: any = {};
    private _src = '';
    public onload: any = null;
    public onerror: any = null;

    set src(val: string) {
      this._src = val;
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
    get src() {
      return this._src;
    }

    addEventListener(type: string, listener: any) {
      if (type === 'load') {
        setTimeout(listener, 0);
      }
    }
    removeEventListener() {}
  }

  const mockDocument: any = {
    createElement: (tag: string) => {
      if (tag === 'canvas') return new MockHTMLCanvasElement();
      if (tag === 'img') return new MockImageElement();
      return {
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      };
    },
    createElementNS: (ns: string, tag: string) => {
      return mockDocument.createElement(tag);
    },
    getElementById: () => null,
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  (globalThis as any).Image = MockImageElement;

  (globalThis as any).window = mockWindow;
  (globalThis as any).document = mockDocument;
  (globalThis as any).HTMLCanvasElement = MockHTMLCanvasElement;
  try {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        userAgent: 'TerraMetrics-Simulator/1.0',
        language: 'uk',
        onLine: true,
      },
      configurable: true,
      writable: true,
    });
  } catch {
    // fallback if navigator is not configurable
  }

  return {
    metrics,
    cleanup: () => {
      (globalThis as any).window = originalWindow;
      (globalThis as any).document = originalDocument;
    },
  };
}
