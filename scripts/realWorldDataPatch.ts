export interface CountryPatch {
  continent?: string;
  demographics?: {
    capital_uk?: string;
    capital_en?: string;
    languages_uk?: string;
    languages_en?: string;
    gini?: number;
    currency_uk?: string;
    currency_en?: string;
    drivingSide?: 'right' | 'left';
    area?: number;
    population?: number;
    gdp?: number;
    military_percent?: number;
    military_active?: number;
    macro_tax?: number;
  };
  indexes?: {
    democracy?: number;
    safety?: number;
    healthcare?: number;
    ev?: number;
    internet?: number;
    peak?: number;
    tax?: number;
    energy?: number;
    salary?: number;
    col?: number;
    system?: string;
  };
  religions?: {
    dominant_religion: string;
    dominant_percentage: number;
    stats: Array<{ name: string; percentage: number }>;
  };
  population?: number;
}

export const REAL_WORLD_DATA_PATCH: Record<string, CountryPatch> = {
  // --- EUROPE ---
  UKR: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Київ',
      capital_en: 'Kyiv',
      languages_uk: 'Українська',
      languages_en: 'Ukrainian',
      gini: 25.6,
      currency_uk: 'Гривня (UAH)',
      currency_en: 'Ukrainian hryvnia (₴)',
      drivingSide: 'right',
      area: 603628,
      population: 38000000,
      gdp: 5300,
      military_percent: 34.5,
      military_active: 850000,
      macro_tax: 34.0
    },
    indexes: {
      democracy: 4.90,
      safety: 28,
      healthcare: 53,
      ev: 18,
      internet: 110,
      peak: 2061,
      tax: 18,
      energy: 65,
      salary: 520,
      col: 30,
      system: 'Змішана республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 85.0,
      stats: [
        { name: 'Християнство', percentage: 85.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 12.0 },
        { name: 'Іслам', percentage: 1.2 },
        { name: 'Інші', percentage: 1.6 },
        { name: 'Юдаїзм', percentage: 0.2 }
      ]
    }
  },
  DEU: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Берлін',
      capital_en: 'Berlin',
      languages_uk: 'Німецька',
      languages_en: 'German',
      gini: 31.7,
      currency_uk: 'Євро (EUR)',
      currency_en: 'Euro (€)',
      drivingSide: 'right',
      area: 357114,
      population: 84600000,
      gdp: 54300,
      military_percent: 2.1,
      military_active: 181500,
      macro_tax: 39.5
    },
    indexes: {
      democracy: 8.80,
      safety: 74,
      healthcare: 74,
      ev: 44,
      internet: 165,
      peak: 2962,
      tax: 26,
      energy: 56,
      salary: 3200,
      col: 66,
      system: 'Федеративна республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 54.0,
      stats: [
        { name: 'Християнство', percentage: 54.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 38.5 },
        { name: 'Іслам', percentage: 6.5 },
        { name: 'Інші', percentage: 0.8 },
        { name: 'Юдаїзм', percentage: 0.2 }
      ]
    }
  },
  FRA: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Париж',
      capital_en: 'Paris',
      languages_uk: 'Французька',
      languages_en: 'French',
      gini: 32.4,
      currency_uk: 'Євро (EUR)',
      currency_en: 'Euro (€)',
      drivingSide: 'right',
      area: 551695,
      population: 68370000,
      gdp: 44500,
      military_percent: 2.1,
      military_active: 205000,
      macro_tax: 45.5
    },
    indexes: {
      democracy: 8.07,
      safety: 56,
      healthcare: 79,
      ev: 42,
      internet: 220,
      peak: 4809,
      tax: 25,
      energy: 92,
      salary: 2700,
      col: 68,
      system: 'Змішана республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 58.0,
      stats: [
        { name: 'Християнство', percentage: 58.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 32.0 },
        { name: 'Іслам', percentage: 8.5 },
        { name: 'Юдаїзм', percentage: 0.8 },
        { name: 'Інші', percentage: 0.7 }
      ]
    }
  },
  GBR: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Лондон',
      capital_en: 'London',
      languages_uk: 'Англійська',
      languages_en: 'English',
      gini: 35.1,
      currency_uk: 'Фунт стерлінгів (GBP)',
      currency_en: 'British pound (£)',
      drivingSide: 'left',
      area: 242495,
      population: 68500000,
      gdp: 51100,
      military_percent: 2.3,
      military_active: 148000,
      macro_tax: 35.5
    },
    indexes: {
      democracy: 8.10,
      safety: 58,
      healthcare: 72,
      ev: 40,
      internet: 130,
      peak: 1345,
      tax: 20,
      energy: 45,
      salary: 3300,
      col: 70,
      system: 'Конституційна монархія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 50.0,
      stats: [
        { name: 'Християнство', percentage: 50.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 40.0 },
        { name: 'Іслам', percentage: 6.5 },
        { name: 'Індуїзм', percentage: 1.8 },
        { name: 'Юдаїзм', percentage: 0.5 },
        { name: 'Інші', percentage: 1.2 }
      ]
    }
  },
  POL: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Варшава',
      capital_en: 'Warsaw',
      languages_uk: 'Польська',
      languages_en: 'Polish',
      gini: 29.5,
      currency_uk: 'Злотий (PLN)',
      currency_en: 'Polish złoty (zł)',
      drivingSide: 'right',
      area: 312696,
      population: 37600000,
      gdp: 23500,
      military_percent: 4.2,
      military_active: 216000,
      macro_tax: 35.5
    },
    indexes: {
      democracy: 7.18,
      safety: 72,
      healthcare: 62,
      ev: 12,
      internet: 155,
      peak: 2499,
      tax: 12,
      energy: 28,
      salary: 1450,
      col: 44,
      system: 'Парламентська республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 88.0,
      stats: [
        { name: 'Християнство', percentage: 88.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 10.5 },
        { name: 'Інші', percentage: 1.4 },
        { name: 'Іслам', percentage: 0.1 }
      ]
    }
  },
  ESP: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Мадрид',
      capital_en: 'Madrid',
      languages_uk: 'Іспанська',
      languages_en: 'Spanish',
      gini: 34.0,
      currency_uk: 'Євро (EUR)',
      currency_en: 'Euro (€)',
      drivingSide: 'right',
      area: 505990,
      population: 48600000,
      gdp: 34000,
      military_percent: 1.3,
      military_active: 120000,
      macro_tax: 38.5
    },
    indexes: {
      democracy: 8.07,
      safety: 72,
      healthcare: 78,
      ev: 22,
      internet: 180,
      peak: 3718,
      tax: 25,
      energy: 54,
      salary: 2000,
      col: 60,
      system: 'Конституційна монархія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 67.0,
      stats: [
        { name: 'Християнство', percentage: 67.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 29.5 },
        { name: 'Іслам', percentage: 2.5 },
        { name: 'Інші', percentage: 1.0 }
      ]
    }
  },
  CHE: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Берн',
      capital_en: 'Bern',
      languages_uk: 'Німецька, Французька, Італійська, Ретороманська',
      languages_en: 'German, French, Italian, Romansh',
      gini: 33.1,
      currency_uk: 'Швейцарський франк (CHF)',
      currency_en: 'Swiss franc',
      drivingSide: 'right',
      area: 41285,
      population: 8960000,
      gdp: 103500,
      military_percent: 0.8,
      military_active: 24000,
      macro_tax: 28.0
    },
    indexes: {
      democracy: 9.14,
      safety: 80,
      healthcare: 74,
      ev: 52,
      internet: 250,
      peak: 4634,
      tax: 22,
      energy: 65,
      salary: 7300,
      col: 108,
      system: 'Федеративна республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 61.5,
      stats: [
        { name: 'Християнство', percentage: 61.5 },
        { name: 'Атеїзм/Нерелігійні', percentage: 31.0 },
        { name: 'Іслам', percentage: 5.5 },
        { name: 'Юдаїзм', percentage: 0.3 },
        { name: 'Інші', percentage: 1.7 }
      ]
    }
  },
  NOR: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Осло',
      capital_en: 'Oslo',
      languages_uk: 'Норвезька',
      languages_en: 'Norwegian',
      gini: 27.5,
      currency_uk: 'Норвезька крона (NOK)',
      currency_en: 'Norwegian krone (kr)',
      drivingSide: 'right',
      area: 385207,
      population: 5550000,
      gdp: 89500,
      military_percent: 2.2,
      military_active: 25000,
      macro_tax: 43.0
    },
    indexes: {
      democracy: 9.81,
      safety: 78,
      healthcare: 75,
      ev: 98,
      internet: 190,
      peak: 2469,
      tax: 22,
      energy: 99,
      salary: 3900,
      col: 82,
      system: 'Конституційна монархія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 75.0,
      stats: [
        { name: 'Християнство', percentage: 75.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 19.5 },
        { name: 'Іслам', percentage: 3.5 },
        { name: 'Інші', percentage: 2.0 }
      ]
    }
  },
  ISL: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Рейк\'явік',
      capital_en: 'Reykjavík',
      languages_uk: 'Ісландська',
      languages_en: 'Icelandic',
      gini: 25.5,
      currency_uk: 'Ісландська крона (ISK)',
      currency_en: 'Icelandic króna (kr)',
      drivingSide: 'right',
      area: 103000,
      population: 393000,
      gdp: 78000,
      military_percent: 0.1,
      military_active: 0,
      macro_tax: 36.0
    },
    indexes: {
      democracy: 9.52,
      safety: 95,
      healthcare: 82,
      ev: 85,
      internet: 210,
      peak: 2110,
      tax: 35,
      energy: 100,
      salary: 4200,
      col: 88,
      system: 'Парламентська республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 80.0,
      stats: [
        { name: 'Християнство', percentage: 80.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 17.5 },
        { name: 'Народні вірування', percentage: 1.5 },
        { name: 'Інші', percentage: 1.0 }
      ]
    }
  },
  VAT: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Ватикан',
      capital_en: 'Vatican City',
      languages_uk: 'Латинська, Італійська',
      languages_en: 'Latin, Italian',
      gini: 20.0,
      currency_uk: 'Євро (EUR)',
      currency_en: 'Euro (€)',
      drivingSide: 'right',
      area: 0.49,
      population: 800,
      gdp: 35000,
      military_percent: 0.0,
      military_active: 135,
      macro_tax: 0.0
    },
    indexes: {
      democracy: 2.0,
      safety: 95,
      healthcare: 85,
      ev: 35,
      internet: 150,
      peak: 75,
      tax: 0,
      energy: 85,
      salary: 2500,
      col: 75,
      system: 'Абсолютна теократична монархія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 100.0,
      stats: [{ name: 'Християнство', percentage: 100.0 }]
    }
  },
  MCO: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Монако',
      capital_en: 'Monaco',
      languages_uk: 'Французька',
      languages_en: 'French',
      gini: 29.0,
      currency_uk: 'Євро (EUR)',
      currency_en: 'Euro (€)',
      drivingSide: 'right',
      area: 2.08,
      population: 39000,
      gdp: 240000,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 12.0
    },
    indexes: {
      democracy: 7.50,
      safety: 92,
      healthcare: 80,
      ev: 30,
      internet: 210,
      peak: 161,
      tax: 0,
      energy: 40,
      salary: 7500,
      col: 120,
      system: 'Конституційна монархія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 86.0,
      stats: [
        { name: 'Християнство', percentage: 86.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 12.0 },
        { name: 'Юдаїзм', percentage: 1.5 },
        { name: 'Інші', percentage: 0.5 }
      ]
    }
  },
  LIE: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Вадуц',
      capital_en: 'Vaduz',
      languages_uk: 'Німецька',
      languages_en: 'German',
      gini: 28.0,
      currency_uk: 'Швейцарський франк (CHF)',
      currency_en: 'Swiss franc',
      drivingSide: 'right',
      area: 160,
      population: 40000,
      gdp: 210000,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 22.0
    },
    indexes: {
      democracy: 7.80,
      safety: 92,
      healthcare: 78,
      ev: 40,
      internet: 220,
      peak: 2599,
      tax: 18,
      energy: 60,
      salary: 6800,
      col: 102,
      system: 'Конституційна монархія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 84.0,
      stats: [
        { name: 'Християнство', percentage: 84.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 10.0 },
        { name: 'Іслам', percentage: 5.0 },
        { name: 'Інші', percentage: 1.0 }
      ]
    }
  },
  AND: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Андорра-ла-Велья',
      capital_en: 'Andorra la Vella',
      languages_uk: 'Каталонська',
      languages_en: 'Catalan',
      gini: 27.5,
      currency_uk: 'Євро (EUR)',
      currency_en: 'Euro (€)',
      drivingSide: 'right',
      area: 468,
      population: 80000,
      gdp: 47000,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 25.0
    },
    indexes: {
      democracy: 7.80,
      safety: 90,
      healthcare: 77,
      ev: 25,
      internet: 180,
      peak: 2942,
      tax: 10,
      energy: 50,
      salary: 2800,
      col: 62,
      system: 'Конституційна монархія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 90.0,
      stats: [
        { name: 'Християнство', percentage: 90.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 8.5 },
        { name: 'Інші', percentage: 1.5 }
      ]
    }
  },
  MLT: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Валлетта',
      capital_en: 'Valletta',
      languages_uk: 'Мальтійська, Англійська',
      languages_en: 'Maltese, English',
      gini: 31.1,
      currency_uk: 'Євро (EUR)',
      currency_en: 'Euro (€)',
      drivingSide: 'left',
      area: 316,
      population: 535000,
      gdp: 39500,
      military_percent: 0.8,
      military_active: 1950,
      macro_tax: 30.0
    },
    indexes: {
      democracy: 7.93,
      safety: 78,
      healthcare: 75,
      ev: 15,
      internet: 150,
      peak: 253,
      tax: 25,
      energy: 15,
      salary: 1800,
      col: 62,
      system: 'Парламентська республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 90.0,
      stats: [
        { name: 'Християнство', percentage: 90.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 5.0 },
        { name: 'Іслам', percentage: 4.0 },
        { name: 'Інші', percentage: 1.0 }
      ]
    }
  },
  BLR: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Мінськ',
      capital_en: 'Minsk',
      languages_uk: 'Білоруська, Російська',
      languages_en: 'Belarusian, Russian',
      gini: 24.4,
      currency_uk: 'Білоруський рубль (BYN)',
      currency_en: 'Belarusian ruble',
      drivingSide: 'right',
      area: 207600,
      population: 9200000,
      gdp: 7800,
      military_percent: 1.6,
      military_active: 65000,
      macro_tax: 28.0
    },
    indexes: {
      democracy: 1.99,
      safety: 65,
      healthcare: 60,
      ev: 2,
      internet: 60,
      peak: 345,
      tax: 13,
      energy: 5,
      salary: 500,
      col: 35,
      system: 'Президентська автократія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 70.0,
      stats: [
        { name: 'Християнство', percentage: 70.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 28.5 },
        { name: 'Іслам', percentage: 0.5 },
        { name: 'Інші', percentage: 1.0 }
      ]
    }
  },
  RUS: {
    continent: 'Europe',
    demographics: {
      capital_uk: 'Москва',
      capital_en: 'Moscow',
      languages_uk: 'Російська',
      languages_en: 'Russian',
      gini: 36.0,
      currency_uk: 'Рубль (RUB)',
      currency_en: 'Russian ruble (₽)',
      drivingSide: 'right',
      area: 17098246,
      population: 144000000,
      gdp: 14000,
      military_percent: 7.1,
      military_active: 1320000,
      macro_tax: 32.0
    },
    indexes: {
      democracy: 2.22,
      safety: 25,
      healthcare: 55,
      ev: 2,
      internet: 90,
      peak: 5642,
      tax: 13,
      energy: 20,
      salary: 700,
      col: 40,
      system: 'Президентська автократія'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 72.0,
      stats: [
        { name: 'Християнство', percentage: 72.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 16.0 },
        { name: 'Іслам', percentage: 10.5 },
        { name: 'Буддизм', percentage: 0.8 },
        { name: 'Юдаїзм', percentage: 0.2 },
        { name: 'Інші', percentage: 0.5 }
      ]
    }
  },

  // --- AMERICAS ---
  USA: {
    continent: 'North America',
    demographics: {
      capital_uk: 'Вашингтон',
      capital_en: 'Washington, D.C.',
      languages_uk: 'Англійська',
      languages_en: 'English',
      gini: 39.8,
      currency_uk: 'Долар США (USD)',
      currency_en: 'United States dollar ($)',
      drivingSide: 'right',
      area: 9833517,
      population: 342000000,
      gdp: 85400,
      military_percent: 3.4,
      military_active: 1328000,
      macro_tax: 27.5
    },
    indexes: {
      democracy: 7.85,
      safety: 50,
      healthcare: 69,
      ev: 30,
      internet: 245,
      peak: 6190,
      tax: 24,
      energy: 42,
      salary: 4500,
      col: 74,
      system: 'Федеративна республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 64.0,
      stats: [
        { name: 'Християнство', percentage: 64.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 29.0 },
        { name: 'Юдаїзм', percentage: 2.1 },
        { name: 'Іслам', percentage: 1.3 },
        { name: 'Буддизм', percentage: 1.0 },
        { name: 'Індуїзм', percentage: 1.0 },
        { name: 'Інші', percentage: 1.6 }
      ]
    }
  },
  BRA: {
    continent: 'South America',
    demographics: {
      capital_uk: 'Бразиліа',
      capital_en: 'Brasília',
      languages_uk: 'Португальська',
      languages_en: 'Portuguese',
      gini: 52.5,
      currency_uk: 'Бразильський реал (BRL)',
      currency_en: 'Brazilian real (R$)',
      drivingSide: 'right',
      area: 8515767,
      population: 216000000,
      gdp: 10300,
      military_percent: 1.3,
      military_active: 360000,
      macro_tax: 33.5
    },
    indexes: {
      democracy: 6.70,
      safety: 35,
      healthcare: 55,
      ev: 5,
      internet: 130,
      peak: 2995,
      tax: 27.5,
      energy: 89,
      salary: 480,
      col: 40,
      system: 'Федеративна республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 88.0,
      stats: [
        { name: 'Християнство', percentage: 88.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 8.0 },
        { name: 'Народні вірування', percentage: 2.5 },
        { name: 'Інші', percentage: 1.5 }
      ]
    }
  },
  CRI: {
    continent: 'North America',
    demographics: {
      capital_uk: 'Сан-Хосе',
      capital_en: 'San José',
      languages_uk: 'Іспанська',
      languages_en: 'Spanish',
      gini: 48.0,
      currency_uk: 'Костариканський колон (CRC)',
      currency_en: 'Costa Rican colón (₡)',
      drivingSide: 'right',
      area: 51100,
      population: 5200000,
      gdp: 16500,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 23.0
    },
    indexes: {
      democracy: 8.29,
      safety: 55,
      healthcare: 75,
      ev: 12,
      internet: 100,
      peak: 3820,
      tax: 15,
      energy: 99,
      salary: 850,
      col: 48,
      system: 'Президентська республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 85.0,
      stats: [
        { name: 'Християнство', percentage: 85.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 13.0 },
        { name: 'Інші', percentage: 2.0 }
      ]
    }
  },
  PAN: {
    continent: 'North America',
    demographics: {
      capital_uk: 'Панама',
      capital_en: 'Panama City',
      languages_uk: 'Іспанська',
      languages_en: 'Spanish',
      gini: 49.5,
      currency_uk: 'Бальбоа / Долар США (PAB/USD)',
      currency_en: 'Panamanian balboa / US dollar',
      drivingSide: 'right',
      area: 75417,
      population: 4460000,
      gdp: 18000,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 16.0
    },
    indexes: {
      democracy: 6.91,
      safety: 52,
      healthcare: 62,
      ev: 5,
      internet: 135,
      peak: 3475,
      tax: 15,
      energy: 75,
      salary: 950,
      col: 52,
      system: 'Президентська республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 88.0,
      stats: [
        { name: 'Християнство', percentage: 88.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 9.0 },
        { name: 'Інші', percentage: 3.0 }
      ]
    }
  },

  // --- ASIA ---
  CHN: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Пекін',
      capital_en: 'Beijing',
      languages_uk: 'Китайська (мандарин)',
      languages_en: 'Standard Chinese',
      gini: 37.5,
      currency_uk: 'Юань (CNY)',
      currency_en: 'Chinese yuan (¥)',
      drivingSide: 'right',
      area: 9596961,
      population: 1419320000,
      gdp: 13140,
      military_percent: 1.7,
      military_active: 2035000,
      macro_tax: 21.0
    },
    indexes: {
      democracy: 2.12,
      safety: 75,
      healthcare: 68,
      ev: 78,
      internet: 230,
      peak: 8848.86,
      tax: 20,
      energy: 35,
      salary: 1000,
      col: 37,
      system: 'Однопартійна соціалістична республіка'
    },
    religions: {
      dominant_religion: 'Атеїзм/Нерелігійні',
      dominant_percentage: 52.2,
      stats: [
        { name: 'Атеїзм/Нерелігійні', percentage: 52.2 },
        { name: 'Народні вірування', percentage: 29.5 },
        { name: 'Буддизм', percentage: 15.8 },
        { name: 'Християнство', percentage: 2.5 }
      ]
    }
  },
  IND: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Нью-Делі',
      capital_en: 'New Delhi',
      languages_uk: 'Гінді, Англійська',
      languages_en: 'Hindi, English',
      gini: 35.0,
      currency_uk: 'Індійська рупія (INR)',
      currency_en: 'Indian rupee (₹)',
      drivingSide: 'left',
      area: 3287263,
      population: 1441720000,
      gdp: 2730,
      military_percent: 2.4,
      military_active: 1450000,
      macro_tax: 17.5
    },
    indexes: {
      democracy: 7.18,
      safety: 55,
      healthcare: 58,
      ev: 8,
      internet: 85,
      peak: 8586,
      tax: 15,
      energy: 23,
      salary: 450,
      col: 22,
      system: 'Федеративна республіка'
    },
    religions: {
      dominant_religion: 'Індуїзм',
      dominant_percentage: 79.8,
      stats: [
        { name: 'Індуїзм', percentage: 79.8 },
        { name: 'Іслам', percentage: 14.2 },
        { name: 'Християнство', percentage: 2.3 },
        { name: 'Інші', percentage: 2.5 },
        { name: 'Буддизм', percentage: 0.7 },
        { name: 'Атеїзм/Нерелігійні', percentage: 0.5 }
      ]
    }
  },
  JPN: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Токіо',
      capital_en: 'Tokyo',
      languages_uk: 'Японська',
      languages_en: 'Japanese',
      gini: 32.9,
      currency_uk: 'Єна (JPY)',
      currency_en: 'Japanese yen (¥)',
      drivingSide: 'left',
      area: 377975,
      population: 124500000,
      gdp: 33800,
      military_percent: 1.4,
      military_active: 247000,
      macro_tax: 33.0
    },
    indexes: {
      democracy: 8.40,
      safety: 82,
      healthcare: 81,
      ev: 15,
      internet: 200,
      peak: 3776,
      tax: 20,
      energy: 26,
      salary: 2350,
      col: 56,
      system: 'Конституційна монархія'
    },
    religions: {
      dominant_religion: 'Атеїзм/Нерелігійні',
      dominant_percentage: 58.0,
      stats: [
        { name: 'Атеїзм/Нерелігійні', percentage: 58.0 },
        { name: 'Буддизм', percentage: 31.0 },
        { name: 'Народні вірування', percentage: 8.0 },
        { name: 'Християнство', percentage: 1.5 },
        { name: 'Інші', percentage: 1.5 }
      ]
    }
  },
  ISR: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Єрусалим',
      capital_en: 'Jerusalem',
      languages_uk: 'Іврит',
      languages_en: 'Hebrew',
      gini: 34.8,
      currency_uk: 'Новий ізраїльський шекель (ILS)',
      currency_en: 'Israeli new shekel (₪)',
      drivingSide: 'right',
      area: 22072,
      population: 9900000,
      gdp: 53500,
      military_percent: 5.3,
      military_active: 170000,
      macro_tax: 32.5
    },
    indexes: {
      democracy: 7.80,
      safety: 45,
      healthcare: 75,
      ev: 28,
      internet: 180,
      peak: 1208,
      tax: 25,
      energy: 12,
      salary: 3100,
      col: 75,
      system: 'Парламентська республіка'
    },
    religions: {
      dominant_religion: 'Юдаїзм',
      dominant_percentage: 73.5,
      stats: [
        { name: 'Юдаїзм', percentage: 73.5 },
        { name: 'Іслам', percentage: 18.2 },
        { name: 'Інші', percentage: 6.3 },
        { name: 'Християнство', percentage: 2.0 }
      ]
    }
  },
  SAU: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Ер-Ріяд',
      capital_en: 'Riyadh',
      languages_uk: 'Арабська',
      languages_en: 'Arabic',
      gini: 45.0,
      currency_uk: 'Саудівський ріал (SAR)',
      currency_en: 'Saudi riyal (﷼)',
      drivingSide: 'right',
      area: 2149690,
      population: 36947000,
      gdp: 32500,
      military_percent: 7.1,
      military_active: 257000,
      macro_tax: 15.0
    },
    indexes: {
      democracy: 2.08,
      safety: 70,
      healthcare: 64,
      ev: 5,
      internet: 160,
      peak: 3000,
      tax: 0,
      energy: 2,
      salary: 2600,
      col: 55,
      system: 'Абсолютна монархія'
    },
    religions: {
      dominant_religion: 'Іслам',
      dominant_percentage: 93.0,
      stats: [
        { name: 'Іслам', percentage: 93.0 },
        { name: 'Християнство', percentage: 4.4 },
        { name: 'Індуїзм', percentage: 1.5 },
        { name: 'Інші', percentage: 1.1 }
      ]
    }
  },
  IDN: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Джакарта',
      capital_en: 'Jakarta',
      languages_uk: 'Індонезійська',
      languages_en: 'Indonesian',
      gini: 37.9,
      currency_uk: 'Рупія (IDR)',
      currency_en: 'Indonesian rupiah (Rp)',
      drivingSide: 'left',
      area: 1904569,
      population: 281600000,
      gdp: 5100,
      military_percent: 0.8,
      military_active: 400000,
      macro_tax: 12.0
    },
    indexes: {
      democracy: 6.53,
      safety: 60,
      healthcare: 58,
      ev: 5,
      internet: 35,
      peak: 4884,
      tax: 15,
      energy: 15,
      salary: 400,
      col: 32,
      system: 'Президентська республіка'
    },
    religions: {
      dominant_religion: 'Іслам',
      dominant_percentage: 87.2,
      stats: [
        { name: 'Іслам', percentage: 87.2 },
        { name: 'Християнство', percentage: 10.5 },
        { name: 'Індуїзм', percentage: 1.7 },
        { name: 'Буддизм', percentage: 0.6 }
      ]
    }
  },
  KOR: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Сеул',
      capital_en: 'Seoul',
      languages_uk: 'Корейська',
      languages_en: 'Korean',
      gini: 31.4,
      currency_uk: 'Вона (KRW)',
      currency_en: 'South Korean won (₩)',
      drivingSide: 'right',
      area: 100210,
      population: 51710000,
      gdp: 34500,
      military_percent: 2.8,
      military_active: 500000,
      macro_tax: 29.5
    },
    indexes: {
      democracy: 8.09,
      safety: 82,
      healthcare: 83,
      ev: 25,
      internet: 215,
      peak: 1950,
      tax: 24,
      energy: 35,
      salary: 2800,
      col: 68,
      system: 'Президентська республіка'
    },
    religions: {
      dominant_religion: 'Атеїзм/Нерелігійні',
      dominant_percentage: 56.0,
      stats: [
        { name: 'Атеїзм/Нерелігійні', percentage: 56.0 },
        { name: 'Християнство', percentage: 28.0 },
        { name: 'Буддизм', percentage: 15.0 },
        { name: 'Інші', percentage: 1.0 }
      ]
    }
  },
  PRK: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Пхеньян',
      capital_en: 'Pyongyang',
      languages_uk: 'Корейська',
      languages_en: 'Korean',
      gini: 31.0,
      currency_uk: 'Північнокорейська вона (KPW)',
      currency_en: 'North Korean won (₩)',
      drivingSide: 'right',
      area: 120540,
      population: 26160000,
      gdp: 1200,
      military_percent: 25.0,
      military_active: 1280000,
      macro_tax: 0.0
    },
    indexes: {
      democracy: 1.08,
      safety: 40,
      healthcare: 25,
      ev: 0,
      internet: 1,
      peak: 2744,
      tax: 0,
      energy: 60,
      salary: 50,
      col: 35,
      system: 'Тоталітарна диктатура'
    },
    religions: {
      dominant_religion: 'Атеїзм/Нерелігійні',
      dominant_percentage: 64.0,
      stats: [
        { name: 'Атеїзм/Нерелігійні', percentage: 64.0 },
        { name: 'Народні вірування', percentage: 16.0 },
        { name: 'Буддизм', percentage: 13.0 },
        { name: 'Християнство', percentage: 2.0 },
        { name: 'Інші', percentage: 5.0 }
      ]
    }
  },
  TWN: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Тайбей',
      capital_en: 'Taipei',
      languages_uk: 'Китайська (мандарин)',
      languages_en: 'Mandarin Chinese',
      gini: 34.0,
      currency_uk: 'Новий тайванський долар (TWD)',
      currency_en: 'New Taiwan dollar (NT$)',
      drivingSide: 'right',
      area: 36193,
      population: 23420000,
      gdp: 33500,
      military_percent: 2.5,
      military_active: 169000,
      macro_tax: 15.0
    },
    indexes: {
      democracy: 8.92,
      safety: 85,
      healthcare: 86,
      ev: 25,
      internet: 190,
      peak: 3952,
      tax: 12,
      energy: 10,
      salary: 2000,
      col: 65,
      system: 'Змішана республіка'
    },
    religions: {
      dominant_religion: 'Буддизм',
      dominant_percentage: 35.0,
      stats: [
        { name: 'Буддизм', percentage: 35.0 },
        { name: 'Народні вірування', percentage: 33.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 19.0 },
        { name: 'Християнство', percentage: 4.0 },
        { name: 'Інші', percentage: 9.0 }
      ]
    }
  },
  HKG: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Гонконг',
      capital_en: 'Hong Kong',
      languages_uk: 'Китайська (кантонська), Англійська',
      languages_en: 'Cantonese, English',
      gini: 53.9,
      currency_uk: 'Гонконгський долар (HKD)',
      currency_en: 'Hong Kong dollar (HK$)',
      drivingSide: 'left',
      area: 1110,
      population: 7500000,
      gdp: 54000,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 14.0
    },
    indexes: {
      democracy: 4.50,
      safety: 82,
      healthcare: 80,
      ev: 68,
      internet: 285,
      peak: 957,
      tax: 15,
      energy: 5,
      salary: 3400,
      col: 74,
      system: 'Спеціальний адміністративний район'
    },
    religions: {
      dominant_religion: 'Атеїзм/Нерелігійні',
      dominant_percentage: 54.0,
      stats: [
        { name: 'Атеїзм/Нерелігійні', percentage: 54.0 },
        { name: 'Буддизм', percentage: 21.0 },
        { name: 'Християнство', percentage: 12.0 },
        { name: 'Народні вірування', percentage: 10.0 },
        { name: 'Іслам', percentage: 2.0 },
        { name: 'Інші', percentage: 1.0 }
      ]
    }
  },
  MMR: {
    continent: 'Asia',
    demographics: {
      capital_uk: 'Найп\'їдо',
      capital_en: 'Naypyidaw',
      languages_uk: 'Бірманська',
      languages_en: 'Burmese',
      gini: 30.7,
      currency_uk: 'К\'ят (MMK)',
      currency_en: 'Myanmar kyat (K)',
      drivingSide: 'right',
      area: 676578,
      population: 54500000,
      gdp: 1200,
      military_percent: 3.5,
      military_active: 150000,
      macro_tax: 10.0
    },
    indexes: {
      democracy: 0.85,
      safety: 15,
      healthcare: 25,
      ev: 0,
      internet: 15,
      peak: 5881,
      tax: 15,
      energy: 50,
      salary: 150,
      col: 35,
      system: 'Військова хунта'
    },
    religions: {
      dominant_religion: 'Буддизм',
      dominant_percentage: 88.0,
      stats: [
        { name: 'Буддизм', percentage: 88.0 },
        { name: 'Християнство', percentage: 6.0 },
        { name: 'Іслам', percentage: 4.0 },
        { name: 'Інші', percentage: 2.0 }
      ]
    }
  },

  // --- AFRICA ---
  EGY: {
    continent: 'Africa',
    demographics: {
      capital_uk: 'Каїр',
      capital_en: 'Cairo',
      languages_uk: 'Арабська',
      languages_en: 'Arabic',
      gini: 31.5,
      currency_uk: 'Єгипетський фунт (EGP)',
      currency_en: 'Egyptian pound (E£)',
      drivingSide: 'right',
      area: 1002450,
      population: 114500000,
      gdp: 3800,
      military_percent: 1.3,
      military_active: 440000,
      macro_tax: 14.5
    },
    indexes: {
      democracy: 2.93,
      safety: 45,
      healthcare: 50,
      ev: 2,
      internet: 65,
      peak: 2629,
      tax: 20,
      energy: 15,
      salary: 220,
      col: 24,
      system: 'Президентська республіка'
    },
    religions: {
      dominant_religion: 'Іслам',
      dominant_percentage: 90.0,
      stats: [
        { name: 'Іслам', percentage: 90.0 },
        { name: 'Християнство', percentage: 9.5 },
        { name: 'Атеїзм/Нерелігійні', percentage: 0.3 },
        { name: 'Інші', percentage: 0.2 }
      ]
    }
  },
  ZAF: {
    continent: 'Africa',
    demographics: {
      capital_uk: 'Преторія',
      capital_en: 'Pretoria',
      languages_uk: 'Зулу, Коса, Африкаанс, Англійська',
      languages_en: 'Zulu, Xhosa, Afrikaans, English',
      gini: 63.0,
      currency_uk: 'Ранд (ZAR)',
      currency_en: 'South African rand (R)',
      drivingSide: 'left',
      area: 1221037,
      population: 60400000,
      gdp: 6200,
      military_percent: 0.8,
      military_active: 73000,
      macro_tax: 28.0
    },
    indexes: {
      democracy: 7.05,
      safety: 30,
      healthcare: 55,
      ev: 2,
      internet: 65,
      peak: 3450,
      tax: 28,
      energy: 20,
      salary: 1200,
      col: 40,
      system: 'Парламентська республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 80.0,
      stats: [
        { name: 'Християнство', percentage: 80.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 15.0 },
        { name: 'Народні вірування', percentage: 3.0 },
        { name: 'Іслам', percentage: 1.5 },
        { name: 'Інші', percentage: 0.5 }
      ]
    }
  },
  MLI: {
    continent: 'Africa',
    demographics: {
      capital_uk: 'Бамако',
      capital_en: 'Bamako',
      languages_uk: 'Французька, Бамбара',
      languages_en: 'French, Bambara',
      gini: 36.1,
      currency_uk: 'Франк КФА (XOF)',
      currency_en: 'West African CFA franc (CFA)',
      drivingSide: 'right',
      area: 1240192,
      population: 23290000,
      gdp: 900,
      military_percent: 3.2,
      military_active: 21000,
      macro_tax: 15.0
    },
    indexes: {
      democracy: 2.58,
      safety: 20,
      healthcare: 25,
      ev: 0,
      internet: 15,
      peak: 1152,
      tax: 20,
      energy: 30,
      salary: 150,
      col: 35,
      system: 'Військова хунта'
    },
    religions: {
      dominant_religion: 'Іслам',
      dominant_percentage: 94.0,
      stats: [
        { name: 'Іслам', percentage: 94.0 },
        { name: 'Християнство', percentage: 3.5 },
        { name: 'Народні вірування', percentage: 2.5 }
      ]
    }
  },
  BFA: {
    continent: 'Africa',
    demographics: {
      capital_uk: 'Уагадугу',
      capital_en: 'Ouagadougou',
      languages_uk: 'Французька, Мооре',
      languages_en: 'French, Mooré',
      gini: 47.3,
      currency_uk: 'Франк КФА (XOF)',
      currency_en: 'West African CFA franc (CFA)',
      drivingSide: 'right',
      area: 274222,
      population: 23250000,
      gdp: 850,
      military_percent: 3.8,
      military_active: 15000,
      macro_tax: 16.0
    },
    indexes: {
      democracy: 2.73,
      safety: 20,
      healthcare: 25,
      ev: 0,
      internet: 8,
      peak: 749,
      tax: 27,
      energy: 20,
      salary: 100,
      col: 32,
      system: 'Військова хунта'
    },
    religions: {
      dominant_religion: 'Іслам',
      dominant_percentage: 63.8,
      stats: [
        { name: 'Іслам', percentage: 63.8 },
        { name: 'Християнство', percentage: 26.3 },
        { name: 'Народні вірування', percentage: 9.0 },
        { name: 'Інші', percentage: 0.9 }
      ]
    }
  },
  NER: {
    continent: 'Africa',
    demographics: {
      capital_uk: 'Ніамей',
      capital_en: 'Niamey',
      languages_uk: 'Французька, Хауса',
      languages_en: 'French, Hausa',
      gini: 34.3,
      currency_uk: 'Франк КФА (XOF)',
      currency_en: 'West African CFA franc (CFA)',
      drivingSide: 'right',
      area: 1267000,
      population: 27200000,
      gdp: 600,
      military_percent: 2.5,
      military_active: 12000,
      macro_tax: 11.0
    },
    indexes: {
      democracy: 2.37,
      safety: 20,
      healthcare: 25,
      ev: 0,
      internet: 5,
      peak: 2022,
      tax: 20,
      energy: 5,
      salary: 80,
      col: 35,
      system: 'Військова хунта'
    },
    religions: {
      dominant_religion: 'Іслам',
      dominant_percentage: 99.0,
      stats: [
        { name: 'Іслам', percentage: 99.0 },
        { name: 'Християнство', percentage: 0.5 },
        { name: 'Народні вірування', percentage: 0.5 }
      ]
    }
  },
  GAB: {
    continent: 'Africa',
    demographics: {
      capital_uk: 'Лібревіль',
      capital_en: 'Libreville',
      languages_uk: 'Французька',
      languages_en: 'French',
      gini: 38.0,
      currency_uk: 'Франк КФА (XAF)',
      currency_en: 'Central African CFA franc (FCFA)',
      drivingSide: 'right',
      area: 267667,
      population: 2440000,
      gdp: 9000,
      military_percent: 1.8,
      military_active: 6500,
      macro_tax: 14.0
    },
    indexes: {
      democracy: 2.18,
      safety: 45,
      healthcare: 35,
      ev: 0,
      internet: 20,
      peak: 1070,
      tax: 20,
      energy: 50,
      salary: 400,
      col: 50,
      system: 'Перехідний військовий режим'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 82.0,
      stats: [
        { name: 'Християнство', percentage: 82.0 },
        { name: 'Іслам', percentage: 10.0 },
        { name: 'Народні вірування', percentage: 6.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 2.0 }
      ]
    }
  },
  MUS: {
    continent: 'Africa',
    demographics: {
      capital_uk: 'Порт-Луї',
      capital_en: 'Port Louis',
      languages_uk: 'Англійська, Французька',
      languages_en: 'English, French',
      gini: 36.8,
      currency_uk: 'Маврикійська рупія (MUR)',
      currency_en: 'Mauritian rupee (Rs)',
      drivingSide: 'left',
      area: 2040,
      population: 1260000,
      gdp: 11500,
      military_percent: 0.2,
      military_active: 0,
      macro_tax: 22.0
    },
    indexes: {
      democracy: 8.14,
      safety: 72,
      healthcare: 62,
      ev: 5,
      internet: 80,
      peak: 828,
      tax: 15,
      energy: 25,
      salary: 900,
      col: 45,
      system: 'Парламентська республіка'
    },
    religions: {
      dominant_religion: 'Індуїзм',
      dominant_percentage: 48.5,
      stats: [
        { name: 'Індуїзм', percentage: 48.5 },
        { name: 'Християнство', percentage: 32.7 },
        { name: 'Іслам', percentage: 17.3 },
        { name: 'Інші', percentage: 1.5 }
      ]
    }
  },
  GRL: {
    continent: 'North America',
    demographics: {
      capital_uk: 'Нуук',
      capital_en: 'Nuuk',
      languages_uk: 'Гренландська (калааллісут), Данська',
      languages_en: 'Greenlandic, Danish',
      gini: 33.0,
      currency_uk: 'Данська крона (DKK)',
      currency_en: 'Danish krone (kr)',
      drivingSide: 'right',
      area: 2166086,
      population: 56600,
      gdp: 54000,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 36.0
    },
    indexes: {
      democracy: 8.50,
      safety: 75,
      healthcare: 70,
      ev: 5,
      internet: 45,
      peak: 3694,
      tax: 36,
      energy: 75,
      salary: 2800,
      col: 75,
      system: 'Парламентська республіка'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 95.0,
      stats: [
        { name: 'Християнство', percentage: 95.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 3.5 },
        { name: 'Народні вірування', percentage: 1.5 }
      ]
    }
  },
  ATA: {
    continent: 'Antarctica',
    demographics: {
      capital_uk: 'Південний полюс',
      capital_en: 'South Pole',
      languages_uk: 'Міжнародні мови дослідницьких місій',
      languages_en: 'International research languages',
      gini: 0.0,
      currency_uk: 'Долар США / Мультивалютний',
      currency_en: 'US dollar / Multicurrency',
      drivingSide: 'right',
      area: 14200000,
      population: 4000,
      gdp: 0,
      military_percent: 0.0,
      military_active: 0,
      macro_tax: 0.0
    },
    indexes: {
      democracy: 10.0,
      safety: 99,
      healthcare: 70,
      ev: 5,
      internet: 10,
      peak: 4892,
      tax: 0,
      energy: 15,
      salary: 3000,
      col: 90,
      system: 'Міжнародна територія за Договором про Антарктику'
    },
    religions: {
      dominant_religion: 'Християнство',
      dominant_percentage: 70.0,
      stats: [
        { name: 'Християнство', percentage: 70.0 },
        { name: 'Атеїзм/Нерелігійні', percentage: 30.0 }
      ]
    }
  }
};
