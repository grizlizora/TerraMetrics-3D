import fs from 'fs';
import path from 'path';

const srcPath = path.resolve(process.cwd(), 'src/service-worker.ts');
const outPath = path.resolve(process.cwd(), 'public/sw.js');

let src = fs.readFileSync(srcPath, 'utf8');

// Filter TS reference directives, declarations and types
const lines = src.split('\n').filter(line => !line.startsWith('/// <reference') && !line.startsWith('declare const self') && !line.startsWith('export {};'));
let cleanSrc = lines.join('\n')
  .replace(/\(event: ExtendableEvent\)/g, '(event)')
  .replace(/\(event: FetchEvent\)/g, '(event)')
  .replace(/\(err: unknown\)/g, '(err)')
  .replace(/\(keys: string\[\]\)/g, '(keys)')
  .replace(/: Promise<Response> \| Response/g, '')
  .replace(/STATIC_ASSETS: string\[\]/g, 'STATIC_ASSETS');

fs.writeFileSync(outPath, cleanSrc.trim() + '\n', 'utf8');
console.log('✅ [PWA] public/sw.js compiled from src/service-worker.ts');