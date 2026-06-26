export class DataLoader {
  constructor() {
    this.geoJsonData = null;
    this.religionData = null;
  }

  async loadAll() {
    try {
      console.log('Loading datasets...');
      const [geoRes, relRes, idxRes] = await Promise.all([
        fetch('/countries.geojson'),
        fetch('/religions.json'),
        fetch('/indexes.json')
      ]);

      if (!geoRes.ok || !relRes.ok) {
        throw new Error('Failed to load local data files');
      }

      let rawGeoJson = await geoRes.json();
      this.religionData = await relRes.json();
      let indexMap = await idxRes.json();

      // Fetch Live Population & Demographics Data
      let popMap = {};
      try {
        let populationData = null;
        let cachedStr = null;
        let cacheTime = null;
        
        // Безпечне читання з sessionStorage
        try {
          cachedStr = sessionStorage.getItem('terra_metrics_popdata');
          cacheTime = sessionStorage.getItem('terra_metrics_popdata_time');
        } catch (e) {
          console.warn('LocalStorage is not available:', e);
        }
        
        // Cache valid for 7 days (604800000 ms)
        if (cachedStr && cacheTime && (Date.now() - parseInt(cacheTime)) < 604800000) {
           console.log('Using cached demographics data');
           try {
             populationData = JSON.parse(cachedStr);
           } catch(e) {
             console.warn('Failed to parse cached data, fetching new...', e);
           }
        } 
        
        if (!populationData) {
           console.log('Fetching live demographics data...');
           try {
             const popRes = await fetch('https://studies.cs.helsinki.fi/restcountries/api/all?fields=cca3,population,area,languages,capital,gini,currencies,car');
             if (popRes.ok) {
               populationData = await popRes.json();
               // Безпечний запис у sessionStorage
               try {
                 sessionStorage.setItem('terra_metrics_popdata', JSON.stringify(populationData));
                 sessionStorage.setItem('terra_metrics_popdata_time', Date.now().toString());
               } catch (e) {
                 console.warn('Failed to save to LocalStorage (quota exceeded?):', e);
               }
             } else {
               console.warn('Demographics API returned non-ok status:', popRes.status);
             }
           } catch(e) {
             console.error('Network error while fetching demographics:', e);
           }
        }

        if (populationData) {
          populationData.forEach(c => {
             let currencyStr = '';
             if (c.currencies) {
               const firstCur = Object.values(c.currencies)[0];
               if (firstCur) currencyStr = `${firstCur.name} ${firstCur.symbol ? '('+firstCur.symbol+')' : ''}`.trim();
             }
             popMap[c.cca3] = {
               population: c.population,
               area: c.area || 1, // запобігання діленню на 0
               languages: c.languages ? Object.values(c.languages).join(', ') : '',
               capital: c.capital && c.capital.length > 0 ? c.capital[0] : '',
               gini: c.gini ? Object.values(c.gini)[0] : null,
               currency: currencyStr,
               drivingSide: c.car && c.car.side ? c.car.side : ''
             };
          });
        }
      } catch (err) {
        console.warn('Failed to fetch live population data:', err);
      }

      // Filter out Antarctica (ISO_A3: ATA) to save GPU resources
      rawGeoJson.features = rawGeoJson.features.filter(f => f.properties['ISO3166-1-Alpha-3'] !== 'ATA');

      // Fetch World Bank Data
      const wbMap = await this.fetchWorldBankData();

      const labelsFeatures = [];

      // Merge religion data into geojson properties and calculate centroids for labels
      // Оптимізація: переносимо всі важкі розрахунки у фоновий Web Worker
      await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./processWorker.js', import.meta.url), { type: 'module' });
        
        worker.onmessage = (e) => {
          this.geoJsonData = e.data.geoJsonData;
          this.labelsGeoJson = e.data.labelsGeoJson;
          worker.terminate();
          resolve();
        };

        worker.onerror = (err) => {
          console.error('Worker error:', err);
          worker.terminate();
          reject(err);
        };

        worker.postMessage({
          rawGeoJson,
          popMap,
          wbMap,
          indexMap,
          religionData: this.religionData
        });
      });
      
      console.log('Datasets loaded and optimized successfully');
      return true;
    } catch (error) {
      console.error('Error loading data:', error);
      return false;
    }
  }

  async fetchWorldBankData() {
    let wbData = {};
    try {
      let cachedStr = null, cacheTime = null;
      try {
        cachedStr = sessionStorage.getItem('terra_wb_v4');
        cacheTime = sessionStorage.getItem('terra_wb_v4_time');
      } catch (e) {}

      if (cachedStr && cacheTime && (Date.now() - parseInt(cacheTime)) < 604800000) {
        console.log('Using cached World Bank data');
        return JSON.parse(cachedStr);
      }

      console.log('Fetching live World Bank data...');
      const indicators = [
        { key: 'gdp', id: 'NY.GDP.PCAP.CD' },
        { key: 'military_percent', id: 'MS.MIL.XPND.GD.ZS' },
        { key: 'military_active', id: 'MS.MIL.TOTL.P1' }
      ];

      for (const ind of indicators) {
        const res = await fetch(`https://api.worldbank.org/v2/country/all/indicator/${ind.id}?format=json&per_page=300&mrv=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data[1]) {
            data[1].forEach(item => {
              if (item.countryiso3code) {
                if (!wbData[item.countryiso3code]) wbData[item.countryiso3code] = {};
                if (item.value !== null) {
                  wbData[item.countryiso3code][ind.key] = item.value;
                }
              }
            });
          }
        }
      }

      try {
        sessionStorage.setItem('terra_wb_v4', JSON.stringify(wbData));
        sessionStorage.setItem('terra_wb_v4_time', Date.now().toString());
      } catch (e) {}

    } catch (e) {
      console.warn('Failed to fetch WB data', e);
    }
    return wbData;
  }

  getCountryStats(isoA3) {
    if (!this.religionData || !this.religionData.countries) return null;
    return this.religionData.countries[isoA3];
  }

  getContinentStats(continentName) {
    if (!this.religionData || !this.religionData.countries) return null;

    let totalPopulation = 0;
    const religionCounts = {};

    let name_uk = continentName;
    let name_en = continentName;
    
    const continentTranslations = {
      'World': { uk: 'Глобально (Світ)', en: 'Global (World)' },
      'Asia': { uk: 'Азія', en: 'Asia' },
      'Europe': { uk: 'Європа', en: 'Europe' },
      'Africa': { uk: 'Африка', en: 'Africa' },
      'North America': { uk: 'Північна Америка', en: 'North America' },
      'South America': { uk: 'Південна Америка', en: 'South America' },
      'Oceania': { uk: 'Океанія', en: 'Oceania' }
    };
    
    if (continentTranslations[continentName]) {
       name_uk = continentTranslations[continentName].uk;
       name_en = continentTranslations[continentName].en;
    }

    const isoCodes = [];

    for (const [iso, data] of Object.entries(this.religionData.countries)) {
      if (continentName === 'World' || data.continent === continentName) {
        isoCodes.push(iso);
        const pop = data.population || 0;
        totalPopulation += pop;
        
        if (data.stats) {
          data.stats.forEach(stat => {
            if (!religionCounts[stat.name]) religionCounts[stat.name] = 0;
            religionCounts[stat.name] += (stat.percentage / 100) * pop;
          });
        }
      }
    }

    if (totalPopulation === 0) return null;

    const aggregatedStats = [];
    let dominantReligion = '';
    let maxPercentage = 0;

    for (const [relName, count] of Object.entries(religionCounts)) {
      const percentage = (count / totalPopulation) * 100;
      aggregatedStats.push({
        name: relName,
        percentage: parseFloat(percentage.toFixed(1))
      });
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        dominantReligion = relName;
      }
    }

    aggregatedStats.sort((a, b) => b.percentage - a.percentage);

    // Map isoCodes to detailed data for new aggregations
    const countriesData = isoCodes.map(iso => {
      const relData = this.religionData.countries[iso];
      const feature = this.geoJsonData ? this.geoJsonData.features.find(f => f.properties['ISO3166-1-Alpha-3'] === iso) : null;
      const props = feature ? feature.properties : {};
      return {
        iso,
        name_uk: relData.country_uk,
        name_en: relData.country_en,
        population: relData.population || 0,
        gdp: props.gdpPerCapita || 0,
        democracy: props.democracyIndex || 0,
        military: props.militarySize || 0,
        area: props.area || props.areaKm2 || 0,
        borders: props.borderLength || 0,
        cleanEnergy: props.cleanEnergy || 0,
        ev: props.evIndex || 0,
        center: props.center || null,
        gini: props.gini || 0,
        currency: props.currency || null,
        drivingSide: props.drivingSide || null,
        incomeTax: props.incomeTax || 0,
        safetyIndex: props.safetyIndex || 0,
        healthcareIndex: props.healthcareIndex || 0,
        internetSpeed: props.internetSpeed || 0
      };
    });

    let sumGdp = 0, countGdp = 0;
    let sumDemoc = 0, countDemoc = 0;
    let sumClean = 0, countClean = 0;
    let sumEv = 0, countEv = 0;
    let totalMilitary = 0;
    let totalArea = 0;
    let totalBorders = 0;
    let sumGini = 0, countGini = 0;
    let rightDrive = 0, leftDrive = 0;
    let sumTax = 0, countTax = 0;
    let sumSafety = 0, countSafety = 0;
    let sumHealth = 0, countHealth = 0;
    let sumInternet = 0, countInternet = 0;
    const currencyCounts = {};

    countriesData.forEach(c => {
      if (c.gdp > 0) { sumGdp += c.gdp; countGdp++; }
      if (c.democracy > 0) { sumDemoc += c.democracy; countDemoc++; }
      if (c.military > 0) { totalMilitary += c.military; }
      if (c.area > 0) { totalArea += c.area; }
      if (c.borders > 0) { totalBorders += c.borders; }
      if (c.cleanEnergy > 0) { sumClean += c.cleanEnergy; countClean++; }
      if (c.ev > 0) { sumEv += c.ev; countEv++; }
      if (c.gini > 0) { sumGini += c.gini; countGini++; }
      if (c.incomeTax > 0) { sumTax += c.incomeTax; countTax++; }
      if (c.safetyIndex > 0) { sumSafety += c.safetyIndex; countSafety++; }
      if (c.healthcareIndex > 0) { sumHealth += c.healthcareIndex; countHealth++; }
      if (c.internetSpeed > 0) { sumInternet += c.internetSpeed; countInternet++; }
      
      if (c.currency) {
        const curs = c.currency.split(',').map(s => s.trim()).filter(Boolean);
        curs.forEach(cur => { currencyCounts[cur] = (currencyCounts[cur] || 0) + 1; });
      }
      
      if (c.drivingSide === 'right') rightDrive++;
      else if (c.drivingSide === 'left') leftDrive++;
    });

    // Top 5 lists
    const topPopulated = [...countriesData].sort((a, b) => b.population - a.population).slice(0, 5);
    const topEconomy = [...countriesData].filter(c => c.gdp > 0).sort((a, b) => b.gdp - a.gdp).slice(0, 5);
    const topDemocracy = [...countriesData].filter(c => c.democracy > 0).sort((a, b) => b.democracy - a.democracy).slice(0, 5);
    const topMilitary = [...countriesData].filter(c => c.military > 0).sort((a, b) => b.military - a.military).slice(0, 5);
    const topArea = [...countriesData].filter(c => c.area > 0).sort((a, b) => b.area - a.area).slice(0, 5);
    const topEv = [...countriesData].filter(c => c.ev > 0).sort((a, b) => b.ev - a.ev).slice(0, 5);
    const topGini = [...countriesData].filter(c => c.gini > 0).sort((a, b) => b.gini - a.gini).slice(0, 5);
    const topTax = [...countriesData].filter(c => c.incomeTax > 0).sort((a, b) => a.incomeTax - b.incomeTax).slice(0, 5); // Lowest taxes!
    const topSafety = [...countriesData].filter(c => c.safetyIndex > 0).sort((a, b) => b.safetyIndex - a.safetyIndex).slice(0, 5);
    const topHealth = [...countriesData].filter(c => c.healthcareIndex > 0).sort((a, b) => b.healthcareIndex - a.healthcareIndex).slice(0, 5);
    const topInternet = [...countriesData].filter(c => c.internetSpeed > 0).sort((a, b) => b.internetSpeed - a.internetSpeed).slice(0, 5);

    const topCurrencies = Object.entries(currencyCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalDrive = rightDrive + leftDrive;
    const rightDrivePct = totalDrive > 0 ? Math.round((rightDrive / totalDrive) * 100) : 0;
    const leftDrivePct = totalDrive > 0 ? Math.round((leftDrive / totalDrive) * 100) : 0;

    // Get coordinates of Top 10 largest countries for Climate average request
    const climateCoords = [...countriesData]
      .filter(c => c.area > 0 && c.center)
      .sort((a, b) => b.area - a.area)
      .slice(0, 10)
      .map(c => c.center);

    return {
      name_uk: name_uk,
      name_en: name_en,
      dominant_religion: dominantReligion,
      dominant_percentage: parseFloat(maxPercentage.toFixed(1)),
      total_population: totalPopulation,
      stats: aggregatedStats,
      top_populated: topPopulated,
      isoCodes: isoCodes,
      
      // New Stats
      avgGdp: countGdp > 0 ? Math.round(sumGdp / countGdp) : 0,
      avgDemocracy: countDemoc > 0 ? parseFloat((sumDemoc / countDemoc).toFixed(2)) : 0,
      totalMilitary: totalMilitary,
      totalArea: totalArea,
      totalBorders: totalBorders,
      avgCleanEnergy: countClean > 0 ? Math.round(sumClean / countClean) : 0,
      avgEv: countEv > 0 ? Math.round(sumEv / countEv) : 0,
      avgGini: countGini > 0 ? parseFloat((sumGini / countGini).toFixed(1)) : 0,
      avgTax: countTax > 0 ? Math.round(sumTax / countTax) : 0,
      avgSafety: countSafety > 0 ? Math.round(sumSafety / countSafety) : 0,
      avgHealth: countHealth > 0 ? Math.round(sumHealth / countHealth) : 0,
      avgInternet: countInternet > 0 ? Math.round(sumInternet / countInternet) : 0,
      rightDrivePct,
      leftDrivePct,
      
      // New Top Lists
      topEconomy,
      topDemocracy,
      topMilitary,
      topArea,
      topEv,
      topGini,
      topTax,
      topSafety,
      topHealth,
      topInternet,
      topCurrencies,
      climateCoords
    };
  }
  
  searchCountries(query) {
    if (!query || !this.religionData) return [];
    query = query.toLowerCase();
    
    const results = [];
    for (const [iso, data] of Object.entries(this.religionData.countries)) {
      if (data.country && data.country.toLowerCase().includes(query)) {
        results.push({
          iso: iso,
          name: data.country
        });
      }
    }
    return results;
  }

  getGeoJson() {
    return this.geoJsonData;
  }
}
