self.onmessage = function(e) {
  const { rawGeoJson, popMap, religionData } = e.data;
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

    // Generate deterministic mock data based on ISO
    let hash = 0;
    if (iso) {
      for (let i = 0; i < iso.length; i++) hash = iso.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rand = Math.abs(Math.sin(hash));
    const systems = ['Парламентська республіка', 'Президентська республіка', 'Змішана республіка', 'Конституційна монархія', 'Абсолютна монархія'];
    const sysIndex = Math.floor(rand * systems.length);

    const gdp = Math.floor(rand * 60000 + 500);
    const avgSalary = Math.floor(gdp * 0.37 / 12);
    const colIndex = Math.floor(20 + (avgSalary / 5000) * 80);
    const evIndex = Math.floor(rand * 60 + 2);
    const areaKm2 = Math.floor(Math.abs(Math.sin(hash * 1.7)) * 8000000 + 2000);
    const borderLength = Math.floor(Math.abs(Math.sin(hash * 2.3)) * 8000 + 100);
    
    const incomeTax = Math.floor(Math.abs(Math.sin(hash * 4.1)) * 45 + 10);
    const safetyIndex = Math.floor(Math.abs(Math.sin(hash * 5.2)) * 60 + 35);
    const healthcareIndex = Math.floor(Math.abs(Math.sin(hash * 6.3)) * 60 + 30);
    const internetSpeed = Math.floor(Math.abs(Math.sin(hash * 7.4)) * 250 + 10);

    const mockData = {
      gdpPerCapita: gdp,
      militarySpending: parseFloat((rand * 4 + 0.5).toFixed(1)),
      cleanEnergy: Math.floor(rand * 90 + 5),
      democracyIndex: parseFloat((rand * 10).toFixed(1)),
      politicalSystem: systems[sysIndex],
      highestPeak: Math.floor(rand * 7000 + 1000),
      avgSalary,
      colIndex: Math.min(colIndex, 100),
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
      
      const milPercentage = (Math.abs(Math.sin(hash * 3.1)) * 1.3 + 0.2) / 100;
      const militarySize = Math.floor(popInfo.population * milPercentage);

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
