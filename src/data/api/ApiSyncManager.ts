import type { ApiResponse, DataSourceOrigin, LiveWeatherData, RequestOptions } from './types.ts';
import { networkMonitor } from './NetworkMonitor.ts';
import { DeterministicSolarClimateEngine } from '../DeterministicSolarClimateEngine.ts';

interface QueueTask<T> {
  id: string;
  options: RequestOptions;
  execute: () => Promise<ApiResponse<T>>;
  resolve: (res: ApiResponse<T>) => void;
  reject: (err: any) => void;
}

export class ApiSyncManager {
  private static instance: ApiSyncManager;

  // L1: Fast In-Memory Cache (TTL: 12 min for weather)
  private memoryCache = new Map<string, { data: any; timestamp: number; ttlMs: number }>();

  // In-Flight Request Deduplication Pool (shares active Promises)
  private inFlightRequests = new Map<string, Promise<any>>();

  // Background Task Queue with Concurrency Limit
  private queue: QueueTask<any>[] = [];
  private activeWorkers = 0;
  private readonly MAX_CONCURRENCY = 3;

  private constructor() {
    networkMonitor.subscribe((state) => {
      if (state.connected) {
        this.processQueue();
      }
    });
  }

  public static getInstance(): ApiSyncManager {
    if (!ApiSyncManager.instance) {
      ApiSyncManager.instance = new ApiSyncManager();
    }
    return ApiSyncManager.instance;
  }

  // ==========================================
  // ⚡ CATEGORY 1: LIVE API (Weather Open-Meteo)
  // ==========================================
  public async getLiveWeather(
    lat: number,
    lng: number,
    forceRefresh = false
  ): Promise<LiveWeatherData> {
    const roundedLat = parseFloat(lat.toFixed(2));
    const roundedLng = parseFloat(lng.toFixed(2));
    const cacheKey = `weather_${roundedLat}_${roundedLng}`;

    // 1. Check L1 Memory Cache (TTL: 12 minutes = 720,000 ms)
    const TTL_LIVE = 12 * 60 * 1000;
    if (!forceRefresh) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttlMs) {
        // Refresh LRU order: re-insert key at the end
        this.memoryCache.delete(cacheKey);
        this.memoryCache.set(cacheKey, cached);
        return {
          ...cached.data,
          origin: 'memory-cache',
          isOffline: false,
          timestamp: cached.timestamp,
        };
      }
    }

    // 2. If device is offline -> INSTANT deterministic math calculation (0 ms delay)
    if (!networkMonitor.isOnline()) {
      return this.computeMathematicalWeatherFallback(lat, lng, 'math-fallback');
    }

    // 3. Build deduplicated request to Open-Meteo with 3.5s AbortController
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;

    return this.executeWithDeduplication(cacheKey, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Open-Meteo HTTP ${response.status}`);
        }

        const data = await response.json();
        const weather: LiveWeatherData = {
          temp: Math.round(data.current?.temperature_2m ?? 18),
          humidity: Math.round(data.current?.relative_humidity_2m ?? 60),
          wind: Math.round(data.current?.wind_speed_10m ?? 12),
          isOffline: false,
          origin: 'live-network',
          timestamp: Date.now(),
        };

        // Cache in memory with strict LRU eviction
        this.setCache(cacheKey, weather, TTL_LIVE);

        return weather;
      } catch (err) {
        clearTimeout(timeoutId);
        return this.computeMathematicalWeatherFallback(lat, lng, 'math-fallback');
      }
    });
  }

  private readonly MAX_CACHE_ENTRIES = 100;

  private setCache(key: string, data: any, ttlMs: number) {
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key);
    } else if (this.memoryCache.size >= this.MAX_CACHE_ENTRIES) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(key, { data, timestamp: Date.now(), ttlMs });
  }

  // ==========================================
  // 🛡️ ANTI-SPAM: DEDUPLICATION & CONCURRENCY
  // ==========================================
  private executeWithDeduplication<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  private processQueue() {
    if (this.queue.length === 0 || this.activeWorkers >= this.MAX_CONCURRENCY) return;
    if (!networkMonitor.isOnline()) return;

    this.queue.sort((a, b) => {
      const pMap = { CRITICAL: 1, NORMAL: 2, BACKGROUND: 3 };
      return (pMap[a.options.priority || 'NORMAL'] || 2) - (pMap[b.options.priority || 'NORMAL'] || 2);
    });

    const task = this.queue.shift();
    if (!task) return;

    this.activeWorkers++;
    task
      .execute()
      .then(task.resolve)
      .catch(task.reject)
      .finally(() => {
        this.activeWorkers--;
        this.processQueue();
      });
  }

  // =======================================================
  // ☀️ DETERMINISTIC SOLAR-ORBITAL CLIMATE MODEL (FALLBACK)
  // =======================================================
  public computeMathematicalWeatherFallback(
    lat: number,
    lng: number,
    origin: DataSourceOrigin = 'math-fallback'
  ): LiveWeatherData {
    const report = DeterministicSolarClimateEngine.calculate(lat, lng);

    return {
      temp: Math.round(report.estimatedTemperatureC),
      humidity: report.estimatedHumidityPct,
      wind: Math.round(report.windSpeedMs * 3.6), // convert m/s to km/h
      isOffline: true,
      origin,
      timestamp: report.timestamp,
    };
  }
}

export const apiSyncManager = ApiSyncManager.getInstance();
