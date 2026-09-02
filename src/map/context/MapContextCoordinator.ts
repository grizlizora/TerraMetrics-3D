import type { ContextRecoveryDelegate } from './types';

export type { ContextRecoveryDelegate };

export class MapContextCoordinator {
  private canvas: HTMLCanvasElement | null = null;
  private lostHandler: ((e: Event) => void) | null = null;
  private restoredHandler: (() => void) | null = null;
  private isLost = false;

  public attach(canvas: HTMLCanvasElement, delegate: ContextRecoveryDelegate): void {
    this.detach();
    this.canvas = canvas;

    this.lostHandler = (e: Event) => {
      e.preventDefault();
      this.isLost = true;
      console.warn('[MapContextCoordinator] WebGL Context Lost.');
    };

    this.restoredHandler = () => {
      this.isLost = false;
      console.info('[MapContextCoordinator] WebGL Context Restored. Orchestrating subsystem recovery.');
      delegate.onRestoreStyleAndLayers();
      delegate.onRestoreSpaceBridge?.();
      delegate.onRefreshTheme?.();
    };

    canvas.addEventListener('webglcontextlost', this.lostHandler, false);
    canvas.addEventListener('webglcontextrestored', this.restoredHandler, false);
  }

  public detach(): void {
    if (this.canvas) {
      if (this.lostHandler) {
        this.canvas.removeEventListener('webglcontextlost', this.lostHandler);
        this.lostHandler = null;
      }
      if (this.restoredHandler) {
        this.canvas.removeEventListener('webglcontextrestored', this.restoredHandler);
        this.restoredHandler = null;
      }
      this.canvas = null;
    }
  }

  public get isContextLost(): boolean {
    return this.isLost;
  }
}
