import type { DatasetFileKey, FileManifestEntry, IRemoteDataProvider, VersionManifest } from './types.ts';
import { GoogleDriveResolver } from './GoogleDriveResolver.ts';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export class GoogleDriveProvider implements IRemoteDataProvider {
  public readonly providerId = 'gdrive';
  private manifestFileIdOrUrl: string;
  private apiKey?: string;

  constructor(
    manifestFileIdOrUrl: string,
    apiKey?: string
  ) {
    this.manifestFileIdOrUrl = manifestFileIdOrUrl;
    this.apiKey = apiKey;
  }

  public async fetchManifest(timeoutMs = 6000): Promise<VersionManifest | null> {
    const directUrl = GoogleDriveResolver.buildDirectDownloadUrl(this.manifestFileIdOrUrl, this.apiKey);
    if (!directUrl) return null;

    // 1. If on native mobile platform (iOS/Android), use CapacitorHttp (no CORS)
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await CapacitorHttp.get({
          url: directUrl,
          headers: { Accept: 'application/json' },
          connectTimeout: timeoutMs,
          readTimeout: timeoutMs,
        });
        if (res.status >= 200 && res.status < 300 && res.data) {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (data && data.version && data.files) return data as VersionManifest;
        }
      } catch (e) {
        console.debug('[GoogleDriveProvider] Native fetch fallback:', e);
      }
    }

    // 2. In web browser: Google Drive uc?export=download does not send CORS headers.
    // Seamlessly fetch local /version.json to avoid browser console CORS errors.
    if (directUrl.includes('drive.google.com')) {
      try {
        const localRes = await fetch('/version.json', { headers: { Accept: 'application/json' } });
        if (localRes.ok) {
          const json = await localRes.json();
          if (json && json.version && json.files) return json as VersionManifest;
        }
      } catch {}
      return null;
    }

    // 3. For custom CORS-enabled remote endpoints
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(directUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && json.version && json.files) {
        return json as VersionManifest;
      }
      return null;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  public async fetchFileContent(
    fileKey: DatasetFileKey,
    entry: FileManifestEntry,
    onProgress?: (pct: number) => void
  ): Promise<ArrayBuffer | null> {
    const target = entry.directUrl || entry.sourceId || '';
    if (!target) return null;

    const directUrl = GoogleDriveResolver.buildDirectDownloadUrl(target, this.apiKey);
    if (!directUrl) return null;

    // 1. If on native mobile platform (iOS/Android), use CapacitorHttp (no CORS)
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await CapacitorHttp.get({
          url: directUrl,
          responseType: 'arraybuffer',
          connectTimeout: 30000,
          readTimeout: 30000,
        });
        if (res.status >= 200 && res.status < 300 && res.data) {
          onProgress?.(100);
          return res.data;
        }
      } catch (e) {
        console.debug(`[GoogleDriveProvider] Native download fallback for ${fileKey}:`, e);
      }
      return null;
    }

    // 2. Web browser: if Google Drive url, fallback to bundled static file without CORS errors
    if (directUrl.includes('drive.google.com')) {
      try {
        const path = fileKey === 'countries' ? '/countries.geojson' : `/${fileKey}.json`;
        const res = await fetch(path);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          onProgress?.(100);
          return buf;
        }
      } catch {}
      return null;
    }

    // 3. Standard browser fetch with streaming for CORS-enabled URLs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch(directUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentLength = +(res.headers.get('Content-Length') || entry.sizeBytes || 0);
      const reader = res.body?.getReader();

      if (!reader) {
        const buf = await res.arrayBuffer();
        onProgress?.(100);
        return buf;
      }

      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (contentLength > 0 && onProgress) {
            onProgress(Math.min(99, Math.round((receivedBytes / contentLength) * 100)));
          }
        }
      }

      const totalBuf = new Uint8Array(receivedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        totalBuf.set(chunk, offset);
        offset += chunk.length;
      }

      onProgress?.(100);
      return totalBuf.buffer;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }
}
