import { DEEP_SPACE_OBJECTS } from './src/map/DeepSpaceData.js';

console.log(`Total standalone objects: ${DEEP_SPACE_OBJECTS.length}`);

let allValid = true;
const ids = new Set();

DEEP_SPACE_OBJECTS.forEach(obj => {
  if (!obj.id) { console.error('Missing ID:', obj); allValid = false; }
  if (ids.has(obj.id)) { console.error('Duplicate ID:', obj.id); allValid = false; }
  ids.add(obj.id);
  
  if (!obj.name || !obj.name.en || !obj.name.uk) {
    console.error(`Invalid name for ${obj.id}`); allValid = false;
  }
  if (typeof obj.ra !== 'number' || typeof obj.dec !== 'number') {
    console.error(`Invalid coordinates for ${obj.id}`); allValid = false;
  }
  if (!obj.type) {
    console.error(`Missing type for ${obj.id}`); allValid = false;
  }
});

if (allValid) {
  console.log('✅ ALL OBJECTS ARE VALID AND READY FOR RENDERING!');
} else {
  console.error('❌ SOME OBJECTS HAVE ERRORS!');
  process.exit(1);
}
