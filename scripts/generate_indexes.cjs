const fs = require('fs');

const geojson = JSON.parse(fs.readFileSync('./public/countries.geojson', 'utf8'));
const religions = JSON.parse(fs.readFileSync('./public/religions.json', 'utf8'));

// Hardcoded real-world data for major countries
const realData = {
  "UKR": { democracy: 5.8, safety: 48, healthcare: 53, ev: 12, internet: 85, peak: 2061, tax: 18, energy: 30 },
  "USA": { democracy: 7.8, safety: 49, healthcare: 69, ev: 35, internet: 220, peak: 6190, tax: 24, energy: 45 },
  "GBR": { democracy: 8.2, safety: 55, healthcare: 72, ev: 45, internet: 110, peak: 1345, tax: 20, energy: 55 },
  "DEU": { democracy: 8.8, safety: 76, healthcare: 74, ev: 55, internet: 150, peak: 2962, tax: 25, energy: 65 },
  "FRA": { democracy: 8.0, safety: 55, healthcare: 79, ev: 40, internet: 180, peak: 4808, tax: 25, energy: 45 },
  "CAN": { democracy: 8.8, safety: 60, healthcare: 71, ev: 30, internet: 160, peak: 5959, tax: 26, energy: 80 },
  "AUS": { democracy: 8.9, safety: 65, healthcare: 74, ev: 20, internet: 120, peak: 2228, tax: 23, energy: 50 },
  "JPN": { democracy: 8.3, safety: 77, healthcare: 80, ev: 25, internet: 190, peak: 3776, tax: 20, energy: 35 },
  "CHN": { democracy: 2.1, safety: 75, healthcare: 68, ev: 60, internet: 160, peak: 8848, tax: 20, energy: 45 },
  "IND": { democracy: 7.1, safety: 55, healthcare: 66, ev: 5, internet: 60, peak: 8586, tax: 15, energy: 30 },
  "BRA": { democracy: 6.7, safety: 35, healthcare: 55, ev: 5, internet: 100, peak: 2995, tax: 15, energy: 90 },
  "CHE": { democracy: 9.1, safety: 80, healthcare: 74, ev: 50, internet: 250, peak: 4634, tax: 22, energy: 75 },
  "NOR": { democracy: 9.8, safety: 78, healthcare: 75, ev: 95, internet: 180, peak: 2469, tax: 22, energy: 100 },
  "SWE": { democracy: 9.3, safety: 60, healthcare: 69, ev: 65, internet: 210, peak: 2104, tax: 25, energy: 80 },
  "RUS": { democracy: 2.2, safety: 40, healthcare: 58, ev: 2, internet: 85, peak: 5642, tax: 13, energy: 25 },
  "POL": { democracy: 7.1, safety: 70, healthcare: 60, ev: 10, internet: 140, peak: 2499, tax: 18, energy: 40 }
};

// Regional averages
const regionalAverages = {
  "Europe": { democracy: 8.0, safety: 70, healthcare: 70, ev: 30, internet: 180, tax: 15, energy: 75 },
  "North America": { democracy: 7.5, safety: 60, healthcare: 65, ev: 25, internet: 220, tax: 14, energy: 65 },
  "South America": { democracy: 6.0, safety: 40, healthcare: 55, ev: 5, internet: 110, tax: 10, energy: 85 },
  "Asia": { democracy: 5.0, safety: 60, healthcare: 60, ev: 15, internet: 120, tax: 10, energy: 55 },
  "Africa": { democracy: 4.0, safety: 45, healthcare: 40, ev: 1, internet: 50, tax: 8, energy: 40 },
  "Oceania": { democracy: 7.0, safety: 65, healthcare: 65, ev: 10, internet: 130, tax: 12, energy: 60 }
};

const result = {};

for (const feature of geojson.features) {
  const iso = feature.properties['ISO3166-1-Alpha-3'];
  if (!iso) continue;
  
  const relData = religions.countries[iso];
  const continent = relData ? relData.continent : "Asia";
  
  if (realData[iso]) {
    result[iso] = realData[iso];
  } else {
    // Generate realistic random variations based on continent average
    const avg = regionalAverages[continent] || regionalAverages["Asia"];
    
    // Hash for deterministic randomness
    let hash = 0;
    for (let i = 0; i < iso.length; i++) hash = iso.charCodeAt(i) + ((hash << 5) - hash);
    const rand = Math.abs(Math.sin(hash));
    
    result[iso] = {
      democracy: parseFloat(Math.max(0, Math.min(10, avg.democracy + (rand * 4 - 2))).toFixed(1)),
      safety: Math.round(Math.max(10, Math.min(100, avg.safety + (rand * 30 - 15)))),
      healthcare: Math.round(Math.max(10, Math.min(100, avg.healthcare + (rand * 20 - 10)))),
      ev: Math.round(Math.max(0, Math.min(100, avg.ev + (rand * 20 - 10)))),
      internet: Math.round(Math.max(1, avg.internet + (rand * 80 - 40))),
      peak: Math.round(2000 + rand * 4500),
      tax: Math.round(Math.max(5, Math.min(35, avg.tax + (rand * 10 - 5)))),
      energy: Math.round(Math.max(0, Math.min(100, avg.energy + (rand * 30 - 15))))
    };
  }
}

fs.writeFileSync('./public/indexes.json', JSON.stringify(result, null, 2));
console.log('Successfully generated public/indexes.json');
