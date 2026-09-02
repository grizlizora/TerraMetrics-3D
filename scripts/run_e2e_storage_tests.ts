/**
 * TerraMetrics-3D - Full E2E Offline & Storage Test Suite
 * Run via: node --experimental-strip-types scripts/run_e2e_storage_tests.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------
// 1. ENVIRONMENT POLYFILLS FOR NODE.JS RUNTIME
// ---------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

// Web Crypto API subtle polyfill
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  (globalThis as any).crypto = crypto.webcrypto;
}

// In-Memory LocalStorage Mock
class LocalStorageMock {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}
const mockLocalStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  configurable: true,
  writable: true,
});

// In-Memory Fast IndexedDB Mock for TerraStorageDB testing
class MemoryObjectStore {
  public data = new Map<string, any>();
  get(key: string) {
    const req: any = { result: this.data.get(key) };
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
  }
  put(value: any, key: string) {
    this.data.set(key, value);
    const req: any = {};
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
  }
  clear() {
    this.data.clear();
    const req: any = {};
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
  }
}

class MemoryTransaction {
  stores: Record<string, MemoryObjectStore>;
  constructor(stores: Record<string, MemoryObjectStore>) {
    this.stores = stores;
  }
  objectStore(name: string) {
    return this.stores[name];
  }
  set oncomplete(cb: any) {
    setTimeout(cb, 1);
  }
}

const globalStores: Record<string, MemoryObjectStore> = {
  dataset_files: new MemoryObjectStore(),
  metadata: new MemoryObjectStore(),
};

class MemoryIDBDatabase {
  public stores = globalStores;
  public objectStoreNames = {
    contains: (name: string) => name in this.stores,
  };
  transaction(storeNames: string | string[], _mode: string) {
    return new MemoryTransaction(this.stores);
  }
}

(globalThis as any).indexedDB = {
  open: (_name: string, _version: number) => {
    const db = new MemoryIDBDatabase();
    const req: any = {
      result: db,
      onsuccess: null,
      onupgradeneeded: null,
    };
    setTimeout(() => {
      req.onupgradeneeded?.({ target: { result: db } });
      req.onsuccess?.();
    }, 2);
    return req;
  },
};

function setOnline(online: boolean) {
  if (typeof navigator === 'undefined') {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: online },
      configurable: true,
      writable: true,
    });
  } else {
    Object.defineProperty(navigator, 'onLine', {
      value: online,
      configurable: true,
      writable: true,
    });
  }
}
setOnline(true);

// Mock Fetch for local /public/*.json assets
const originalFetch = globalThis.fetch;
(globalThis as any).fetch = async (url: string | URL | Request, init?: RequestInit) => {
  const urlStr = url.toString();
  if (urlStr.startsWith('/') || urlStr.startsWith('http://localhost') || !urlStr.startsWith('http')) {
    const cleanFileName = urlStr.replace(/^\//, '').split('?')[0];
    const localFilePath = path.join(publicDir, cleanFileName);
    if (fs.existsSync(localFilePath)) {
      const content = fs.readFileSync(localFilePath);
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return originalFetch(url, init);
};

// ---------------------------------------------------------
// 2. IMPORT SYSTEM MODULES UNDER TEST
// ---------------------------------------------------------
import { CryptoResolver } from '../src/data/sync/CryptoResolver.ts';
import { GoogleDriveResolver } from '../src/data/sync/GoogleDriveResolver.ts';
import { GoogleDriveProvider } from '../src/data/sync/GoogleDriveProvider.ts';
import { TerraStorageDB } from '../src/data/sync/TerraStorageDB.ts';
import { DataValidator } from '../src/data/sync/DataValidator.ts';
import { DataSyncManager } from '../src/data/sync/DataSyncManager.ts';
import { ApiSyncManager } from '../src/data/api/ApiSyncManager.ts';
import type { VersionManifest } from '../src/data/sync/types.ts';

// ---------------------------------------------------------
// 3. COLOR LOGGING & TEST HARNESS
// ---------------------------------------------------------
const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ${colors.green('✔ PASS:')} ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ${colors.red('✖ FAIL:')} ${testName} ${details ? `(${details})` : ''}`);
    totalFailed++;
  }
}

// ---------------------------------------------------------
// 4. TEST SUITE EXECUTION
// ---------------------------------------------------------
async function runSuite() {
  console.log(colors.bold(colors.cyan('\n======================================================')));
  console.log(colors.bold(colors.cyan(' 🛡️  TerraMetrics-3D: Architecture & Storage E2E Suite ')));
  console.log(colors.bold(colors.cyan('======================================================\n')));

  // -------------------------------------------------------
  // SCENARIO 2: Cryptographic Protection & Google Drive Resolving
  // -------------------------------------------------------
  console.log(colors.bold(colors.yellow('▶ SCENARIO 2: Cryptographic Protection & Google Drive Resolving')));
  
  const testPlain = 'https://drive.google.com/file/d/1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999/view?usp=sharing';
  const obfuscated = CryptoResolver.encodeObfuscated(testPlain);
  const decrypted = CryptoResolver.decodeObfuscated(obfuscated);
  assert(decrypted === testPlain, 'XOR+Base64Url symmetric encode/decode roundtrip');
  assert(!obfuscated.includes('drive.google.com'), 'Obfuscated string does not contain plaintext URL fragments');

  // Verify extraction across 5 Google Drive link styles
  const id1 = GoogleDriveResolver.extractFileId('1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999');
  const id2 = GoogleDriveResolver.extractFileId('https://drive.google.com/file/d/1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999/view');
  const id3 = GoogleDriveResolver.extractFileId('https://drive.google.com/drive/folders/1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999');
  const id4 = GoogleDriveResolver.extractFileId('https://drive.google.com/open?id=1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999');
  const id5 = GoogleDriveResolver.extractFileId('https://drive.google.com/uc?id=1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999&export=download');
  
  assert(id1 === '1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999' && id2 === id1 && id3 === id1 && id4 === id1 && id5 === id1,
    'GoogleDriveResolver extracts File ID across all 5 URL formats');

  const directUrl = GoogleDriveResolver.buildDirectDownloadUrl('1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999');
  assert(directUrl.includes('confirm=t') && directUrl.includes('export=download'),
    'buildDirectDownloadUrl generates direct link with confirm=t bypass');

  // -------------------------------------------------------
  // SCENARIO 1: Cold Start Offline & L3 Bundled Fallback
  // -------------------------------------------------------
  console.log(colors.bold(colors.yellow('\n▶ SCENARIO 1: Cold Start Offline & L3 Bundled Fallback')));
  
  setOnline(false);
  const storageDB = new TerraStorageDB();
  await storageDB.clearAll();

  const syncManager = new DataSyncManager();
  const bundle = await syncManager.loadDataset();

  assert(bundle !== null && typeof bundle === 'object', 'Dataset bundle successfully returned');
  assert(syncManager.syncOrigin === 'bundled', 'Origin is marked as "bundled" on initial offline start');
  
  const valResult = DataValidator.validateBundle(bundle);
  assert(valResult.valid, `DataValidator validated full bundle (${bundle.geoJson.features.length} features)`);
  assert(bundle.geoJson.features.length >= 150, 'Features count >= 150 in GeoJSON');

  // Verify L2 Seeding
  const cachedGeo = await storageDB.getFile('countries');
  const isGeoValid = cachedGeo !== null && (
    (typeof cachedGeo === 'string' && cachedGeo.length > 1000) ||
    (typeof cachedGeo === 'object' && (cachedGeo as any).features?.length >= 150)
  );
  assert(isGeoValid, 'L2 IndexedDB seeded with GeoJSON data');

  // Subsequent load should now resolve from L2
  const secondLoadManager = new DataSyncManager();
  await secondLoadManager.loadDataset();
  assert(secondLoadManager.syncOrigin === 'cached_l2', 'Subsequent load resolves with syncOrigin="cached_l2"');

  // -------------------------------------------------------
  // SCENARIO 3: Delta Updates & Zero-Spam Traffic
  // -------------------------------------------------------
  console.log(colors.bold(colors.yellow('\n▶ SCENARIO 3: Delta Updates & Zero-Spam Traffic')));
  setOnline(true);

  const currentLocalManifest = await storageDB.getManifest();
  assert(currentLocalManifest !== null, 'Local manifest exists in IndexedDB');

  // 3A: Zero-Spam Test (Matching SHA-256)
  let mockFetchCallCount = 0;
  class MockZeroSpamProvider extends GoogleDriveProvider {
    constructor() { super('mock_token'); }
    async fetchManifest(): Promise<VersionManifest | null> {
      return currentLocalManifest; // Same hashes
    }
    async fetchFileContent(): Promise<ArrayBuffer | null> {
      mockFetchCallCount++;
      return new ArrayBuffer(0);
    }
  }

  const zeroSpamManager = new DataSyncManager();
  (zeroSpamManager as any).remoteProvider = new MockZeroSpamProvider();
  await zeroSpamManager.loadDataset(undefined, { syncInBackground: false });

  assert(mockFetchCallCount === 0, 'Zero-Spam: 0 files downloaded when remote SHA-256 hashes match local');

  // 3B: Delta Update Test (1 File Changed)
  let downloadedKeys: string[] = [];
  const modifiedManifest: VersionManifest = JSON.parse(JSON.stringify(currentLocalManifest));

  const baseDemo = JSON.parse(fs.readFileSync(path.join(publicDir, 'demographics.json'), 'utf8'));
  baseDemo.UKR.population = 42000000;
  const mockUpdatedDemographicsContent = JSON.stringify(baseDemo);
  const mockBuffer = new TextEncoder().encode(mockUpdatedDemographicsContent).buffer;
  const correctComputedHash = await CryptoResolver.computeSha256(mockBuffer);
  modifiedManifest.files.demographics.sha256 = correctComputedHash;

  class MockDeltaProvider extends GoogleDriveProvider {
    constructor() { super('mock_token'); }
    async fetchManifest(): Promise<VersionManifest | null> {
      return modifiedManifest;
    }
    async fetchFileContent(fileKey: any): Promise<ArrayBuffer | null> {
      downloadedKeys.push(fileKey);
      return mockBuffer;
    }
  }

  const deltaManager = new DataSyncManager();
  (deltaManager as any).remoteProvider = new MockDeltaProvider();
  await deltaManager.loadDataset(undefined, { syncInBackground: false });

  assert(downloadedKeys.length === 1 && downloadedKeys[0] === 'demographics',
    'Delta Update: Only the 1 modified file (demographics) was downloaded over network');
  assert(deltaManager.syncOrigin === 'remote_synced', 'syncOrigin marked as "remote_synced" after delta download');

  // -------------------------------------------------------
  // SCENARIO 4: SHA-256 Integrity Verification & Rollback
  // -------------------------------------------------------
  console.log(colors.bold(colors.yellow('\n▶ SCENARIO 4: SHA-256 Integrity Verification & Rollback')));

  const corruptManifest: VersionManifest = JSON.parse(JSON.stringify(currentLocalManifest));
  corruptManifest.files.indexes.sha256 = 'expected_sha256_hash_that_will_not_match';

  class MockCorruptProvider extends GoogleDriveProvider {
    constructor() { super('mock_token'); }
    async fetchManifest(): Promise<VersionManifest | null> {
      return corruptManifest;
    }
    async fetchFileContent(): Promise<ArrayBuffer | null> {
      return new TextEncoder().encode('{"corrupted": true}').buffer;
    }
  }

  const prevValidIndexes = await storageDB.getFile('indexes');
  const corruptTestManager = new DataSyncManager();
  (corruptTestManager as any).remoteProvider = new MockCorruptProvider();
  await corruptTestManager.loadDataset(undefined, { syncInBackground: false });

  const currentIndexesInDB = await storageDB.getFile('indexes');
  assert(currentIndexesInDB === prevValidIndexes,
    'Integrity Gate: Corrupted file was rejected and previous valid DB entry remained intact');

  // DataValidator failure on corrupted payload
  const badBundleValidation = DataValidator.validateBundle({
    geoJson: { type: 'FeatureCollection', features: [{ properties: { name: 'Invalid' } }] },
    religions: {},
    indexes: {},
    demographics: {},
  });
  assert(!badBundleValidation.valid && badBundleValidation.errors.length > 0,
    'DataValidator rejects invalid datasets with <150 countries');

  // -------------------------------------------------------
  // SCENARIO 5: Dynamic Custom Source
  // -------------------------------------------------------
  console.log(colors.bold(colors.yellow('\n▶ SCENARIO 5: Dynamic Custom Source')));

  const customManager = new DataSyncManager();
  const customUrl = 'https://drive.google.com/file/d/1CustomLink_112233445566/view';
  customManager.setCustomSource(customUrl);

  const storedInLocal = localStorage.getItem('terrametrics_custom_source');
  assert(storedInLocal !== null && !storedInLocal.includes('1CustomLink'),
    'Custom source is encrypted/obfuscated in localStorage');
  
  const decryptedSource = CryptoResolver.decodeObfuscated(storedInLocal!);
  assert(decryptedSource === customUrl, 'Decrypted localStorage custom source matches input URL');

  customManager.resetToDefaultSource();
  assert(localStorage.getItem('terrametrics_custom_source') === null,
    'resetToDefaultSource clears custom source from localStorage');

  // -------------------------------------------------------
  // SCENARIO 6: API Dispatcher, In-Flight Deduplication & LRU Cache
  // -------------------------------------------------------
  console.log(colors.bold(colors.yellow('\n▶ SCENARIO 6: API Dispatcher, In-Flight Deduplication & LRU Cache')));

  const apiManager = ApiSyncManager.getInstance();

  // 6A: Offline Mathematical Fallback
  setOnline(false);
  const mathWeather = await apiManager.getLiveWeather(50.45, 30.52);
  assert(mathWeather.isOffline === true && mathWeather.origin === 'math-fallback',
    'Offline mode triggers instant deterministic solar-orbital math fallback');
  assert(typeof mathWeather.temp === 'number' && typeof mathWeather.humidity === 'number',
    `Math weather values calculated: ${mathWeather.temp}°C, humidity ${mathWeather.humidity}%`);

  // 6B: In-Flight Request Deduplication
  setOnline(true);
  let weatherFetchCount = 0;
  
  (globalThis as any).fetch = async (url: any, init: any) => {
    const urlStr = url.toString();
    if (urlStr.includes('open-meteo.com')) {
      weatherFetchCount++;
      await new Promise((r) => setTimeout(r, 50)); // simulate 50ms latency
      return new Response(JSON.stringify({
        current: { temperature_2m: 22.4, relative_humidity_2m: 55, wind_speed_10m: 14 }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return originalFetch(url, init);
  };

  // Dispatch 10 parallel requests for the same coordinates simultaneously
  const parallelRequests = Array.from({ length: 10 }, () => apiManager.getLiveWeather(48.85, 2.35, true));
  const results = await Promise.all(parallelRequests);

  assert(weatherFetchCount === 1,
    `In-Flight Deduplication: 10 parallel requests triggered only 1 network fetch (actual: ${weatherFetchCount})`);
  assert(results[0].temp === 22, 'Weather response parsed correctly');

  // 6C: L1 In-Memory Cache (TTL)
  const cachedWeather = await apiManager.getLiveWeather(48.85, 2.35, false);
  assert(cachedWeather.origin === 'memory-cache', 'Subsequent call within TTL returned from memory-cache');

  // 6D: LRU Cache Eviction (Max 100 entries)
  for (let i = 0; i < 105; i++) {
    (apiManager as any).setCache(`test_key_${i}`, { val: i }, 60000);
  }
  const cacheSize = (apiManager as any).memoryCache.size;
  const oldestExists = (apiManager as any).memoryCache.has('test_key_0');
  const newestExists = (apiManager as any).memoryCache.has('test_key_104');

  assert(cacheSize === 100, `LRU Cache strictly caps at 100 entries (current size: ${cacheSize})`);
  assert(!oldestExists && newestExists, 'LRU correctly evicted oldest item (test_key_0) and kept newest');

  // -------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------
  console.log(colors.bold(colors.cyan('\n======================================================')));
  console.log(colors.bold(` 🏁 Test Suite Completed: ${colors.green(`${totalPassed} Passed`)}, ${totalFailed > 0 ? colors.red(`${totalFailed} Failed`) : '0 Failed'}`));
  console.log(colors.bold(colors.cyan('======================================================\n')));

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal Suite Execution Error:', err);
  process.exit(1);
});
