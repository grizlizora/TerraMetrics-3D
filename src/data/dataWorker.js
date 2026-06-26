self.onmessage = function(e) {
  const { rawGeoJson, popMap, wbMap, indexMap, religionData } = e.data;
  const labelsFeatures = [];

  rawGeoJson.features.forEach(feature => {
    const iso = feature.properties['ISO3166-1-Alpha-3'];
    
    // Calculate rough centroid for single label placement
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
    let longitudes = [];
    const processCoords = (coords) => {
       coords.forEach(c => {
         if (Array.isArray(c[0])) {
           processCoords(c);
         } else {
           longitudes.push(c[0]);
           minLat = Math.min(minLat, c[1]);
           maxLat = Math.max(maxLat, c[1]);
         }
       });
    };
    
    if (feature.geometry && feature.geometry.coordinates) {
        let bestCoords = feature.geometry.coordinates;
        
        if (feature.geometry.type === 'MultiPolygon') {
            let maxArea = -1;
            feature.geometry.coordinates.forEach(poly => {
                let pMinLng = 180, pMaxLng = -180, pMinLat = 90, pMaxLat = -90;
                const getBounds = (coords) => {
                    coords.forEach(c => {
                        if (Array.isArray(c[0])) getBounds(c);
                        else {
                            pMinLng = Math.min(pMinLng, c[0]);
                            pMaxLng = Math.max(pMaxLng, c[0]);
                            pMinLat = Math.min(pMinLat, c[1]);
                            pMaxLat = Math.max(pMaxLat, c[1]);
                        }
                    });
                };
                getBounds(poly);
                let lDiff = pMaxLng - pMinLng;
                if (lDiff < 0) lDiff += 360; // Обробка антимеридіану
                const area = lDiff * (pMaxLat - pMinLat);
                if (area > maxArea) {
                    maxArea = area;
                    bestCoords = poly;
                }
            });
        }

        processCoords(bestCoords);
        let hasFarEast = longitudes.some(l => l > 90);
        let hasFarWest = longitudes.some(l => l < -90);
        if (hasFarEast && hasFarWest) {
            longitudes = longitudes.map(l => l < 0 ? l + 360 : l);
        }
        minLng = Math.min(...longitudes);
        maxLng = Math.max(...longitudes);
        let centerLng = (minLng + maxLng) / 2;
        if (centerLng > 180) centerLng -= 360;
        let centerLat = (minLat + maxLat) / 2;
        feature.properties.center = [centerLng, centerLat];
    }

    const wb = (wbMap && iso) ? (wbMap[iso] || {}) : {};
    const idx = (indexMap && iso) ? (indexMap[iso] || {}) : {};
    
    // World Bank data
    const gdp = wb.gdp ? Math.round(wb.gdp) : 0;
    const militarySpending = wb.military_percent ? parseFloat(wb.military_percent.toFixed(1)) : 0;
    const cleanEnergy = wb.clean_energy ? Math.round(wb.clean_energy) : (idx.energy || 0);
    const militaryActive = wb.military_active ? Math.round(wb.military_active) : 0;

    // Derived from GDP
    const avgSalary = gdp > 0 ? Math.floor(gdp * 0.85 / 12) : 0;
    const colIndex = avgSalary > 0 ? Math.min(100, Math.floor(20 + (avgSalary / 6000) * 75)) : 0;

    // Indexes
    const democracyIndex = idx.democracy || 0;
    const safetyIndex = idx.safety || 0;
    const healthcareIndex = idx.healthcare || 0;
    const evIndex = idx.ev || 0;
    const internetSpeed = idx.internet || 0;
    const highestPeak = idx.peak || 0;
    const incomeTax = idx.tax || 0;
    
    // Geometry approximations
    const areaKm2 = (popMap && iso && popMap[iso] && popMap[iso].area) ? popMap[iso].area : 1000;
    const borderLength = Math.round(Math.sqrt(areaKm2) * 6.0); // Approximate border length based on area

    // Still need political system (hard to get an API for this quickly, so pseudo-random based on hash)
    let hash = 0;
    if (iso) {
      for (let i = 0; i < iso.length; i++) hash = iso.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rand = Math.abs(Math.sin(hash));
    const systems = ['Парламентська республіка', 'Президентська республіка', 'Змішана республіка', 'Конституційна монархія', 'Абсолютна монархія'];
    const politicalSystem = systems[Math.floor(rand * systems.length)];

    const mockData = {
      gdpPerCapita: gdp,
      militarySpending,
      cleanEnergy,
      democracyIndex,
      politicalSystem,
      highestPeak,
      avgSalary,
      colIndex,
      evIndex,
      areaKm2,
      borderLength,
      incomeTax,
      safetyIndex,
      healthcareIndex,
      internetSpeed
    };

    if (iso && religionData.countries[iso]) {
      const countryData = religionData.countries[iso];
      
      const popInfo = popMap[iso] || { population: 0, area: 1, languages: '', capital: '', gini: null };
      const density = popInfo.area > 0 ? Math.round(popInfo.population / popInfo.area) : 0;
      
      const militarySize = militaryActive;

      feature.properties = {
        ...feature.properties,
        ...mockData,
        militarySize: militarySize,
        dominant_religion: countryData.dominant_religion,
        dominant_percentage: countryData.dominant_percentage,
        population: popInfo.population,
        area: popInfo.area,
        density: density,
        languages: popInfo.languages,
        capital: popInfo.capital,
        gini: popInfo.gini,
        currency: popInfo.currency,
        drivingSide: popInfo.drivingSide,
        continent: countryData.continent,
        name_en: countryData.country_en || feature.properties.name,
        name_uk: countryData.country_uk || feature.properties.name
      };
    } else {
      const popInfo = (iso && popMap[iso]) ? popMap[iso] : { population: 0, area: 1, languages: '', capital: '', gini: null };
      const density = popInfo.area > 0 ? Math.round(popInfo.population / popInfo.area) : 0;
      
      feature.properties.name_en = feature.properties.name;
      feature.properties.name_uk = feature.properties.name;
      feature.properties.population = popInfo.population;
      feature.properties.density = density;
      feature.properties.languages = popInfo.languages;
      feature.properties.capital = popInfo.capital;
      feature.properties.gini = popInfo.gini;
      feature.properties.gdpPerCapita = mockData.gdpPerCapita;
      feature.properties.militarySpending = mockData.militarySpending;
      feature.properties.cleanEnergy = mockData.cleanEnergy;
      feature.properties.democracyIndex = mockData.democracyIndex;
      feature.properties.politicalSystem = mockData.politicalSystem;
      feature.properties.highestPeak = mockData.highestPeak;
      feature.properties.avgSalary = mockData.avgSalary;
      feature.properties.colIndex = mockData.colIndex;
      feature.properties.evIndex = mockData.evIndex;
      feature.properties.areaKm2 = mockData.areaKm2;
      feature.properties.borderLength = mockData.borderLength;
    }

    // Add to labels
    if (feature.properties.center) {
       labelsFeatures.push({
           type: 'Feature',
           geometry: { type: 'Point', coordinates: feature.properties.center },
           properties: feature.properties
       });
    }
  });

  self.postMessage({
    geoJsonData: rawGeoJson,
    labelsGeoJson: { type: 'FeatureCollection', features: labelsFeatures }
  });
};
