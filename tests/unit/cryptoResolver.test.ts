import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CryptoResolver } from '../../src/data/sync/CryptoResolver.ts';
import { GoogleDriveResolver } from '../../src/data/sync/GoogleDriveResolver.ts';

// Web Crypto polyfill for Node test environment
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  (globalThis as any).crypto = crypto.webcrypto;
}

describe('CryptoResolver & GoogleDriveResolver Unit Tests', () => {
  it('encodes and decodes arbitrary strings with XOR + Base64Url symmetrically', () => {
    const samples = [
      'https://drive.google.com/file/d/12345ABCDE/view',
      'Український текст з емодзі 🌍🚀✨',
      'Simple String 12345 !@#$%^&*()',
      '{"files":{"countries":{"sha256":"abc123def456"}}}',
    ];

    for (const sample of samples) {
      const encoded = CryptoResolver.encodeObfuscated(sample);
      assert.notStrictEqual(encoded, sample);
      const decoded = CryptoResolver.decodeObfuscated(encoded);
      assert.strictEqual(decoded, sample, `Failed roundtrip for: ${sample}`);
    }
  });

  it('computes correct SHA-256 hex digest for ArrayBuffer', async () => {
    const text = 'TerraMetrics-3D deterministic data integrity gate';
    const buffer = new TextEncoder().encode(text).buffer;
    const computedHash = await CryptoResolver.computeSha256(buffer);

    const expectedHash = crypto.createHash('sha256').update(text).digest('hex');
    assert.strictEqual(computedHash.toLowerCase(), expectedHash.toLowerCase());
  });

  it('extracts Google Drive File IDs accurately across all standard link formats', () => {
    const rawId = '1_aBcDeFgHiJkLmNoPqRsTuVwXyZ99999';
    const testUrls = [
      rawId,
      `https://drive.google.com/file/d/${rawId}/view?usp=sharing`,
      `https://drive.google.com/open?id=${rawId}`,
      `https://drive.google.com/uc?id=${rawId}&export=download`,
      `https://drive.google.com/drive/folders/${rawId}`,
    ];

    for (const url of testUrls) {
      const extracted = GoogleDriveResolver.extractFileId(url);
      assert.strictEqual(extracted, rawId, `Failed extracting ID from: ${url}`);
    }
  });

  it('constructs direct download URLs with virus bypass parameters', () => {
    const fileId = '12345abcdef';
    const directUrl = GoogleDriveResolver.buildDirectDownloadUrl(fileId);

    assert.ok(directUrl.includes('id=12345abcdef'));
    assert.ok(directUrl.includes('confirm=t'));
    assert.ok(directUrl.includes('export=download'));
  });
});
