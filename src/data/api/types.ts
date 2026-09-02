export type RequestPriority = 'CRITICAL' | 'NORMAL' | 'BACKGROUND';
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
export type DataSourceOrigin = 'live-network' | 'memory-cache' | 'persistent-cache' | 'math-fallback' | 'bundled-fallback';

export interface ApiResponse<T> {
  data: T;
  origin: DataSourceOrigin;
  timestamp: number;
  isStale: boolean;
  etag?: string;
}

export interface RequestOptions {
  ttlMs?: number;
  timeoutMs?: number;
  priority?: RequestPriority;
  strategy?: CacheStrategy;
  etag?: string;
}

export interface LiveWeatherData {
  temp: number;
  humidity: number;
  wind: number;
  isOffline: boolean;
  origin: DataSourceOrigin;
  timestamp: number;
}

export interface NetworkState {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}
