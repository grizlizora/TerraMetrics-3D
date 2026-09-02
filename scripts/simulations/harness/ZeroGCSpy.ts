// scripts/simulations/harness/ZeroGCSpy.ts
import * as THREE from 'three';

export interface AllocationStats {
  threeClones: number;
  heapDeltaKb: number;
  totalAllocations: number;
}

export class ZeroGCSpy {
  private isTracking = false;
  private clonesCount = 0;
  private initialHeap = 0;

  private origVector3Clone = THREE.Vector3.prototype.clone;
  private origColorClone = THREE.Color.prototype.clone;

  public start() {
    this.clonesCount = 0;
    this.initialHeap = process.memoryUsage().heapUsed;
    this.isTracking = true;
    const self = this;

    THREE.Vector3.prototype.clone = function () {
      if (self.isTracking) self.clonesCount++;
      return self.origVector3Clone.call(this);
    };

    THREE.Color.prototype.clone = function () {
      if (self.isTracking) self.clonesCount++;
      return self.origColorClone.call(this);
    };
  }

  public stop(): AllocationStats {
    this.isTracking = false;
    THREE.Vector3.prototype.clone = this.origVector3Clone;
    THREE.Color.prototype.clone = this.origColorClone;

    const finalHeap = process.memoryUsage().heapUsed;
    const heapDeltaKb = (finalHeap - this.initialHeap) / 1024;

    return {
      threeClones: this.clonesCount,
      heapDeltaKb,
      totalAllocations: this.clonesCount,
    };
  }
}
