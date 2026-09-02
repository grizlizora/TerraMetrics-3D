import type { NetworkState } from './types.ts';

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private state: NetworkState = {
    connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  };
  private listeners: Set<(state: NetworkState) => void> = new Set();

  private constructor() {
    this.init();
  }

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private async init() {
    // 1. Try to load Capacitor Network if available in runtime
    try {
      const cap = typeof window !== 'undefined' ? (window as any).Capacitor : null;
      const networkPlugin = cap?.Plugins?.Network;
      if (networkPlugin) {
        const status = await networkPlugin.getStatus();
        this.updateState(status.connected, status.connectionType);
        networkPlugin.addListener('networkStatusChange', (status: any) => {
          this.updateState(status.connected, status.connectionType);
        });
        return;
      }
    } catch {
      // Running in standard web browser
    }

    // 2. Standard Web API event listener fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateState(true, 'unknown');
      });
      window.addEventListener('offline', () => {
        this.updateState(false, 'none');
      });
    }
  }

  private updateState(connected: boolean, connectionType: NetworkState['connectionType']) {
    this.state = { connected, connectionType };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public isOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return this.state.connected;
  }

  public getStatus(): NetworkState {
    return { ...this.state };
  }

  public subscribe(callback: (state: NetworkState) => void): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => this.listeners.delete(callback);
  }
}

export const networkMonitor = NetworkMonitor.getInstance();
