import type { DatasetBundle, DatasetFileKey, IRemoteDataProvider, SyncProgressCallback, VersionManifest } from './types.ts';
import { terraStorageDB } from './TerraStorageDB.ts';
import { CryptoResolver } from './CryptoResolver.ts';
import { GoogleDriveProvider } from './GoogleDriveProvider.ts';
import { DataValidator } from './DataValidator.ts';

function getAssetUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location) {
    try {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return new URL(cleanPath, window.location.href).href;
    } catch {}
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export class DataSyncManager {
  private remoteProvider: IRemoteDataProvider | null = null;
  private l1CachedBundle: DatasetBundle | null = null;
  public syncOrigin: 'cached_l2' | 'bundled' | 'remote_synced' = 'bundled';
  public lastSyncTimestamp: number = 0;

  constructor() {
    this.initDefaultProvider();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        const fileKeys: DatasetFileKey[] = ['countries', 'religions', 'indexes', 'demographics'];
        terraStorageDB.getManifest().then((m) => this.scheduleBackgroundSync(fileKeys, m)).catch(() => {});
      });
    }
  }

  /**
   * Initializes default obfuscated remote manifest source
   */
  private initDefaultProvider() {
    // 1. Check runtime localStorage override
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const customSaved = localStorage.getItem('terrametrics_custom_source');
      if (customSaved) {
        const decrypted = CryptoResolver.decodeObfuscated(customSaved) || customSaved;
        this.remoteProvider = new GoogleDriveProvider(decrypted);
        return;
      }
    }

    // 2. Check environment variable override or embedded encrypted token
    const encryptedToken =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SYNC_MANIFEST_TOKEN) ||
      'PBEGAhJ3SlsWGwoFVmo4XV9VWjppBgA-SgcHGxM6fAcDGDtcS0seZSYxPzYOJDIkHlAwfyotUXJ-fiwPLwNrC1s2GhwMEjIbSypKSQVCPAQAGw8q';

    if (encryptedToken) {
      const decryptedId = CryptoResolver.decodeObfuscated(encryptedToken);
      if (decryptedId) {
        this.remoteProvider = new GoogleDriveProvider(decryptedId);
      }
    }
  }

  /**
   * Dynamically sets custom provider or custom Google Drive link / ID in runtime
   * and securely stores it obfuscated in localStorage.
   */
  public setCustomSource(fileIdOrUrl: string) {
    if (!fileIdOrUrl) return;
    const cleanInput = fileIdOrUrl.trim();
    this.remoteProvider = new GoogleDriveProvider(cleanInput);

    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      const obfuscated = CryptoResolver.encodeObfuscated(cleanInput);
      localStorage.setItem('terrametrics_custom_source', obfuscated);
    }
  }

  /**
   * Resets remote provider to the default embedded source
   */
  public resetToDefaultSource() {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem('terrametrics_custom_source');
    }
    this.initDefaultProvider();
  }

  /**
   * Loads the full dataset bundle with instant SWR cold start (<15ms)
   * and non-blocking background delta-sync.
   */
  public async loadDataset(
    _onProgress?: SyncProgressCallback,
    options?: { syncInBackground?: boolean; forceReload?: boolean }
  ): Promise<DatasetBundle> {
    if (this.l1CachedBundle && !options?.forceReload) {
      return this.l1CachedBundle;
    }

    const fileKeys: DatasetFileKey[] = ['countries', 'religions', 'indexes', 'demographics'];
    const localManifest = await terraStorageDB.getManifest();
    const syncInBackground = options?.syncInBackground ?? true;

    // 1. First attempt: Read L2 IndexedDB immediately (<15ms)
    const [rawGeo, rawRel, rawIdx, rawDemo] = await Promise.all([
      terraStorageDB.getFile('countries'),
      terraStorageDB.getFile('religions'),
      terraStorageDB.getFile('indexes'),
      terraStorageDB.getFile('demographics'),
    ]);

    let geoJson: any = null;
    let religions: any = null;
    let indexes: any = null;
    let demographics: any = null;

    if (rawGeo && rawRel && rawIdx && rawDemo) {
      try {
        geoJson = typeof rawGeo === 'string' ? JSON.parse(rawGeo) : rawGeo;
        religions = typeof rawRel === 'string' ? JSON.parse(rawRel) : rawRel;
        indexes = typeof rawIdx === 'string' ? JSON.parse(rawIdx) : rawIdx;
        demographics = typeof rawDemo === 'string' ? JSON.parse(rawDemo) : rawDemo;

        const val = DataValidator.validateBundle({ geoJson, religions, indexes, demographics });
        if (val.valid) {
          this.syncOrigin = 'cached_l2';
          this.lastSyncTimestamp = localManifest ? new Date(localManifest.datasetRelease).getTime() : Date.now();
          this.l1CachedBundle = { geoJson, religions, indexes, demographics };
          
          // SWR: non-blocking background delta sync
          if (syncInBackground) {
            this.scheduleBackgroundSync(fileKeys, localManifest).catch(() => {});
          } else {
            await this.scheduleBackgroundSync(fileKeys, localManifest);
            if ((this.syncOrigin as string) === 'remote_synced') {
              const freshDemo = await terraStorageDB.getFile('demographics');
              if (freshDemo) {
                demographics = typeof freshDemo === 'string' ? JSON.parse(freshDemo) : freshDemo;
                this.l1CachedBundle = { geoJson, religions, indexes, demographics };
              }
            }
          }
          return this.l1CachedBundle;
        } else {
          console.warn('[DataSyncManager] L2 cache failed validation, falling back to L3 bundled assets');
          geoJson = null;
        }
      } catch (err) {
        console.warn('[DataSyncManager] Failed parsing L2 cache:', err);
        geoJson = null;
      }
    }

    // 2. Fallback to L3 bundled assets if L2 was empty or invalid
    if (!geoJson || !religions || !indexes || !demographics) {
      const [gRes, rRes, iRes, dRes] = await Promise.all([
        fetch(getAssetUrl('countries.geojson')),
        fetch(getAssetUrl('religions.json')),
        fetch(getAssetUrl('indexes.json')),
        fetch(getAssetUrl('demographics.json')),
      ]);

      geoJson = await gRes.json();
      religions = await rRes.json();
      indexes = await iRes.json();
      demographics = await dRes.json();

      this.syncOrigin = 'bundled';
      this.lastSyncTimestamp = Date.now();

      // Seed L2 cache & version.json manifest for subsequent instant starts (structured clone)
      const verRes = await fetch(getAssetUrl('version.json')).catch(() => null);
      const pVer = verRes ? await verRes.json().catch(() => null) : null;

      await Promise.allSettled([
        terraStorageDB.saveFile('countries', geoJson),
        terraStorageDB.saveFile('religions', religions),
        terraStorageDB.saveFile('indexes', indexes),
        terraStorageDB.saveFile('demographics', demographics),
        pVer ? terraStorageDB.saveManifest(pVer) : Promise.resolve(),
      ]);

      // Schedule background delta check
      if (syncInBackground) {
        this.scheduleBackgroundSync(fileKeys, pVer || localManifest).catch(() => {});
      } else {
        await this.scheduleBackgroundSync(fileKeys, pVer || localManifest);
      }
    }

    this.l1CachedBundle = {
      geoJson,
      religions,
      indexes,
      demographics,
    };
    return this.l1CachedBundle;
  }

  public async scheduleBackgroundSync(fileKeys: DatasetFileKey[], localManifest: VersionManifest | null): Promise<void> {
    if (!this.remoteProvider) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const runSync = async () => {
      try {
        const remoteManifest = await this.remoteProvider!.fetchManifest(2500);
        if (!remoteManifest || !remoteManifest.files) return;

        const deltaKeysToDownload: DatasetFileKey[] = [];
        for (const key of fileKeys) {
          const remoteEntry = remoteManifest.files[key];
          const localEntry = localManifest?.files?.[key];
          if (remoteEntry && (!localEntry || localEntry.sha256 !== remoteEntry.sha256)) {
            deltaKeysToDownload.push(key);
          }
        }

        if (deltaKeysToDownload.length > 0) {
          for (const key of deltaKeysToDownload) {
            const entry = remoteManifest.files[key];
            const buffer = await this.remoteProvider!.fetchFileContent(key, entry);
            if (buffer) {
              const computedHash = await CryptoResolver.computeSha256(buffer);
              if (computedHash.toLowerCase() === entry.sha256.toLowerCase()) {
                const text = new TextDecoder('utf-8').decode(buffer);
                let parsed: any = text;
                try {
                  parsed = JSON.parse(text);
                } catch {}
                await terraStorageDB.saveFile(key, parsed);
              }
            }
          }
          await terraStorageDB.saveManifest(remoteManifest);
          this.syncOrigin = 'remote_synced';
          this.lastSyncTimestamp = Date.now();
        }
      } catch (e) {
        // Silent non-blocking catch
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => runSync(), { timeout: 3000 });
    } else if (typeof window === 'undefined') {
      await runSync();
    } else {
      setTimeout(runSync, 1000);
    }
  }

  /**
   * Explicit user-triggered or on-demand synchronization:
   * 1. Checks remote provider or latest version.json
   * 2. Downloads any changed delta files
   * 3. Stores them into IndexedDB (L2)
   * 4. Returns whether new updates were applied
   */
  public async syncNow(onProgress?: SyncProgressCallback): Promise<{ updated: boolean; count: number; error?: string }> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      onProgress?.({ stage: 'done', percentage: 100, loadedBytes: 100, totalBytes: 100 });
      return { updated: false, count: 0, error: 'Offline mode active' };
    }

    const fileKeys: DatasetFileKey[] = ['countries', 'religions', 'indexes', 'demographics'];
    try {
      onProgress?.({ stage: 'manifest', percentage: 15, loadedBytes: 0, totalBytes: 100 });
      const localManifest = await terraStorageDB.getManifest();

      let remoteManifest: VersionManifest | null = null;
      if (this.remoteProvider) {
        remoteManifest = await this.remoteProvider.fetchManifest(5000);
      }
      if (!remoteManifest) {
        // Fetch local version.json as fallback
        remoteManifest = await fetch('/version.json?t=' + Date.now())
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
      }

      if (!remoteManifest || !remoteManifest.files) {
        onProgress?.({ stage: 'done', percentage: 100, loadedBytes: 100, totalBytes: 100 });
        return { updated: false, count: 0 };
      }

      const deltaKeysToDownload: DatasetFileKey[] = [];
      for (const key of fileKeys) {
        const remoteEntry = remoteManifest.files[key];
        const localEntry = localManifest?.files?.[key];
        if (remoteEntry && (!localEntry || localEntry.sha256 !== remoteEntry.sha256)) {
          deltaKeysToDownload.push(key);
        }
      }

      if (deltaKeysToDownload.length === 0) {
        onProgress?.({ stage: 'done', percentage: 100, loadedBytes: 100, totalBytes: 100 });
        return { updated: false, count: 0 };
      }

      let downloaded = 0;
      for (let i = 0; i < deltaKeysToDownload.length; i++) {
        const key = deltaKeysToDownload[i];
        const entry = remoteManifest.files[key];
        const pctBase = 20 + Math.round((i / deltaKeysToDownload.length) * 70);
        onProgress?.({ stage: 'delta_download', fileKey: key, percentage: pctBase, loadedBytes: i, totalBytes: deltaKeysToDownload.length });

        let buffer: ArrayBuffer | null = null;
        if (this.remoteProvider) {
          buffer = await this.remoteProvider.fetchFileContent(key, entry, (subPct) => {
            onProgress?.({
              stage: 'delta_download',
              fileKey: key,
              percentage: pctBase + Math.round((subPct / 100) * (70 / deltaKeysToDownload.length)),
              loadedBytes: 0,
              totalBytes: 100,
            });
          });
        }
        if (!buffer) {
          const res = await fetch(`/${key === 'countries' ? 'countries.geojson' : key + '.json'}?t=` + Date.now());
          if (res.ok) buffer = await res.arrayBuffer();
        }

        if (buffer) {
          const entry = remoteManifest.files[key];
          if (entry?.sha256) {
            const computedHash = await CryptoResolver.computeSha256(buffer);
            if (computedHash.toLowerCase() !== entry.sha256.toLowerCase()) {
              console.warn(`[DataSyncManager] SHA-256 mismatch for ${key}, skipping save.`);
              continue;
            }
          }
          const text = new TextDecoder('utf-8').decode(buffer);
          await terraStorageDB.saveFile(key, text);
          downloaded++;
        }
      }

      await terraStorageDB.saveManifest(remoteManifest);
      this.syncOrigin = 'remote_synced';
      this.lastSyncTimestamp = Date.now();
      onProgress?.({ stage: 'done', percentage: 100, loadedBytes: 100, totalBytes: 100 });
      return { updated: downloaded > 0, count: downloaded };
    } catch (e: any) {
      return { updated: false, count: 0, error: e?.message || 'Sync failed' };
    }
  }

  /**
   * Forces full cache wipe and fresh re-sync
   */
  public async forceFullResync(onProgress?: SyncProgressCallback): Promise<boolean> {
    try {
      await terraStorageDB.clearAll();
      const bundle = await this.loadDataset(onProgress);
      return !!bundle && !!bundle.geoJson;
    } catch {
      return false;
    }
  }
}

export const dataSyncManager = new DataSyncManager();
