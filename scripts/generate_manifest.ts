import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { VersionManifest, DatasetFileKey } from '../src/data/sync/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function generateManifest(): VersionManifest {
  const publicDir = path.resolve(__dirname, '../public');
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const files: Record<DatasetFileKey, string> = {
    countries: 'countries.geojson',
    demographics: 'demographics.json',
    indexes: 'indexes.json',
    religions: 'religions.json',
  };

  const manifest: VersionManifest = {
    version: packageJson.version || '2.0.0',
    datasetRelease: new Date().toISOString(),
    minAppVersion: '2.0.0',
    description: 'TerraMetrics-3D Production Geo & Demographics Dataset',
    files: {} as VersionManifest['files'],
  };

  let missingCount = 0;

  for (const [key, fileName] of Object.entries(files) as [DatasetFileKey, string][]) {
    const fullPath = path.join(publicDir, fileName);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const sha256 = computeSha256(fullPath);
      manifest.files[key] = {
        fileName,
        sha256,
        sizeBytes: stats.size,
        sourceId: '',
      };
      console.log(`  📦 ${fileName}: ${stats.size.toLocaleString()} bytes | sha256: ${sha256.substring(0, 16)}...`);
    } else {
      missingCount++;
      console.warn(`  ⚠️ Missing dataset file: ${fullPath}`);
    }
  }

  if (missingCount > 0) {
    console.error(`❌ Warning: ${missingCount} required dataset files were not found in ${publicDir}`);
  }

  const outputPath = path.join(publicDir, 'version.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ [TerraMetrics-3D] version.json successfully generated at:', outputPath);

  return manifest;
}

generateManifest();
