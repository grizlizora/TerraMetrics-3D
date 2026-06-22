import https from 'https';
import fs from 'fs';

https.get('https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const stars = [];
    json.features.forEach(f => {
      if (f.properties.mag <= 5.5) {
         let ra = f.geometry.coordinates[0];
         let dec = f.geometry.coordinates[1];
         let mag = f.properties.mag;
         let bv = parseFloat(f.properties.bv || "0");
         stars.push([ra, dec, mag, bv]);
      }
    });
    fs.writeFileSync('src/map/starsData.js', `export const starsData = ${JSON.stringify(stars)};\n`);
    console.log(`Saved ${stars.length} stars to src/map/starsData.js`);
  });
}).on('error', err => console.error(err));
