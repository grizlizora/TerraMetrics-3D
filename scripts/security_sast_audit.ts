// scripts/security_sast_audit.ts: Automated SAST Security & Reliability Audit
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { CryptoResolver } from '../src/data/sync/CryptoResolver.ts';
import { DataValidator } from '../src/data/sync/DataValidator.ts';

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'android') continue;
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      getAllSourceFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export async function runSecuritySastAudit(): Promise<boolean> {
  console.log('======================================================================');
  console.log(' 🛡️  TerraMetrics-3D: Static Application Security Testing (SAST)');
  console.log('======================================================================');

  let passed = true;
  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✔ PASS: ${msg}`);
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      passed = false;
    }
  };

  const srcDir = resolve(process.cwd(), 'src');
  const allFiles = getAllSourceFiles(srcDir);
  console.log(`  ℹ Сканування ${allFiles.length} вихідних файлів проекту...`);

  // 1. Check for Insecure Protocol Links (HTTP without SSL)
  let httpLeaks = 0;
  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const httpMatches = content.match(/http:\/\/(?!localhost|127\.0\.0\.1|schemas\.opengis\.net)/g);
    if (httpMatches) {
      httpLeaks += httpMatches.length;
    }
  }
  assert(httpLeaks === 0, `Secure Protocols: 0 незахищених посилань 'http://' (знайдено: ${httpLeaks})`);

  // 2. Check for Dangerous JavaScript Execution (eval / Function constructor)
  let dangerousEval = 0;
  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    if (/\beval\s*\(/.test(content) || /new\s+Function\s*\(/.test(content)) {
      dangerousEval++;
    }
  }
  assert(dangerousEval === 0, `Code Injection Protection: 0 викликів 'eval()' або 'new Function()'`);

  // 3. Cryptographic Obfuscation Roundtrip & Entropy Invariant
  const testUrls = [
    'https://drive.google.com/uc?export=download&id=1test_abcXYZ_123',
    'https://api.terrametrics.io/v2/manifest.json?token=secret123',
    'Український Текст & 🌍 Емодзі в URL',
  ];

  let cryptoOk = true;
  for (const url of testUrls) {
    const encoded = CryptoResolver.encodeObfuscated(url);
    const decoded = CryptoResolver.decodeObfuscated(encoded);
    if (decoded !== url || encoded.includes('http://') || encoded.includes('drive.google.com')) {
      cryptoOk = false;
      break;
    }
  }
  assert(cryptoOk, 'Crypto Invariant: XOR+Base64Url обфускація є надійною, обо Ambrosial та приховує відкриті URL');

  // 4. Input Validation & No-Throw Boundary Invariant
  const nullValidation = DataValidator.validateBundle(null);
  const emptyValidation = DataValidator.validateBundle({ geoJson: { type: 'FeatureCollection', features: [] } } as any);

  assert(
    nullValidation.valid === false && emptyValidation.valid === false,
    'Data Gatekeeper: Валідатор безпечно відхиляє аномальні або пошкоджені пакети даних'
  );

  console.log('======================================================================');
  if (passed) {
    console.log(' 🏁 SAST Аудит Безпеки: 100% УСПІХ (Жодної вразливості не виявлено)');
  } else {
    console.error(' ❌ SAST Аудит Безпеки: ВИЯВЛЕНО ВРАЗЛИВОСТІ');
  }
  console.log('======================================================================\n');

  return passed;
}

runSecuritySastAudit().then((ok) => {
  if (!ok) process.exit(1);
});
