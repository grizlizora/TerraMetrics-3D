export class UIManager {
  constructor(dataLoader, mapEngine, i18n) {
    this.dataLoader = dataLoader;
    this.mapEngine = mapEngine;
    this.i18n = i18n;

    // UI Elements
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.btn3d = document.getElementById('btn-3d');
    this.btn2d = document.getElementById('btn-2d');
    this.btnTheme = document.getElementById('btn-theme');
    this.statsPanel = document.getElementById('stats-panel');
    this.panelCloseBtn = document.getElementById('panel-close');
    
    this.countryView = document.getElementById('country-view');
    this.continentView = document.getElementById('continent-view');
    this.instruction = document.getElementById('instruction');
    
    // Search Tabs
    this.tabCountries = document.getElementById('tab-countries');
    this.tabContinents = document.getElementById('tab-continents');
    this.searchMode = 'countries'; // 'countries' | 'continents'
    
    this.currentViewMode = 'continent'; // 'continent' | 'country'
    this.currentActiveItem = 'World'; // id of the current item
    this.activeMode = 'religion'; // 'religion' | 'population'

    this.setupEvents();
  }
  setupEvents() {
    // Global Categories Switcher
    const catSociety = document.getElementById('cat-society');
    const catState = document.getElementById('cat-state');
    const catNature = document.getElementById('cat-nature');
    
    const subSociety = document.getElementById('submodes-society');
    const subState = document.getElementById('submodes-state');
    const subNature = document.getElementById('submodes-nature');

    if (catSociety && catState && catNature) {
      const resetGlobalCats = () => {
        [catSociety, catState, catNature].forEach(el => el.classList.remove('active'));
        [subSociety, subState, subNature].forEach(el => { if(el) el.style.display = 'none'; });
      };

      catSociety.addEventListener('click', () => {
        resetGlobalCats();
        catSociety.classList.add('active');
        if(subSociety) subSociety.style.display = 'flex';
        document.getElementById('mode-religion').click();
      });

      catState.addEventListener('click', () => {
        resetGlobalCats();
        catState.classList.add('active');
        if(subState) subState.style.display = 'flex';
        document.getElementById('mode-economy').click();
      });

      catNature.addEventListener('click', () => {
        resetGlobalCats();
        catNature.classList.add('active');
        if(subNature) subNature.style.display = 'flex';
        document.getElementById('mode-climate').click();
      });
    }

    // Submodes Switcher
    const submodeBtns = document.querySelectorAll('.submode-btn');
    if (submodeBtns.length > 0) {
      const resetSubmodes = () => {
        submodeBtns.forEach(btn => btn.classList.remove('active'));
      };

      submodeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          resetSubmodes();
          btn.classList.add('active');
          const modeId = btn.id.replace('mode-', ''); // e.g., 'religion', 'economy'
          this.activeMode = modeId;
          if(this.mapEngine.setLayerMode) this.mapEngine.setLayerMode(modeId);
          this.refreshCurrentView();
        });
      });
    }

    // Logo Click -> Global Stats
    const logo = document.querySelector('.logo');
    if (logo) {
      logo.addEventListener('click', () => {
        this.mapEngine.clearSelection();
        this.showContinentStats("World");
      });
    }

    // Space Switcher
    const spaceNone = document.getElementById('btn-space-none');
    const spaceBasic = document.getElementById('btn-space-basic');
    const spaceAdvanced = document.getElementById('btn-space-advanced');
    
    if (spaceNone && spaceBasic && spaceAdvanced) {
      const resetSpaceButtons = () => {
        spaceNone.classList.remove('active');
        spaceBasic.classList.remove('active');
        spaceAdvanced.classList.remove('active');
      };

      const updateLabelsButtonState = (mode) => {
        const labelsContainer = document.getElementById('labels-container');
        const deepSpaceContainer = document.getElementById('deep-space-container');
        
        if (labelsContainer) {
          if (mode === 'advanced') {
            labelsContainer.style.opacity = '1';
            labelsContainer.style.pointerEvents = 'auto';
          } else {
            labelsContainer.style.opacity = '0.4';
            labelsContainer.style.pointerEvents = 'none';
          }
        }
        
        if (deepSpaceContainer) {
          deepSpaceContainer.style.opacity = '1';
          deepSpaceContainer.style.pointerEvents = 'auto';
        }
      };

      spaceNone.addEventListener('click', () => {
        resetSpaceButtons();
        spaceNone.classList.add('active');
        if (this.mapEngine.spaceEngine) {
          this.mapEngine.spaceEngine.setMode('none');
          this.mapEngine.spaceEngine.setLabelsVisible(false); // Примусово вимикаємо позначки
          const btnDeepSpace = document.getElementById('btn-deep-space');
          if (btnDeepSpace) {
            this.mapEngine.spaceEngine.setDeepSpaceVisible(btnDeepSpace.classList.contains('active'));
          }
          if (this.mapEngine.map) this.mapEngine.map.triggerRepaint();
        }
        updateLabelsButtonState('none');
      });

      spaceBasic.addEventListener('click', () => {
        resetSpaceButtons();
        spaceBasic.classList.add('active');
        if (this.mapEngine.spaceEngine) {
          this.mapEngine.spaceEngine.setMode('basic');
          this.mapEngine.spaceEngine.setLabelsVisible(false); // Примусово вимикаємо позначки
          
          const btnDeepSpace = document.getElementById('btn-deep-space');
          if (btnDeepSpace) {
            this.mapEngine.spaceEngine.setDeepSpaceVisible(btnDeepSpace.classList.contains('active'));
          }
          if (this.mapEngine.map) this.mapEngine.map.triggerRepaint();
        }
        updateLabelsButtonState('basic');
      });

      spaceAdvanced.addEventListener('click', () => {
        resetSpaceButtons();
        spaceAdvanced.classList.add('active');
        if (this.mapEngine.spaceEngine) {
          this.mapEngine.spaceEngine.setMode('advanced');
          const btnLabels = document.getElementById('btn-space-labels');
          if (btnLabels) {
            this.mapEngine.spaceEngine.setLabelsVisible(btnLabels.classList.contains('active'));
          }
          const btnDeepSpace = document.getElementById('btn-deep-space');
          if (btnDeepSpace) {
            this.mapEngine.spaceEngine.setDeepSpaceVisible(btnDeepSpace.classList.contains('active'));
          }
          if (this.mapEngine.map) this.mapEngine.map.triggerRepaint();
        }
        updateLabelsButtonState('advanced');
      });
      
      // Ініціалізуємо початковий стан
      updateLabelsButtonState('none');
    }

    // Labels Switcher
    const spaceLabels = document.getElementById('btn-space-labels');
    if (spaceLabels) {
      spaceLabels.addEventListener('click', () => {
        const isActive = spaceLabels.classList.contains('active');
        if (isActive) {
          spaceLabels.classList.remove('active');
          if (this.mapEngine.spaceEngine) {
            this.mapEngine.spaceEngine.setLabelsVisible(false);
            if (this.mapEngine.map) this.mapEngine.map.triggerRepaint();
          }
        } else {
          spaceLabels.classList.add('active');
          if (this.mapEngine.spaceEngine) {
            this.mapEngine.spaceEngine.setLabelsVisible(true);
            if (this.mapEngine.map) this.mapEngine.map.triggerRepaint();
          }
        }
      });
    }

    // Deep Space Switcher
    const deepSpaceBtn = document.getElementById('btn-deep-space');
    if (deepSpaceBtn) {
      deepSpaceBtn.addEventListener('click', () => {
        const isActive = deepSpaceBtn.classList.contains('active');
        if (isActive) {
          deepSpaceBtn.classList.remove('active');
          if (this.mapEngine.spaceEngine) {
            this.mapEngine.spaceEngine.setDeepSpaceVisible(false);
            if (this.mapEngine.map) this.mapEngine.map.triggerRepaint();
          }
        } else {
          deepSpaceBtn.classList.add('active');
          if (this.mapEngine.spaceEngine) {
            this.mapEngine.spaceEngine.setDeepSpaceVisible(true);
            if (this.mapEngine.map) this.mapEngine.map.triggerRepaint();
          }
        }
      });
    }

    // 3D / 2D Switch
    const spaceSwitcher = document.getElementById('space-switcher');
    
    this.btn3d.addEventListener('click', () => {
      this.btn3d.classList.add('active');
      this.btn2d.classList.remove('active');
      this.mapEngine.setProjection('globe');
      if (spaceSwitcher) spaceSwitcher.style.opacity = '1';
      if (spaceSwitcher) spaceSwitcher.style.pointerEvents = 'auto';
      
      // Скидання космосу до "Вимкнено" при переході в 3D (згідно з вимогою)
      const spaceNoneBtn = document.getElementById('btn-space-none');
      if (spaceNoneBtn) spaceNoneBtn.click();
    });

    this.btn2d.addEventListener('click', () => {
      this.btn2d.classList.add('active');
      this.btn3d.classList.remove('active');
      this.mapEngine.setProjection('mercator');
      if (spaceSwitcher) spaceSwitcher.style.opacity = '0';
      if (spaceSwitcher) spaceSwitcher.style.pointerEvents = 'none';
    });

    // Theme Toggle
    if (this.btnTheme) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.btnTheme.textContent = isDark ? '☀️' : '🌙';
      
      this.btnTheme.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.btnTheme.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Скидання космосу до "Вимкнено" при зміні теми
        const spaceNoneBtn = document.getElementById('btn-space-none');
        if (spaceNoneBtn) spaceNoneBtn.click();
      });
    }


    // Close Stats Panel
    this.panelCloseBtn.addEventListener('click', () => {
      this.statsPanel.classList.add('hidden');
      this.mapEngine.clearSelection();
    });

    // Search Tabs
    this.tabCountries.addEventListener('click', () => {
      this.searchMode = 'countries';
      this.tabCountries.classList.add('active');
      this.tabContinents.classList.remove('active');
      this.searchInput.value = '';
      this.searchResults.classList.add('hidden');
    });
    
    this.tabContinents.addEventListener('click', () => {
      this.searchMode = 'continents';
      this.tabContinents.classList.add('active');
      this.tabCountries.classList.remove('active');
      this.searchInput.value = '';
      this.searchResults.classList.add('hidden');
    });

    // Search Input
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (query.trim().length === 0) {
        this.searchResults.classList.add('hidden');
        return;
      }
      
      const results = this.performSearch(query);
      this.renderSearchResults(results);
    });

    // Hide search results on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.searchResults.classList.add('hidden');
      }
    });
  }

  performSearch(query) {
    const q = query.toLowerCase();
    const lang = this.i18n.currentLanguage;
    const nameField = lang === 'uk' ? 'name_uk' : 'name_en';
    
    if (this.searchMode === 'countries') {
      const countries = this.dataLoader.religionData.countries;
      return Object.entries(countries)
        .map(([iso, data]) => ({ iso, name: lang === 'uk' ? data.country_uk : data.country_en }))
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 8);
    } else {
      const continents = [
        { id: 'World', name_uk: 'Глобально (Світ)', name_en: 'Global (World)' },
        { id: 'Asia', name_uk: 'Азія', name_en: 'Asia' },
        { id: 'Europe', name_uk: 'Європа', name_en: 'Europe' },
        { id: 'Africa', name_uk: 'Африка', name_en: 'Africa' },
        { id: 'North America', name_uk: 'Північна Америка', name_en: 'North America' },
        { id: 'South America', name_uk: 'Південна Америка', name_en: 'South America' },
        { id: 'Oceania', name_uk: 'Океанія', name_en: 'Oceania' }
      ];
      return continents
        .map(c => ({ id: c.id, name: lang === 'uk' ? c.name_uk : c.name_en }))
        .filter(c => c.name.toLowerCase().includes(q));
    }
  }

  renderSearchResults(results) {
    this.searchResults.innerHTML = '';
    if (results.length === 0) {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.textContent = this.i18n.getText('not_found');
      this.searchResults.appendChild(div);
      this.searchResults.classList.remove('hidden');
      return;
    }

    results.forEach(res => {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.textContent = res.name;
      div.addEventListener('click', () => {
        this.searchInput.value = '';
        this.searchResults.classList.add('hidden');
        this.searchInput.blur();
        
        if (this.searchMode === 'countries') {
          this.mapEngine.flyToCountry(res.iso, this.dataLoader.getGeoJson());
          this.showCountryStats(res.iso, res.name);
        } else {
          this.mapEngine.flyToContinent(res.id, this.dataLoader.getGeoJson());
          this.showContinentStats(res.id);
        }
      });
      this.searchResults.appendChild(div);
    });
    this.searchResults.classList.remove('hidden');
  }
  
  refreshCurrentView() {
    if (this.currentViewMode === 'country') {
      this.showCountryStats(this.currentActiveItem);
    } else {
      this.showContinentStats(this.currentActiveItem);
    }
  }

  showCountryStats(isoA3, fallbackName = '') {
    const stats = this.dataLoader.getCountryStats(isoA3);
    if (!stats) return;
    
    this.currentViewMode = 'country';
    this.currentActiveItem = isoA3;

    this.instruction.style.display = 'none'; // hide instruction
    this.statsPanel.classList.remove('hidden');
    
    // Explicitly manage display
    this.countryView.style.display = 'block';
    this.continentView.style.display = 'none';

    const lang = this.i18n.currentLanguage;
    const name = lang === 'uk' ? stats.country_uk : stats.country_en;
    
    // Translate continent name
    const continentObj = this.dataLoader.religionData.continents[stats.continent];
    const continentName = continentObj ? (lang === 'uk' ? continentObj.name_uk : continentObj.name_en) : stats.continent;

    document.getElementById('country-name').textContent = name || fallbackName;
    document.getElementById('country-continent').textContent = continentName;
    
    if (this.activeMode === 'religion') {
      document.querySelector('#country-view .dominant-card h3').textContent = this.i18n.getText('dominant_religion');
      document.getElementById('dominant-religion').textContent = this.i18n.getText(stats.dominant_religion) || stats.dominant_religion;
      document.getElementById('dominant-percentage').textContent = `${stats.dominant_percentage}%`;
      document.querySelector('#country-view .stats-list h3').textContent = this.i18n.getText('religion_distribution');
      const list = document.getElementById('religion-list');
      this.renderStatsList(list, stats.stats);
    } else if (this.activeMode === 'population') {
      document.querySelector('#country-view .dominant-card h3').textContent = this.i18n.getText('population');
      document.getElementById('dominant-religion').textContent = (stats.population || 0).toLocaleString();
      document.getElementById('dominant-percentage').textContent = "";
      document.querySelector('#country-view .stats-list h3').textContent = this.i18n.getText('pop_stats');
      const list = document.getElementById('religion-list');
      list.innerHTML = `<li><div class="stat-name">${this.i18n.getText('pop_segment')}</div><div class="stat-value">${this.getPopulationSegment(stats.population)}</div></li>`;
    } else if (this.activeMode === 'demographics') {
      // Find the country feature in geoJson to get raw properties
      const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
      const props = feature ? feature.properties : {};

      document.querySelector('#country-view .dominant-card h3').textContent = this.i18n.getText('density');
      document.getElementById('dominant-religion').textContent = (props.density || 0).toLocaleString();
      document.getElementById('dominant-percentage').textContent = "";
      document.querySelector('#country-view .stats-list h3').textContent = this.i18n.getText('demographics_stats');
      
      const list = document.getElementById('religion-list');
      const renderRow = (label, value) => `
        <li style="flex-direction: row; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
           <span style="color: var(--text-secondary); font-size: 0.95em;">${label}</span>
           <span style="font-weight: 500; text-align: right; max-width: 55%; word-break: break-word; line-height: 1.3;">${value}</span>
        </li>
      `;
      
      const renderGiniRow = (label, giniVal) => {
        if (!giniVal) return renderRow(label, '-');
        
        let color = '#e53935'; // Red (bad, > 50)
        if (giniVal < 30) color = '#4caf50'; // Green (good, < 30)
        else if (giniVal < 40) color = '#ffb300'; // Yellow (medium)
        else if (giniVal < 50) color = '#fb8c00'; // Orange (high)

        return `
        <li style="flex-direction: column; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
           <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
             <span style="color: var(--text-secondary); font-size: 0.95em;">${label}</span>
             <span style="font-weight: 700; color: ${color}; text-align: right;">${giniVal.toFixed(1)}</span>
           </div>
           <div class="stat-bar-container" style="height: 0.375rem; background: rgba(255,255,255,0.1);">
             <div class="stat-bar" style="width: ${giniVal}%; background: ${color}; border-radius: 0.25rem;"></div>
           </div>
        </li>
        `;
      };

      list.innerHTML = 
        renderRow(this.i18n.getText('capital'), props.capital || '-') +
        renderRow(this.i18n.getText('languages'), props.languages || '-') +
        renderRow(this.i18n.getText('currency'), props.currency || '-') +
        renderGiniRow(this.i18n.getText('gini'), props.gini) +
        renderRow(this.i18n.currentLanguage === 'uk' ? 'Рівень медицини' : 'Healthcare Index', props.healthcareIndex ? `${props.healthcareIndex}/100` : '-') +
        renderRow(this.i18n.getText('driving_side'), props.drivingSide ? this.i18n.getText(props.drivingSide) : '-');
      
      // Останньому елементу прибираємо border-bottom
      if (list.lastElementChild) {
         list.lastElementChild.style.borderBottom = 'none';
         list.lastElementChild.style.marginBottom = '0';
         list.lastElementChild.style.paddingBottom = '0';
      }
    } else if (this.activeMode === 'economy') {
      const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
      const props = feature ? feature.properties : {};

      document.querySelector('#country-view .dominant-card h3').textContent = this.i18n.currentLanguage === 'uk' ? 'ВВП на душу населення' : 'GDP per Capita';
      document.getElementById('dominant-religion').textContent = props.gdpPerCapita ? `$${props.gdpPerCapita.toLocaleString()}` : (this.i18n.currentLanguage === 'uk' ? 'Невідомо' : 'Unknown');
      document.getElementById('dominant-percentage').textContent = '';
      document.querySelector('#country-view .stats-list h3').textContent = this.i18n.currentLanguage === 'uk' ? 'Економіка' : 'Economy';
      
      const list = document.getElementById('religion-list');
      const salary = props.avgSalary || 0;
      const col = props.colIndex || 0;
      const isUk = this.i18n.currentLanguage === 'uk';
      
      // CoL color: green=cheap, red=expensive
      let colColor = '#2ecc71';
      if (col > 60) colColor = '#e74c3c';
      else if (col > 35) colColor = '#f39c12';

      list.innerHTML = `
        <li>
          <div class="stat-name">${isUk ? 'Середня зарплата' : 'Avg. Salary'}</div>
          <div class="stat-value" style="color: #2ecc71; font-weight: 700;">~$${salary.toLocaleString()}<span style="font-size:0.8em; color: var(--text-secondary);">/міс</span></div>
        </li>
        <li style="flex-direction: column; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="color: var(--text-secondary); font-size: 0.95em;">${isUk ? 'Індекс вартості життя' : 'Cost of Living Index'}</span>
            <span style="font-weight: 700; color: ${colColor};">${col}/100</span>
          </div>
          <div style="height: 0.375rem; background: rgba(255,255,255,0.1); border-radius: 0.25rem;">
            <div style="width: ${col}%; background: ${colColor}; border-radius: 0.25rem; height: 100%;"></div>
          </div>
          <div style="font-size: 0.8em; color: var(--text-secondary); margin-top: 0.25rem;">${col < 35 ? (isUk ? '🟢 Доступне' : '🟢 Affordable') : col > 60 ? (isUk ? '🔴 Дорого' : '🔴 Expensive') : (isUk ? '🟡 Середньо' : '🟡 Moderate')}</div>
        </li>
        <li style="flex-direction: column; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="color: var(--text-secondary); font-size: 0.95em;">${isUk ? 'Податок на доходи' : 'Income Tax'}</span>
            <span style="font-weight: 700; color: #e74c3c;">${props.incomeTax || 0}%</span>
          </div>
        </li>
      `;
    } else if (this.activeMode === 'military') {
      const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
      const props = feature ? feature.properties : {};

      document.querySelector('#country-view .dominant-card h3').textContent = "Військовий бюджет";
      document.getElementById('dominant-religion').textContent = props.militarySpending ? `${props.militarySpending}% від ВВП` : "Невідомо";
      document.getElementById('dominant-percentage').textContent = "";
      document.querySelector('#country-view .stats-list h3').textContent = "Армія";
      
      const list = document.getElementById('religion-list');
      const activeSize = props.militarySize ? props.militarySize.toLocaleString() : '0';
      list.innerHTML = `<li><div class="stat-name">Активний склад</div><div class="stat-value">~${activeSize}</div></li>`;
    } else if (this.activeMode === 'resources') {
      const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
      const props = feature ? feature.properties : {};
      const isUk = this.i18n.currentLanguage === 'uk';

      document.querySelector('#country-view .dominant-card h3').textContent = isUk ? 'Чиста енергія' : 'Clean Energy';
      document.getElementById('dominant-religion').textContent = props.cleanEnergy ? `${props.cleanEnergy}%` : (isUk ? 'Невідомо' : 'Unknown');
      document.getElementById('dominant-percentage').textContent = '';
      document.querySelector('#country-view .stats-list h3').textContent = isUk ? 'Енергетика' : 'Energy';
      
      const list = document.getElementById('religion-list');
      const ev = props.evIndex || 0;
      const clean = props.cleanEnergy || 0;

      list.innerHTML = `
        <li style="flex-direction: column; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="color: var(--text-secondary); font-size: 0.95em;">🌱 ${isUk ? 'Відновлювана енергія' : 'Clean Energy %'}</span>
            <span style="font-weight: 700; color: #2ecc71;">${clean}%</span>
          </div>
          <div style="height: 0.375rem; background: rgba(255,255,255,0.1); border-radius: 0.25rem; margin-bottom: 0.75rem;">
            <div style="width: ${clean}%; background: #2ecc71; border-radius: 0.25rem; height: 100%;"></div>
          </div>
        </li>
        <li style="flex-direction: column; padding-bottom: 0.75rem; margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="color: var(--text-secondary); font-size: 0.95em;">⚡ ${isUk ? 'Електротранспорт (EV Індекс)' : 'EV Transport Index'}</span>
            <span style="font-weight: 700; color: #3498db;">${ev}%</span>
          </div>
          <div style="height: 0.375rem; background: rgba(255,255,255,0.1); border-radius: 0.25rem;">
            <div style="width: ${ev}%; background: linear-gradient(90deg, #3498db, #2ecc71); border-radius: 0.25rem; height: 100%;"></div>
          </div>
          <div style="font-size: 0.78em; color: var(--text-secondary); margin-top: 0.3125rem; margin-bottom: 0.75rem;">${isUk ? 'вантажівки, автобуси, вантажівки на електротязі' : 'trucks, buses, freight on electric drive'}</div>
        </li>
        <li style="flex-direction: column; padding-bottom: 0.75rem; margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="color: var(--text-secondary); font-size: 0.95em;">🌐 ${isUk ? 'Швидкість Інтернету' : 'Avg Internet Speed'}</span>
            <span style="font-weight: 700; color: #9b59b6;">${props.internetSpeed || 0} ${isUk ? 'Мбіт/с' : 'Mbps'}</span>
          </div>
        </li>
      `;
    } else if (this.activeMode === 'climate') {
      const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
      const props = feature ? feature.properties : {};
      const isUk = this.i18n.currentLanguage === 'uk';

      document.querySelector('#country-view .dominant-card h3').textContent = isUk ? 'Клімат (Поточний)' : 'Current Climate';
      document.getElementById('dominant-religion').innerHTML = `<span style="opacity: 0.2;">...</span>`;
      document.getElementById('dominant-percentage').textContent = '';
      document.querySelector('#country-view .stats-list h3').textContent = isUk ? 'Погода' : 'Weather';

      const list = document.getElementById('religion-list');
      const lat = props.center ? props.center[1] : 0;
      const lng = props.center ? props.center[0] : 0;

      list.innerHTML = `
        <li id="li-wind" style="opacity: 0.1; transition: opacity 0.3s ease;">
          <div class="stat-name">💨 ${isUk ? 'Вітер' : 'Wind'}</div>
          <div class="stat-value" id="val-wind">...</div>
        </li>
        <li id="li-humidity" style="opacity: 0.1; transition: opacity 0.3s ease;">
          <div class="stat-name">💧 ${isUk ? 'Вологість' : 'Humidity'}</div>
          <div class="stat-value" id="val-humidity">...</div>
        </li>
        <li style="border-bottom: none; padding-bottom: 0; margin-bottom: 0;">
          <button id="btn-climate-details" style="width: 100%; padding: 0.625rem; background: var(--accent-color); color: white; border: none; border-radius: 0.75rem; cursor: pointer; font-weight: bold; margin-top: 0.25rem;">
            📊 ${isUk ? 'Детальніше про клімат' : 'Detailed Climate'}
          </button>
        </li>
      `;

      // KEY FIX: attach click via requestAnimationFrame — ES module safe
      requestAnimationFrame(() => {
        const btn = document.getElementById('btn-climate-details');
        if (btn) {
          btn.addEventListener('click', () => {
            if (window.showClimateModal) {
              window.showClimateModal(isoA3, name, lat, lng);
            }
          });
        }
      });

      // Fetch temperature + wind + humidity in one call
      if (props.center) {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`)
          .then(r => r.json())
          .then(data => {
            if (data && data.current) {
              const { temperature_2m: temp, wind_speed_10m: wind, relative_humidity_2m: hum } = data.current;
              document.getElementById('dominant-religion').textContent = `${temp > 0 ? '+' : ''}${temp}°C`;
              const windEl = document.getElementById('val-wind');
              const humEl = document.getElementById('val-humidity');
              if (windEl) { windEl.textContent = `${wind} ${isUk ? 'км/год' : 'km/h'}`; document.getElementById('li-wind').style.opacity = '1'; }
              if (humEl) { humEl.textContent = `${hum}%`; document.getElementById('li-humidity').style.opacity = '1'; }
            } else {
              document.getElementById('dominant-religion').textContent = isUk ? 'Немає даних' : 'No data';
            }
          })
          .catch(() => {
            document.getElementById('dominant-religion').textContent = isUk ? 'Помилка API' : 'API Error';
          });
      } else {
        document.getElementById('dominant-religion').textContent = isUk ? 'Немає координат' : 'No coordinates';
      }

    } else if (this.activeMode === 'politics') {
      const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
      const props = feature ? feature.properties : {};

      document.querySelector('#country-view .dominant-card h3').textContent = "Політичний устрій";
      document.getElementById('dominant-religion').textContent = props.politicalSystem || "Невідомо";
      document.getElementById('dominant-percentage').textContent = "";
      document.querySelector('#country-view .stats-list h3').textContent = "Індекси";
      
      const list = document.getElementById('religion-list');
      
      const index = props.democracyIndex || 0;
      let color = '#d73027'; // red
      if (index > 4) color = '#fee08b'; // yellow
      if (index > 7) color = '#1a9850'; // green

      list.innerHTML = `
        <li style="flex-direction: column; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
           <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
             <span style="color: var(--text-secondary); font-size: 0.95em;">Індекс демократії (0-10)</span>
             <span style="font-weight: 700; color: ${color}; text-align: right;">${index}</span>
           </div>
           <div class="stat-bar-container" style="height: 0.375rem; background: rgba(255,255,255,0.1);">
             <div class="stat-bar" style="width: ${index * 10}%; background: ${color}; border-radius: 0.25rem;"></div>
           </div>
        </li>
        <li style="flex-direction: column; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
           <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
             <span style="color: var(--text-secondary); font-size: 0.95em;">${this.i18n.currentLanguage === 'uk' ? 'Індекс безпеки' : 'Safety Index'} (0-100)</span>
             <span style="font-weight: 700; color: ${(props.safetyIndex || 0) > 60 ? '#2ecc71' : ((props.safetyIndex || 0) > 40 ? '#f1c40f' : '#e74c3c')}; text-align: right;">${props.safetyIndex || 0}</span>
           </div>
           <div class="stat-bar-container" style="height: 0.375rem; background: rgba(255,255,255,0.1);">
             <div class="stat-bar" style="width: ${props.safetyIndex || 0}%; background: ${(props.safetyIndex || 0) > 60 ? '#2ecc71' : ((props.safetyIndex || 0) > 40 ? '#f1c40f' : '#e74c3c')}; border-radius: 0.25rem;"></div>
           </div>
        </li>
      `;
    } else if (this.activeMode === 'geography') {
      const feature = this.dataLoader.getGeoJson().features.find(f => f.properties['ISO3166-1-Alpha-3'] === isoA3);
      const props = feature ? feature.properties : {};
      const isUk = this.i18n.currentLanguage === 'uk';

      document.querySelector('#country-view .dominant-card h3').textContent = isUk ? 'Найвища точка' : 'Highest Point';
      document.getElementById('dominant-religion').textContent = props.highestPeak ? `${props.highestPeak.toLocaleString()} ${isUk ? 'м' : 'm'}` : (isUk ? 'Невідомо' : 'Unknown');
      document.getElementById('dominant-percentage').textContent = '';
      document.querySelector('#country-view .stats-list h3').textContent = isUk ? 'Територія' : 'Territory';
      
      const list = document.getElementById('religion-list');
      const area = (props.area || props.areaKm2 || 0).toLocaleString();
      const borders = (props.borderLength || 0).toLocaleString();

      list.innerHTML = `
        <li>
          <div class="stat-name">🛡️ ${isUk ? 'Площа країни' : 'Country Area'}</div>
          <div class="stat-value">${area} ${isUk ? 'км²' : 'km²'}</div>
        </li>
        <li>
          <div class="stat-name">🟦 ${isUk ? 'Довжина кордонів' : 'Border Length'}</div>
          <div class="stat-value">${borders} ${isUk ? 'км' : 'km'}</div>
        </li>
      `;
    }
  }

  getPopulationSegment(pop) {
    if (!pop) return this.i18n.getText('unknown') || "Невідомо";
    const lang = this.i18n.currentLanguage;
    if (lang === 'uk') {
        if (pop > 100000000) return "Понад 100 млн";
        if (pop > 50000000) return "Від 50 до 100 млн";
        if (pop > 10000000) return "Від 10 до 50 млн";
        if (pop > 1000000) return "Від 1 до 10 млн";
        return "Менше 1 млн";
    } else {
        if (pop > 100000000) return "> 100M";
        if (pop > 50000000) return "50M - 100M";
        if (pop > 10000000) return "10M - 50M";
        if (pop > 1000000) return "1M - 10M";
        return "< 1M";
    }
  }

  showContinentStats(continentId) {
    const stats = this.dataLoader.getContinentStats(continentId);
    if (!stats) return;
    
    this.currentViewMode = 'continent';
    this.currentActiveItem = continentId;

    this.instruction.style.display = 'none';
    this.statsPanel.classList.remove('hidden');
    
    // Explicitly manage display
    this.countryView.style.display = 'none';
    this.continentView.style.display = 'block';

    const lang = this.i18n.currentLanguage;
    const name = lang === 'uk' ? stats.name_uk : stats.name_en;

    document.getElementById('continent-name').textContent = name;
    
    if (this.activeMode === 'religion') {
      document.querySelector('#continent-view .dominant-card h3').textContent = this.i18n.getText('dominant_religion');
      document.getElementById('cont-dominant-religion').textContent = this.i18n.getText(stats.dominant_religion) || stats.dominant_religion;
      document.getElementById('cont-dominant-percentage').textContent = `${stats.dominant_percentage}%`;
      document.querySelector('#continent-view .stats-list h3').textContent = this.i18n.getText('religion_distribution');
      const list = document.getElementById('cont-religion-list');
      this.renderStatsList(list, stats.stats);
    } else if (this.activeMode === 'population') {
      document.querySelector('#continent-view .dominant-card h3').textContent = this.i18n.getText('total_pop');
      document.getElementById('cont-dominant-religion').textContent = (stats.total_population || 0).toLocaleString();
      document.getElementById('cont-dominant-percentage').textContent = "";
      document.querySelector('#continent-view .stats-list h3').textContent = this.i18n.getText('pop_stats');
      const list = document.getElementById('cont-religion-list');
      list.innerHTML = '';
      if (stats.top_populated) {
        stats.top_populated.forEach(c => {
          const cName = lang === 'uk' ? c.name_uk : c.name_en;
          list.innerHTML += `<li><div class="stat-name">${cName}</div><div class="stat-value">${c.population.toLocaleString()}</div></li>`;
        });
      }
    } else if (this.activeMode === 'demographics') {
      const isUk = lang === 'uk';
      document.querySelector('#continent-view .dominant-card h3').textContent = isUk ? 'Середня Щільність' : 'Avg Density';
      
      const avgDensity = stats.totalArea > 0 ? Math.round(stats.total_population / stats.totalArea) : 0;
      document.getElementById('cont-dominant-religion').textContent = `${avgDensity} ${isUk ? 'осіб/км²' : 'ppl/km²'}`;
      document.getElementById('cont-dominant-religion').style.color = 'var(--text-color)';
      document.getElementById('cont-dominant-percentage').textContent = "";
      document.querySelector('#continent-view .stats-list h3').textContent = isUk ? 'Культура та Суспільство' : 'Culture & Society';
      
      const list = document.getElementById('cont-religion-list');
      list.innerHTML = '';
      
      // Top Currencies
      if (stats.topCurrencies && stats.topCurrencies.length > 0) {
        list.innerHTML += `<li style="flex-direction: column; align-items: flex-start; padding-bottom: 0.75rem; border-bottom: 1px solid var(--glass-border);">
          <div style="font-weight:bold; color:var(--text-secondary); margin-bottom: 0.5rem;">${isUk ? 'Розподіл валют (Топ)' : 'Currency Distribution'}</div>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
            ${stats.topCurrencies.map(c => `
              <span style="background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 0.25rem 0.625rem; border-radius: 1rem; font-size: 0.85em; display: inline-flex; align-items: center; gap: 0.375rem; box-shadow: 0 2px 0.25rem rgba(0,0,0,0.1);">
                ${c.name} <span style="background: rgba(46, 204, 113, 0.15); color: #2ecc71; padding: 2px 0.375rem; border-radius: 0.625rem; font-weight: bold; font-size: 0.9em;">${c.count}</span>
              </span>
            `).join('')}
          </div>
        </li>`;
      }
      
      // Driving Side
      if (stats.rightDrivePct > 0 || stats.leftDrivePct > 0) {
        list.innerHTML += `<li style="flex-direction: column; align-items: flex-start; padding-bottom: 0.75rem; border-bottom: 1px solid var(--glass-border);">
          <div style="font-weight:bold; color:var(--text-secondary); margin-bottom: 0.5rem;">${isUk ? 'Рух транспорту' : 'Driving Side'}</div>
          <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:0.25rem;">
            <span style="font-size:0.9em; display:flex; align-items:center; gap:0.25rem;"><div style="width:0.5rem; height:0.5rem; border-radius:50%; background:#3498db;"></div> ${isUk ? 'Правосторонній' : 'Right-hand'}</span>
            <span style="font-weight:bold; color:#3498db;">${stats.rightDrivePct}%</span>
          </div>
          <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:0.5rem;">
            <span style="font-size:0.9em; display:flex; align-items:center; gap:0.25rem;"><div style="width:0.5rem; height:0.5rem; border-radius:50%; background:#e74c3c;"></div> ${isUk ? 'Лівосторонній' : 'Left-hand'}</span>
            <span style="font-weight:bold; color:#e74c3c;">${stats.leftDrivePct}%</span>
          </div>
          <div style="width:100%; height:0.375rem; border-radius:0.1875rem; display:flex; overflow:hidden; background:rgba(255,255,255,0.05);">
            <div style="width:${stats.rightDrivePct}%; background:#3498db;" title="Right-hand"></div>
            <div style="width:${stats.leftDrivePct}%; background:#e74c3c;" title="Left-hand"></div>
          </div>
        </li>`;
      }
      
      // Average Gini & Top 5
      if (stats.avgGini > 0) {
         let avgColor = '#e53935';
         if (stats.avgGini < 30) avgColor = '#4caf50';
         else if (stats.avgGini < 40) avgColor = '#ffb300';
         else if (stats.avgGini < 50) avgColor = '#fb8c00';

         list.innerHTML += `<li style="flex-direction: column; align-items: flex-start; padding-bottom: 0.5rem;">
          <div style="font-weight:bold; color:var(--text-secondary); margin-bottom: 0.5rem; display:flex; justify-content:space-between; width:100%; align-items:center;">
            <span>${isUk ? 'Індекс нерівності (Gini)' : 'Gini Index'}</span>
            <span style="color:${avgColor}; font-size:1.1em;">Сер: ${stats.avgGini}</span>
          </div>
          <div style="width:100%; font-size:0.85em; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px;">${isUk ? 'Топ-5 з найвищою нерівністю' : 'Highest Inequality Top 5'}</div>
          <div style="width:100%; display:flex; flex-direction:column; gap:0.375rem;">
            ${stats.topGini.map((c, i) => {
               let cColor = '#e53935';
               if (c.gini < 30) cColor = '#4caf50';
               else if (c.gini < 40) cColor = '#ffb300';
               else if (c.gini < 50) cColor = '#fb8c00';
               const cName = isUk ? c.name_uk : c.name_en;
               return `
                 <div style="display:flex; align-items:center; background:rgba(255,255,255,0.02); padding:0.25rem 0.5rem; border-radius:0.375rem; border:1px solid rgba(255,255,255,0.05);">
                   <span style="width:1.5rem; font-weight:bold; color:var(--text-secondary);">${i+1}.</span>
                   <span style="flex:1; font-size:0.95em;">${cName}</span>
                   <span style="background:rgba(255,255,255,0.05); padding:2px 0.5rem; border-radius:0.75rem; color:${cColor}; font-weight:bold; font-size:0.9em; box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);">${c.gini}</span>
                 </div>
               `;
            }).join('')}
          </div>
        </li>`;
      }
      
      // Average Health & Top 5
      if (stats.avgHealth > 0) {
         list.innerHTML += `<li style="flex-direction: column; align-items: flex-start; padding-top: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border);">
          <div style="font-weight:bold; color:var(--text-secondary); margin-bottom: 0.5rem; display:flex; justify-content:space-between; width:100%; align-items:center;">
            <span>${isUk ? 'Рівень медицини' : 'Healthcare Index'}</span>
            <span style="color:#2ecc71; font-size:1.1em;">Сер: ${stats.avgHealth}/100</span>
          </div>
          <div style="width:100%; font-size:0.85em; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px;">${isUk ? 'Топ-5 найкращої медицини' : 'Top 5 Healthcare'}</div>
          <div style="width:100%; display:flex; flex-direction:column; gap:0.375rem;">
            ${stats.topHealth.map((c, i) => {
               const cName = isUk ? c.name_uk : c.name_en;
               return `
                 <div style="display:flex; align-items:center; background:rgba(255,255,255,0.02); padding:0.25rem 0.5rem; border-radius:0.375rem; border:1px solid rgba(255,255,255,0.05);">
                   <span style="width:1.5rem; font-weight:bold; color:var(--text-secondary);">${i+1}.</span>
                   <span style="flex:1; font-size:0.95em;">${cName}</span>
                   <span style="background:rgba(255,255,255,0.05); padding:2px 0.5rem; border-radius:0.75rem; color:#2ecc71; font-weight:bold; font-size:0.9em; box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);">${c.healthcareIndex}</span>
                 </div>
               `;
            }).join('')}
          </div>
        </li>`;
      }
    } else if (this.activeMode === 'economy') {
      const isUk = lang === 'uk';
      document.querySelector('#continent-view .dominant-card h3').textContent = isUk ? 'Середній ВВП на душу' : 'Avg GDP per Capita';
      document.getElementById('cont-dominant-religion').textContent = stats.avgGdp ? `$${stats.avgGdp.toLocaleString()}` : (isUk ? 'Невідомо' : 'Unknown');
      document.getElementById('cont-dominant-religion').style.color = 'var(--text-color)';
      document.getElementById('cont-dominant-percentage').textContent = "";
      document.querySelector('#continent-view .stats-list h3').textContent = isUk ? 'Топ-5 Економік' : 'Top 5 Economies';
      const list = document.getElementById('cont-religion-list');
      list.innerHTML = '';
      if (stats.topEconomy) {
        stats.topEconomy.forEach(c => {
          const cName = lang === 'uk' ? c.name_uk : c.name_en;
          list.innerHTML += `<li><div class="stat-name">${cName}</div><div class="stat-value">$${c.gdp.toLocaleString()}</div></li>`;
        });
      }
      
      if (stats.topTax && stats.topTax.length > 0) {
        list.innerHTML += `<li style="flex-direction: column; padding-top: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border);">
          <div style="font-weight:bold; color:var(--text-secondary); margin-bottom: 0.5rem; display:flex; justify-content:space-between; width:100%; align-items:center;">
            <span>${isUk ? 'Податок на доходи' : 'Income Tax'}</span>
            <span style="color:#e74c3c; font-size:1.1em;">Сер: ${stats.avgTax}%</span>
          </div>
          <div style="width:100%; font-size:0.85em; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px;">${isUk ? 'Топ-5 за найнижчими податками' : 'Top 5 Lowest Taxes'}</div>
          <div style="width:100%; display:flex; flex-direction:column; gap:0.375rem;">
            ${stats.topTax.map((c, i) => {
               const cName = isUk ? c.name_uk : c.name_en;
               return `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:0.25rem 0.5rem; border-radius:0.375rem;">
                 <span style="font-size:0.95em;"><span style="color:var(--text-secondary); font-weight:bold; width:1.5rem; display:inline-block;">${i+1}.</span> ${cName}</span>
                 <span style="color:#e74c3c; font-weight:bold;">${c.incomeTax}%</span>
               </div>`;
            }).join('')}
          </div>
        </li>`;
      }
    } else if (this.activeMode === 'politics') {
      const isUk = lang === 'uk';
      document.querySelector('#continent-view .dominant-card h3').textContent = isUk ? 'Сер. Індекс Демократії' : 'Avg Democracy Index';
      
      let demColor = '#3498db';
      if (stats.avgDemocracy >= 8) demColor = '#2ecc71';
      else if (stats.avgDemocracy >= 6) demColor = '#f39c12';
      else if (stats.avgDemocracy > 0) demColor = '#e74c3c';
      
      document.getElementById('cont-dominant-religion').textContent = stats.avgDemocracy ? stats.avgDemocracy : '-';
      document.getElementById('cont-dominant-religion').style.color = stats.avgDemocracy ? demColor : 'var(--text-color)';
      document.getElementById('cont-dominant-percentage').textContent = "";
      document.querySelector('#continent-view .stats-list h3').textContent = isUk ? 'Топ-5 Демократій' : 'Top 5 Democracies';
      const list = document.getElementById('cont-religion-list');
      list.innerHTML = '';
      if (stats.topDemocracy) {
        stats.topDemocracy.forEach(c => {
          const cName = lang === 'uk' ? c.name_uk : c.name_en;
          let cColor = '#3498db';
          if (c.democracy >= 8) cColor = '#2ecc71';
          else if (c.democracy >= 6) cColor = '#f39c12';
          else if (c.democracy > 0) cColor = '#e74c3c';
          list.innerHTML += `<li><div class="stat-name">${cName}</div><div class="stat-value" style="color:${cColor}; font-weight:bold;">${c.democracy}</div></li>`;
        });
      }
      
      if (stats.topSafety && stats.topSafety.length > 0) {
        list.innerHTML += `<li style="flex-direction: column; padding-top: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border);">
          <div style="font-weight:bold; color:var(--text-secondary); margin-bottom: 0.5rem; display:flex; justify-content:space-between; width:100%; align-items:center;">
            <span>${isUk ? 'Індекс безпеки' : 'Safety Index'}</span>
            <span style="color:${stats.avgSafety > 60 ? '#2ecc71' : (stats.avgSafety > 40 ? '#f1c40f' : '#e74c3c')}; font-size:1.1em;">Сер: ${stats.avgSafety}</span>
          </div>
          <div style="width:100%; font-size:0.85em; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px;">${isUk ? 'Топ-5 найбезпечніших країн' : 'Top 5 Safest Countries'}</div>
          <div style="width:100%; display:flex; flex-direction:column; gap:0.375rem;">
            ${stats.topSafety.map((c, i) => {
               const cName = isUk ? c.name_uk : c.name_en;
               return `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:0.25rem 0.5rem; border-radius:0.375rem;">
                 <span style="font-size:0.95em;"><span style="color:var(--text-secondary); font-weight:bold; width:1.5rem; display:inline-block;">${i+1}.</span> ${cName}</span>
                 <span style="color:#2ecc71; font-weight:bold;">${c.safetyIndex}</span>
               </div>`;
            }).join('')}
          </div>
        </li>`;
      }
    } else if (this.activeMode === 'military') {
      const isUk = lang === 'uk';
      document.querySelector('#continent-view .dominant-card h3').textContent = isUk ? 'Загальна Армія' : 'Total Military';
      document.getElementById('cont-dominant-religion').textContent = stats.totalMilitary ? stats.totalMilitary.toLocaleString() : '0';
      document.getElementById('cont-dominant-religion').style.color = 'var(--text-color)';
      document.getElementById('cont-dominant-percentage').textContent = "";
      document.querySelector('#continent-view .stats-list h3').textContent = isUk ? 'Топ-5 Армій' : 'Top 5 Militaries';
      const list = document.getElementById('cont-religion-list');
      list.innerHTML = '';
      if (stats.topMilitary) {
        stats.topMilitary.forEach(c => {
          const cName = lang === 'uk' ? c.name_uk : c.name_en;
          list.innerHTML += `<li><div class="stat-name">${cName}</div><div class="stat-value">${c.military.toLocaleString()}</div></li>`;
        });
      }
    } else if (this.activeMode === 'geography') {
      const isUk = lang === 'uk';
      document.querySelector('#continent-view .dominant-card h3').textContent = isUk ? 'Загальна Площа' : 'Total Area';
      document.getElementById('cont-dominant-religion').textContent = stats.totalArea ? `${stats.totalArea.toLocaleString()} ${isUk ? 'км²' : 'km²'}` : '0';
      document.getElementById('cont-dominant-religion').style.color = 'var(--text-color)';
      document.getElementById('cont-dominant-percentage').textContent = "";
      document.querySelector('#continent-view .stats-list h3').textContent = isUk ? 'Топ-5 за Площею' : 'Top 5 by Area';
      const list = document.getElementById('cont-religion-list');
      list.innerHTML = '';
      if (stats.topArea) {
        stats.topArea.forEach(c => {
          const cName = lang === 'uk' ? c.name_uk : c.name_en;
          list.innerHTML += `<li><div class="stat-name">${cName}</div><div class="stat-value">${c.area.toLocaleString()} ${isUk ? 'км²' : 'km²'}</div></li>`;
        });
      }
    } else if (this.activeMode === 'resources') {
      const isUk = lang === 'uk';
      document.querySelector('#continent-view .dominant-card h3').textContent = isUk ? 'Сер. Чиста Енергія' : 'Avg Clean Energy';
      document.getElementById('cont-dominant-religion').textContent = stats.avgCleanEnergy ? `${stats.avgCleanEnergy}%` : '0%';
      document.getElementById('cont-dominant-religion').style.color = 'var(--text-color)';
      document.getElementById('cont-dominant-percentage').textContent = "";
      document.querySelector('#continent-view .stats-list h3').textContent = isUk ? 'Топ-5 за Еко-Транспортом' : 'Top 5 by EV Transport';
      const list = document.getElementById('cont-religion-list');
      list.innerHTML = '';
      if (stats.topEv) {
        stats.topEv.forEach(c => {
          const cName = lang === 'uk' ? c.name_uk : c.name_en;
          list.innerHTML += `
            <li style="flex-direction: column; padding-bottom: 0.5rem;">
              <div style="display:flex; justify-content:space-between; width:100%; margin-bottom: 0.25rem;">
                <span class="stat-name">${cName}</span>
                <span style="font-weight:bold; color:#3498db;">${c.ev}%</span>
              </div>
              <div style="width:100%; height:0.25rem; background:rgba(255,255,255,0.1); border-radius:2px;">
                <div style="width:${c.ev}%; height:100%; background:linear-gradient(90deg, #3498db, #2ecc71); border-radius:2px;"></div>
              </div>
            </li>`;
        });
      }
      
      if (stats.topInternet && stats.topInternet.length > 0) {
        list.innerHTML += `<li style="flex-direction: column; padding-top: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border);">
          <div style="font-weight:bold; color:var(--text-secondary); margin-bottom: 0.5rem; display:flex; justify-content:space-between; width:100%; align-items:center;">
            <span>${isUk ? 'Швидкість Інтернету' : 'Avg Internet Speed'}</span>
            <span style="color:#9b59b6; font-size:1.1em;">Сер: ${stats.avgInternet} ${isUk ? 'Мбіт/с' : 'Mbps'}</span>
          </div>
          <div style="width:100%; font-size:0.85em; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px;">${isUk ? 'Топ-5 за швидкістю Інтернету' : 'Top 5 Internet Speed'}</div>
          <div style="width:100%; display:flex; flex-direction:column; gap:0.375rem;">
            ${stats.topInternet.map((c, i) => {
               const cName = isUk ? c.name_uk : c.name_en;
               return `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:0.25rem 0.5rem; border-radius:0.375rem;">
                 <span style="font-size:0.95em;"><span style="color:var(--text-secondary); font-weight:bold; width:1.5rem; display:inline-block;">${i+1}.</span> ${cName}</span>
                 <span style="color:#9b59b6; font-weight:bold;">${c.internetSpeed} ${isUk ? 'Мбіт/с' : 'Mbps'}</span>
               </div>`;
            }).join('')}
          </div>
        </li>`;
      }
    } else if (this.activeMode === 'climate') {
      const isUk = lang === 'uk';
      document.querySelector('#continent-view .dominant-card h3').textContent = isUk ? 'Сер. Клімат (Поточний)' : 'Avg Climate (Current)';
      document.getElementById('cont-dominant-religion').innerHTML = `<span style="opacity: 0.2;">...</span>`;
      document.getElementById('cont-dominant-religion').style.color = 'var(--text-color)';
      document.getElementById('cont-dominant-percentage').textContent = '';
      document.querySelector('#continent-view .stats-list h3').textContent = isUk ? 'Середня Погода (Топ-10 країн)' : 'Average Weather (Top 10)';

      const list = document.getElementById('cont-religion-list');
      list.innerHTML = `
        <li id="cont-li-wind" style="opacity: 0.1; transition: opacity 0.3s ease;">
          <div class="stat-name">💨 ${isUk ? 'Середній Вітер' : 'Avg Wind'}</div>
          <div class="stat-value" id="cont-val-wind">...</div>
        </li>
        <li id="cont-li-humidity" style="opacity: 0.1; transition: opacity 0.3s ease;">
          <div class="stat-name">💧 ${isUk ? 'Сер. Вологість' : 'Avg Humidity'}</div>
          <div class="stat-value" id="cont-val-humidity">...</div>
        </li>
      `;

      if (stats.climateCoords && stats.climateCoords.length > 0) {
        const lats = stats.climateCoords.map(c => c[1].toFixed(4)).join(',');
        const lngs = stats.climateCoords.map(c => c[0].toFixed(4)).join(',');
        
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`)
          .then(r => r.json())
          .then(data => {
            const arr = Array.isArray(data) ? data : [data];
            let sumTemp = 0, sumWind = 0, sumHum = 0, valid = 0;
            
            arr.forEach(d => {
              if (d && d.current && d.current.temperature_2m !== undefined) {
                sumTemp += d.current.temperature_2m;
                sumWind += d.current.wind_speed_10m;
                sumHum += d.current.relative_humidity_2m;
                valid++;
              }
            });

            if (valid > 0) {
              const avgTemp = (sumTemp / valid).toFixed(1);
              const avgWind = (sumWind / valid).toFixed(1);
              const avgHum = Math.round(sumHum / valid);
              
              document.getElementById('cont-dominant-religion').textContent = `${avgTemp > 0 ? '+' : ''}${avgTemp}°C`;
              const windEl = document.getElementById('cont-val-wind');
              const humEl = document.getElementById('cont-val-humidity');
              if (windEl) { windEl.textContent = `${avgWind} ${isUk ? 'км/год' : 'km/h'}`; document.getElementById('cont-li-wind').style.opacity = '1'; }
              if (humEl) { humEl.textContent = `${avgHum}%`; document.getElementById('cont-li-humidity').style.opacity = '1'; }
            } else {
              document.getElementById('cont-dominant-religion').textContent = isUk ? 'Немає даних' : 'No data';
            }
          })
          .catch(() => {
            document.getElementById('cont-dominant-religion').textContent = isUk ? 'Помилка API' : 'API Error';
          });
      } else {
        document.getElementById('cont-dominant-religion').textContent = isUk ? 'Немає координат' : 'No coords';
      }
    }

    // Highlight the continent on the map (or clear if World)
    if (this.mapEngine && this.mapEngine.selectContinentFeature) {
        const codesToHighlight = continentId === 'World' ? [] : stats.isoCodes;
        this.mapEngine.selectContinentFeature(codesToHighlight);
    }
    
    // Fly to continent
    if (this.mapEngine && this.mapEngine.flyToContinent) {
        this.mapEngine.flyToContinent(continentId);
    }
  }

  renderStatsList(container, statsArray) {
    container.innerHTML = '';
    statsArray.forEach(stat => {
      const li = document.createElement('li');
      
      const header = document.createElement('div');
      header.className = 'stat-header';
      
      const name = document.createElement('span');
      name.textContent = this.i18n.getText(stat.name) || stat.name;
      
      const pct = document.createElement('span');
      pct.textContent = `${stat.percentage}%`;
      
      header.appendChild(name);
      header.appendChild(pct);
      
      const barContainer = document.createElement('div');
      barContainer.className = 'stat-bar-container';
      
      const bar = document.createElement('div');
      bar.className = `stat-bar stat-${stat.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '')}`;
      // Animate width
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = `${stat.percentage}%`;
      }, 50);

      barContainer.appendChild(bar);
      
      li.appendChild(header);
      li.appendChild(barContainer);
      container.appendChild(li);
    });
  }
}
