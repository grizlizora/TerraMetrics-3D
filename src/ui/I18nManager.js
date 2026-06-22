export default class I18nManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('religion_map_lang') || 'uk';
    
    this.dictionary = {
      'uk': {
        'title': '🌍 Світ',
        'search_placeholder': 'Пошук...',
        'btn_3d': '3D Глобус',
        'btn_2d': '2D Мапа',
        'dominant_religion': 'Домінуюча релігія',
        'religion_distribution': 'Розподіл релігій',
        'instruction': 'Наведіть або клікніть на країну, щоб побачити деталі.',
        'tab_countries': '🇺🇳 Країни',
        'tab_continents': '🌍 Континенти',
        'global_stats': 'Глобальна статистика',
        'not_found': 'Нічого не знайдено',
        'mode_religion': '⛪️ Релігія',
        'mode_population': '👥 Населення',
        'pop_stats': 'Статистика населення',
        'pop_segment': 'Категорія',
        'population': 'Кількість населення',
        'total_pop': 'Загальне населення',
        'space_none': '🌑 Вимкнено',
        'space_basic': '✨ Зорі',
        'space_advanced': '🪐 Система',
        'space_labels': '🏷️ Позначки',
        'space_deep': '🔭 Далекий космос',
        'mode_demographics': '📊 Культура',
        'density': 'Щільність (осіб/км²)',
        'capital': 'Столиця',
        'languages': 'Офіційні мови',
        'gini': 'Індекс нерівності (Gini)',
        'currency': 'Офіційна валюта',
        'driving_side': 'Рух транспорту',
        'right': 'Правосторонній',
        'left': 'Лівосторонній',
        'demographics_stats': 'Культура та Географія',
        'cat_society': '👨‍👩‍👧‍👦 Суспільство',
        'cat_state': '🏛️ Держава',
        'cat_nature': '🌍 Природа',
        'cat_society_short': 'Суспільство',
        'cat_state_short': 'Держава',
        'cat_nature_short': 'Природа',
        'mode_economy': '💰 Економіка',
        'mode_politics': '⚖️ Політика',
        'mode_military': '🛡️ Армія',
        'mode_climate': '🌤️ Клімат',
        'mode_geography': '🗺️ Територія',
        'mode_resources': '🌐 Інфраструктура',
        'climate_title': '🌤️ Клімат',
        'loading_weather': 'Завантаження метеоданих...',
        'current_weather': 'Поточна погода',
        'current_season': 'Поточна пора року',
        'temperature': 'Температура',
        'wind': 'Вітер',
        'humidity': 'Вологість',
        'annual_temp': 'Середня температура протягом року'
      },
      'en': {
        'title': '🌍 World',
        'search_placeholder': 'Search...',
        'btn_3d': '3D Globe',
        'btn_2d': '2D Map',
        'dominant_religion': 'Dominant Religion',
        'religion_distribution': 'Religion Distribution',
        'instruction': 'Hover or click on a country to see details.',
        'tab_countries': '🇺🇳 Countries',
        'tab_continents': '🌍 Continents',
        'global_stats': 'Global Statistics',
        'not_found': 'Not found',
        'mode_religion': '⛪️ Religion',
        'mode_population': '👥 Population',
        'pop_stats': 'Population Statistics',
        'pop_segment': 'Category',
        'population': 'Population',
        'total_pop': 'Total Population',
        'space_none': '🌑 Off',
        'space_basic': '✨ Stars',
        'space_advanced': '🪐 System',
        'space_labels': '🏷️ Labels',
        'space_deep': '🔭 Deep Space',
        'Християнство': 'Christianity',
        'Іслам': 'Islam',
        'Індуїзм': 'Hinduism',
        'Буддизм': 'Buddhism',
        'Атеїзм/Нерелігійні': 'Atheism / Non-religious',
        'Народні вірування': 'Folk Religions',
        'Юдаїзм': 'Judaism',
        'Інші': 'Other',
        'mode_demographics': '📊 Culture',
        'density': 'Density (pop/km²)',
        'capital': 'Capital',
        'languages': 'Official Languages',
        'gini': 'Inequality Index (Gini)',
        'currency': 'Currency',
        'driving_side': 'Driving Side',
        'right': 'Right',
        'left': 'Left',
        'demographics_stats': 'Culture & Geography',
        'cat_society': '👨‍👩‍👧‍👦 Society',
        'cat_state': '🏛️ State',
        'cat_nature': '🌍 Nature',
        'cat_society_short': 'Society',
        'cat_state_short': 'State',
        'cat_nature_short': 'Nature',
        'mode_economy': '💰 Economy',
        'mode_politics': '⚖️ Politics',
        'mode_military': '🛡️ Military',
        'mode_climate': '🌤️ Climate',
        'mode_geography': '🗺️ Territory',
        'mode_resources': '🌐 Infrastructure',
        'climate_title': '🌤️ Climate',
        'loading_weather': 'Loading weather data...',
        'current_weather': 'Current weather',
        'current_season': 'Current season',
        'temperature': 'Temperature',
        'wind': 'Wind',
        'humidity': 'Humidity',
        'annual_temp': 'Annual average temperatures'
      }
    };
    
    this.listeners = [];
  }
  
  init() {
    this.updateDOM();
    this.setupToggleBtn();
  }
  
  setupToggleBtn() {
    const btn = document.getElementById('lang-toggle');
    if (btn) {
      btn.textContent = this.currentLanguage === 'uk' ? '🇬🇧 EN' : '🇺🇦 UK';
      btn.addEventListener('click', () => {
        this.setLanguage(this.currentLanguage === 'uk' ? 'en' : 'uk');
        btn.textContent = this.currentLanguage === 'uk' ? '🇬🇧 EN' : '🇺🇦 UK';
      });
    }
  }

  setLanguage(lang) {
    if (this.dictionary[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('religion_map_lang', lang);
      this.updateDOM();
      this.notifyListeners();
    }
  }
  
  getText(key) {
    return this.dictionary[this.currentLanguage][key] || key;
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.dictionary[this.currentLanguage][key]) {
        el.textContent = this.dictionary[this.currentLanguage][key];
      }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (this.dictionary[this.currentLanguage][key]) {
        el.setAttribute('placeholder', this.dictionary[this.currentLanguage][key]);
      }
    });
  }
  
  onChange(callback) {
    this.listeners.push(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentLanguage));
  }
}
