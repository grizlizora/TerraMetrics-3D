import type { DatasetFileKey, VersionManifest } from './types.ts';

export class TerraStorageDB {
  private static readonly DB_NAME = 'terrametrics_data_v1';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_FILES = 'dataset_files';
  private static readonly STORE_META = 'metadata';

  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB is not available in this environment'));
      }

      const request = indexedDB.open(TerraStorageDB.DB_NAME, TerraStorageDB.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(TerraStorageDB.STORE_FILES)) {
          db.createObjectStore(TerraStorageDB.STORE_FILES);
        }
        if (!db.objectStoreNames.contains(TerraStorageDB.STORE_META)) {
          db.createObjectStore(TerraStorageDB.STORE_META);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  public async getFile(key: DatasetFileKey): Promise<string | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(TerraStorageDB.STORE_FILES, 'readonly');
        const store = tx.objectStore(TerraStorageDB.STORE_FILES);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  public async getManifest(): Promise<VersionManifest | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(TerraStorageDB.STORE_META, 'readonly');
        const store = tx.objectStore(TerraStorageDB.STORE_META);
        const req = store.get('current_manifest');
        req.onsuccess = () => {
          if (!req.result) return resolve(null);
          try {
            resolve(typeof req.result === 'string' ? JSON.parse(req.result) : req.result);
          } catch {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  public async saveFile(key: DatasetFileKey, content: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TerraStorageDB.STORE_FILES, 'readwrite');
      const store = tx.objectStore(TerraStorageDB.STORE_FILES);
      store.put(content, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  public async saveManifest(manifest: VersionManifest): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TerraStorageDB.STORE_META, 'readwrite');
      const store = tx.objectStore(TerraStorageDB.STORE_META);
      store.put(JSON.stringify(manifest), 'current_manifest');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  public async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction([TerraStorageDB.STORE_FILES, TerraStorageDB.STORE_META], 'readwrite');
      tx.objectStore(TerraStorageDB.STORE_FILES).clear();
      tx.objectStore(TerraStorageDB.STORE_META).clear();
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });
    } catch (e) {
      console.warn('[TerraStorageDB] Failed to clear stores:', e);
    }
  }
}

export const terraStorageDB = new TerraStorageDB();
