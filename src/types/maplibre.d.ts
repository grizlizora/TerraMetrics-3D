import 'maplibre-gl';

declare module 'maplibre-gl' {
  interface MapProjectionInfo {
    type: 'globe' | 'mercator' | string;
  }

  interface MapPainterContext {
    setDirty?: () => void;
    currentProgram?: WebGLProgram | null;
    currentVAO?: WebGLVertexArrayObject | null;
    activeTexture?: number;
    boundBuffers?: Record<string, WebGLBuffer | null>;
  }

  interface MapPainter {
    context?: MapPainterContext;
  }

  interface MapTransform {
    fov?: number;
    setConstrainOverride?: (fn: ((...args: any[]) => any) | null) => void;
    [key: string]: unknown;
  }

  interface Map {
    getProjection?: () => MapProjectionInfo | undefined;
    getPadding?: () => { left: number; right: number; top: number; bottom: number };
    transform?: MapTransform;
    painter?: MapPainter;
  }
}
