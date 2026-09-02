export type DatasetFileKey = 'countries' | 'demographics' | 'indexes' | 'religions';

export interface FileManifestEntry {
  fileName: string;
  sha256: string;
  sizeBytes: number;
  etag?: string;
  sourceId?: string; // Google Drive File ID or relative URI
  directUrl?: string; // Direct or generated download URL
}

export interface VersionManifest {
  version: string;
  datasetRelease: string;
  minAppVersion?: string;
  description?: string;
  files: Record<DatasetFileKey, FileManifestEntry>;
}

export interface SyncProgressUpdate {
  stage: 'manifest' | 'delta_download' | 'integrity_check' | 'storage_commit' | 'done' | 'fallback';
  fileKey?: DatasetFileKey;
  loadedBytes: number;
  totalBytes: number;
  percentage: number;
}

export type SyncProgressCallback = (progress: SyncProgressUpdate) => void;

export interface RemoteSourceConfig {
  providerType: 'gdrive' | 'cdn' | 'custom_json';
  manifestUrlOrId: string;
  apiKey?: string;
  authToken?: string;
  customBaseUrl?: string;
}

export interface IRemoteDataProvider {
  readonly providerId: string;
  fetchManifest(timeoutMs?: number): Promise<VersionManifest | null>;
  fetchFileContent(
    fileKey: DatasetFileKey,
    entry: FileManifestEntry,
    onProgress?: (pct: number) => void
  ): Promise<ArrayBuffer | null>;
}

export interface DatasetBundle {
  geoJson: any;
  religions: any;
  indexes: any;
  demographics: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
