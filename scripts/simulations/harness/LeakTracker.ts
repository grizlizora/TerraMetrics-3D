// scripts/simulations/harness/LeakTracker.ts
export interface LeakReport {
  activeEventListeners: { target: string; type: string; count: number }[];
  activeTimers: { type: 'timeout' | 'interval' | 'raf'; id: number; stack: string }[];
  passed: boolean;
}

export class LeakTracker {
  private listenersRegistry = new Map<any, Map<string, Set<Function>>>();
  private activeTimeouts = new Map<number, string>();
  private activeIntervals = new Map<number, string>();
  private activeRafs = new Map<number, string>();

  private origAddEventListener = (globalThis as any).EventTarget?.prototype?.addEventListener;
  private origRemoveEventListener = (globalThis as any).EventTarget?.prototype?.removeEventListener;
  private origSetTimeout = globalThis.setTimeout;
  private origClearTimeout = globalThis.clearTimeout;
  private origSetInterval = globalThis.setInterval;
  private origClearInterval = globalThis.clearInterval;

  public enable() {
    const self = this;

    if ((globalThis as any).EventTarget) {
      (globalThis as any).EventTarget.prototype.addEventListener = function (
        type: string,
        listener: any,
        options?: any
      ) {
        if (typeof listener === 'function') {
          let targetMap = self.listenersRegistry.get(this);
          if (!targetMap) {
            targetMap = new Map();
            self.listenersRegistry.set(this, targetMap);
          }
          let typeSet = targetMap.get(type);
          if (!typeSet) {
            typeSet = new Set();
            targetMap.set(type, typeSet);
          }
          typeSet.add(listener);
        }
        if (self.origAddEventListener) {
          return self.origAddEventListener.call(this, type, listener, options);
        }
      };

      (globalThis as any).EventTarget.prototype.removeEventListener = function (
        type: string,
        listener: any,
        options?: any
      ) {
        if (typeof listener === 'function') {
          const targetMap = self.listenersRegistry.get(this);
          if (targetMap) {
            const typeSet = targetMap.get(type);
            if (typeSet) {
              typeSet.delete(listener);
              if (typeSet.size === 0) targetMap.delete(type);
            }
            if (targetMap.size === 0) self.listenersRegistry.delete(this);
          }
        }
        if (self.origRemoveEventListener) {
          return self.origRemoveEventListener.call(this, type, listener, options);
        }
      };
    }

    globalThis.setTimeout = function (handler: TimerHandler, timeout?: number, ...args: any[]): any {
      const stack = new Error().stack || '';
      let id: any;
      const wrapped = typeof handler === 'function'
        ? (...hArgs: any[]) => {
            self.activeTimeouts.delete(id);
            return (handler as Function)(...hArgs);
          }
        : handler;
      id = self.origSetTimeout.call(globalThis, wrapped, timeout, ...args);
      self.activeTimeouts.set(id, stack);
      return id;
    };

    globalThis.clearTimeout = function (id?: any) {
      if (id !== undefined) self.activeTimeouts.delete(id);
      return self.origClearTimeout.call(globalThis, id);
    };

    globalThis.setInterval = function (handler: TimerHandler, timeout?: number, ...args: any[]): any {
      const stack = new Error().stack || '';
      const id = self.origSetInterval.call(globalThis, handler, timeout, ...args);
      self.activeIntervals.set(id as any, stack);
      return id;
    };

    globalThis.clearInterval = function (id?: any) {
      if (id !== undefined) self.activeIntervals.delete(id);
      return self.origClearInterval.call(globalThis, id);
    };
  }

  public disable() {
    if ((globalThis as any).EventTarget) {
      (globalThis as any).EventTarget.prototype.addEventListener = this.origAddEventListener;
      (globalThis as any).EventTarget.prototype.removeEventListener = this.origRemoveEventListener;
    }
    globalThis.setTimeout = this.origSetTimeout;
    globalThis.clearTimeout = this.origClearTimeout;
    globalThis.setInterval = this.origSetInterval;
    globalThis.clearInterval = this.origClearInterval;
  }

  public getResidualState(): LeakReport {
    const activeEventListeners: { target: string; type: string; count: number }[] = [];
    for (const [target, map] of this.listenersRegistry.entries()) {
      const targetName =
        target === (globalThis as any).window
          ? 'Window'
          : target === (globalThis as any).document
          ? 'Document'
          : target.constructor?.name || 'DOMElement';
      for (const [type, set] of map.entries()) {
        if (set.size > 0) {
          activeEventListeners.push({ target: targetName, type, count: set.size });
        }
      }
    }

    const activeTimers = [
      ...Array.from(this.activeTimeouts.entries()).map(([id, stack]) => ({
        type: 'timeout' as const,
        id: String(id),
        stack: stack.split('\n')[1] || '',
      })),
      ...Array.from(this.activeIntervals.entries()).map(([id, stack]) => ({
        type: 'interval' as const,
        id: String(id),
        stack: stack.split('\n')[1] || '',
      })),
    ];

    const passed = activeEventListeners.length === 0 && activeTimers.length === 0;

    return {
      activeEventListeners,
      activeTimers,
      passed,
    };
  }
}
