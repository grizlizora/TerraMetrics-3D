// scripts/simulations/harness/MockTouchEngine.ts
/**
 * Synthetic Touch & Direct Manipulation Engine for TerraMetrics-3D Mobile Sheet Simulations
 */

export interface TouchSample {
  y: number;
  time: number;
}

export interface SheetSimConfig {
  fullHeight: number;
  halfHeight: number;
  peekHeight: number;
  viewportHeight: number;
}

export class MockTouchEngine {
  private config: SheetSimConfig;
  private currentY: number;
  private touchHistory: TouchSample[] = [];
  private touchStartY = 0;
  private sheetStartY = 0;

  constructor(config: SheetSimConfig) {
    this.config = config;
    this.currentY = config.viewportHeight - config.peekHeight;
  }

  public setSnapPoint(point: 'full' | 'half' | 'peek') {
    if (point === 'full') this.currentY = 0;
    else if (point === 'half') this.currentY = this.config.viewportHeight - this.config.halfHeight;
    else this.currentY = this.config.viewportHeight - this.config.peekHeight;
  }

  public getCurrentY(): number {
    return this.currentY;
  }

  public touchStart(clientY: number) {
    this.touchStartY = clientY;
    this.sheetStartY = this.currentY;
    this.touchHistory = [{ y: clientY, time: performance.now() }];
  }

  public touchMove(clientY: number, now = performance.now()) {
    const deltaY = clientY - this.touchStartY;
    let newY = this.sheetStartY + deltaY;

    // Apple Rubber-banding above 'full' (y < 0) or below 'peek'
    const maxY = this.config.viewportHeight - this.config.peekHeight;
    if (newY < 0) {
      newY = -Math.pow(-newY, 0.72) * 2;
    } else if (newY > maxY) {
      const overscroll = newY - maxY;
      newY = maxY + Math.pow(overscroll, 0.72) * 2;
    }

    this.currentY = newY;
    this.touchHistory.push({ y: clientY, time: now });
    if (this.touchHistory.length > 5) {
      this.touchHistory.shift();
    }
  }

  public touchEnd(now = performance.now()): {
    snapPoint: 'full' | 'half' | 'peek';
    velocity: number;
    targetY: number;
  } {
    // Calculate velocity (px/ms) from touch move history
    let velocity = 0;
    if (this.touchHistory.length >= 2) {
      const first = this.touchHistory[0];
      const last = this.touchHistory[this.touchHistory.length - 1];
      const dt = last.time - first.time;
      if (dt > 0) {
        velocity = (last.y - first.y) / dt;
      }
    }

    const { viewportHeight, halfHeight, peekHeight } = this.config;
    const fullY = 0;
    const halfY = viewportHeight - halfHeight;
    const peekY = viewportHeight - peekHeight;

    let snapPoint: 'full' | 'half' | 'peek' = 'peek';
    let targetY = peekY;

    // High velocity FLICK (> 0.45 px/ms)
    if (velocity < -0.45) {
      // Swiping UP
      if (this.currentY > halfY) {
        snapPoint = 'half';
        targetY = halfY;
      } else {
        snapPoint = 'full';
        targetY = fullY;
      }
    } else if (velocity > 0.45) {
      // Swiping DOWN
      if (this.currentY < halfY) {
        snapPoint = 'half';
        targetY = halfY;
      } else {
        snapPoint = 'peek';
        targetY = peekY;
      }
    } else {
      // Proximity-based snapping
      const distFull = Math.abs(this.currentY - fullY);
      const distHalf = Math.abs(this.currentY - halfY);
      const distPeek = Math.abs(this.currentY - peekY);

      if (distFull <= distHalf && distFull <= distPeek) {
        snapPoint = 'full';
        targetY = fullY;
      } else if (distHalf <= distFull && distHalf <= distPeek) {
        snapPoint = 'half';
        targetY = halfY;
      } else {
        snapPoint = 'peek';
        targetY = peekY;
      }
    }

    this.currentY = targetY;
    return { snapPoint, velocity, targetY };
  }
}
