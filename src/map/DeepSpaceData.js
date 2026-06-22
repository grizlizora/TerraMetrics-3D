export const CONSTELLATIONS = [
  {
    id: 'orion',
    name: { en: 'Orion', uk: 'Оріон' },
    stars: [
      { name: { en: 'Betelgeuse', uk: 'Бетельгейзе' }, ra: 5.91, dec: 7.4 },
      { name: { en: 'Rigel', uk: 'Рігель' }, ra: 5.24, dec: -8.2 },
      { name: { en: 'Bellatrix', uk: 'Беллатрікс' }, ra: 5.41, dec: 6.3 },
      { name: { en: 'Mintaka', uk: 'Мінтака' }, ra: 5.53, dec: -0.3 },
      { name: { en: 'Alnilam', uk: 'Альнілам' }, ra: 5.60, dec: -1.2 },
      { name: { en: 'Alnitak', uk: 'Альнітак' }, ra: 5.67, dec: -1.9 },
      { name: { en: 'Saiph', uk: 'Саїф' }, ra: 5.79, dec: -9.7 }
    ],
    lines: [
      [0, 2], [2, 3], [3, 4], [4, 5], [0, 5], // Upper body & belt
      [3, 1], [5, 6], [1, 6]                  // Lower body
    ],
    color: '#aaccff'
  },
  {
    id: 'ursa_major',
    name: { en: 'Ursa Major (Big Dipper)', uk: 'Велика Ведмедиця' },
    stars: [
      { name: { en: 'Dubhe', uk: 'Дубхе' }, ra: 11.06, dec: 61.7 },
      { name: { en: 'Merak', uk: 'Мерак' }, ra: 11.03, dec: 56.3 },
      { name: { en: 'Phecda', uk: 'Фекда' }, ra: 11.89, dec: 53.7 },
      { name: { en: 'Megrez', uk: 'Мегрез' }, ra: 12.25, dec: 57.0 },
      { name: { en: 'Alioth', uk: 'Аліот' }, ra: 12.90, dec: 55.9 },
      { name: { en: 'Mizar', uk: 'Міцар' }, ra: 13.39, dec: 54.9 },
      { name: { en: 'Alkaid', uk: 'Алькаїд' }, ra: 13.79, dec: 49.3 }
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bowl
      [3, 4], [4, 5], [5, 6]          // Handle
    ],
    color: '#aaccff'
  },
  {
    id: 'cassiopeia',
    name: { en: 'Cassiopeia', uk: 'Кассіопея' },
    stars: [
      { name: { en: 'Caph', uk: 'Каф' }, ra: 0.15, dec: 59.1 },
      { name: { en: 'Schedar', uk: 'Шедар' }, ra: 0.67, dec: 56.5 },
      { name: { en: 'Gamma Cas', uk: 'Гамма Кассіопеї' }, ra: 0.94, dec: 60.7 },
      { name: { en: 'Ruchbah', uk: 'Рукбах' }, ra: 1.43, dec: 60.2 },
      { name: { en: 'Segin', uk: 'Сегін' }, ra: 1.90, dec: 63.6 }
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4]
    ],
    color: '#aaccff'
  },
  {
    id: 'cygnus',
    name: { en: 'Cygnus', uk: 'Лебідь' },
    stars: [
      { name: { en: 'Deneb', uk: 'Денеб' }, ra: 20.69, dec: 45.2 },
      { name: { en: 'Sadr', uk: 'Садр' }, ra: 20.37, dec: 40.2 },
      { name: { en: 'Gienah', uk: 'Дженах' }, ra: 20.80, dec: 33.9 },
      { name: { en: 'Delta Cyg', uk: 'Дельта Лебедя' }, ra: 19.75, dec: 45.1 },
      { name: { en: 'Albireo', uk: 'Альбірео' }, ra: 19.51, dec: 27.9 }
    ],
    lines: [
      [0, 1], [1, 4], // Body
      [3, 1], [1, 2]  // Wings
    ],
    color: '#aaccff'
  },
  {
    id: 'crux',
    name: { en: 'Crux', uk: 'Південний Хрест' },
    stars: [
      { name: { en: 'Acrux', uk: 'Акрукс' }, ra: 12.44, dec: -63.1 },
      { name: { en: 'Mimosa', uk: 'Мімоза' }, ra: 12.78, dec: -59.7 },
      { name: { en: 'Gacrux', uk: 'Гакрукс' }, ra: 12.52, dec: -57.1 },
      { name: { en: 'Delta Cru', uk: 'Дельта Хреста' }, ra: 12.25, dec: -58.7 }
    ],
    lines: [
      [0, 2], [1, 3]
    ],
    color: '#aaccff'
  }
];

export const DEEP_SPACE_OBJECTS = [
  // 🕳️ Black Holes
  { id: 'sagittarius_a', name: { en: 'Sagittarius A* (Black Hole)', uk: 'Стрілець А* (Чорна Діра)' }, type: 'blackhole', ra: 17.76, dec: -29.0, size: 2.5, color: '#000000', haloColor: '#ff8844' },
  { id: 'm87', name: { en: 'M87* (Black Hole)', uk: 'M87* (Чорна Діра)' }, type: 'blackhole', ra: 12.51, dec: 12.39, size: 3.0, color: '#000000', haloColor: '#ff5500' },
  { id: 'cygnus_x1', name: { en: 'Cygnus X-1 (Black Hole)', uk: 'Лебідь X-1 (Чорна Діра)' }, type: 'blackhole', ra: 19.97, dec: 35.20, size: 2.0, color: '#000000', haloColor: '#44aaff' },
  { id: 'ton_618', name: { en: 'TON 618 (Supermassive BH)', uk: 'TON 618 (Надмасивна Чорна Діра)' }, type: 'blackhole', ra: 12.47, dec: 31.47, size: 4.5, color: '#000000', haloColor: '#ffdd44' },
  { id: 'gaia_bh1', name: { en: 'Gaia BH1 (Closest BH)', uk: 'Gaia BH1 (Найближча Чорна Діра)' }, type: 'blackhole', ra: 17.48, dec: -0.58, size: 1.5, color: '#000000', haloColor: '#888888' },

  // 🪐 Exoplanets
  { id: 'proxima_b', name: { en: 'Proxima Centauri b (Exoplanet)', uk: 'Проксима Центавра b (Екзопланета)' }, type: 'exoplanet', ra: 14.49, dec: -62.68, size: 1.5, color: '#ffccaa' },
  { id: 'trappist_1', name: { en: 'TRAPPIST-1 (System)', uk: 'TRAPPIST-1 (Система)' }, type: 'exoplanet', ra: 23.10, dec: -5.04, size: 1.5, color: '#ff4444' },
  { id: 'kepler_186f', name: { en: 'Kepler-186f (Exoplanet)', uk: 'Kepler-186f (Екзопланета)' }, type: 'exoplanet', ra: 19.91, dec: 43.95, size: 1.5, color: '#44ccff' },
  { id: 'pegasi_51_b', name: { en: '51 Pegasi b (Bellerophon)', uk: '51 Пегаса b (Беллерофонт)' }, type: 'exoplanet', ra: 22.95, dec: 20.76, size: 1.8, color: '#ffaa44' },
  { id: 'hd_209458_b', name: { en: 'HD 209458 b (Osiris)', uk: 'HD 209458 b (Осіріс)' }, type: 'exoplanet', ra: 22.05, dec: 18.88, size: 1.8, color: '#aaffff' },
  { id: 'kepler_22b', name: { en: 'Kepler-22b (Exoplanet)', uk: 'Kepler-22b (Екзопланета)' }, type: 'exoplanet', ra: 19.28, dec: 47.88, size: 1.6, color: '#44ffaa' },
  { id: 'kepler_452b', name: { en: 'Kepler-452b (Earth Cousin)', uk: 'Kepler-452b (Двоюрідна Земля)' }, type: 'exoplanet', ra: 19.74, dec: 44.27, size: 1.5, color: '#aaccaa' },

  // ✨ Famous / Peculiar Stars
  { id: 'uy_scuti', name: { en: 'UY Scuti (Hypergiant)', uk: 'UY Щита (Гіпергігант)' }, type: 'star_peculiar', ra: 18.46, dec: -12.46, size: 4.0, color: '#ff2200' },
  { id: 'stephenson_2_18', name: { en: 'Stephenson 2-18', uk: 'Стефенсон 2-18 (Супергігант)' }, type: 'star_peculiar', ra: 18.66, dec: -6.08, size: 4.2, color: '#ff3311' },
  { id: 'vy_canis_majoris', name: { en: 'VY Canis Majoris', uk: 'VY Великого Пса (Гіпергігант)' }, type: 'star_peculiar', ra: 7.38, dec: -25.76, size: 3.8, color: '#ff4422' },
  { id: 'betelgeuse', name: { en: 'Betelgeuse (Red Supergiant)', uk: 'Бетельгейзе (Червоний Супергігант)' }, type: 'star_peculiar', ra: 5.92, dec: 7.41, size: 3.5, color: '#ff5533' },
  { id: 'rigel', name: { en: 'Rigel (Blue Supergiant)', uk: 'Рігель (Блакитний Супергігант)' }, type: 'star_peculiar', ra: 5.24, dec: -8.20, size: 3.2, color: '#aaddff' },
  { id: 'sirius', name: { en: 'Sirius (Brightest Star)', uk: 'Сіріус (Найяскравіша зоря)' }, type: 'star_peculiar', ra: 6.75, dec: -16.71, size: 2.5, color: '#ffffff' },
  { id: 'alpha_centauri', name: { en: 'Alpha Centauri (Closest Star)', uk: 'Альфа Центавра (Найближча зоря)' }, type: 'star_peculiar', ra: 14.66, dec: -60.83, size: 2.2, color: '#ffddaa' },
  { id: 'polaris', name: { en: 'Polaris (North Star)', uk: 'Полярна зоря' }, type: 'star_peculiar', ra: 2.53, dec: 89.26, size: 2.2, color: '#ffeecc' },

  // 🌌 Galaxies & Nebulae
  { id: 'andromeda', name: { en: 'Andromeda Galaxy', uk: 'Галактика Андромеди' }, type: 'galaxy', ra: 0.71, dec: 41.2, size: 4.0, color: '#aaccff' },
  { id: 'crab_nebula', name: { en: 'Crab Nebula', uk: 'Крабовидна туманність' }, type: 'nebula', ra: 5.57, dec: 22.0, size: 2.5, color: '#ffaa44' },
  { id: 'orion_nebula', name: { en: 'Orion Nebula (M42)', uk: 'Туманність Оріона (M42)' }, type: 'nebula', ra: 5.58, dec: -5.39, size: 3.5, color: '#ff88dd' },
  { id: 'eagle_nebula', name: { en: 'Eagle Nebula (Pillars of Creation)', uk: 'Туманність Орла (Стовпи Творіння)' }, type: 'nebula', ra: 18.31, dec: -13.81, size: 3.0, color: '#aa44ff' },
  { id: 'pleiades', name: { en: 'Pleiades (Star Cluster)', uk: 'Плеяди / Стожари (Зоряне скупчення)' }, type: 'cluster', ra: 3.79, dec: 24.11, size: 3.2, color: '#44aaff' },
  { id: 'ring_nebula', name: { en: 'Ring Nebula (M57)', uk: 'Кільцева туманність (M57)' }, type: 'nebula', ra: 18.89, dec: 33.02, size: 2.0, color: '#44ffaa' },
  { id: 'omega_centauri', name: { en: 'Omega Centauri (Globular Cluster)', uk: 'Омега Центавра (Кулясте скупчення)' }, type: 'cluster', ra: 13.44, dec: -47.47, size: 3.5, color: '#ffddaa' },
  { id: 'tarantula_nebula', name: { en: 'Tarantula Nebula', uk: 'Туманність Тарантул' }, type: 'nebula', ra: 5.64, dec: -69.10, size: 4.5, color: '#ff4488' },
  { id: 'carina_nebula', name: { en: 'Carina Nebula', uk: 'Туманність Кіля' }, type: 'nebula', ra: 10.73, dec: -59.86, size: 4.2, color: '#dd55ff' },
  { id: 'sombrero_galaxy', name: { en: 'Sombrero Galaxy', uk: 'Галактика Сомбреро' }, type: 'galaxy', ra: 12.66, dec: -11.62, size: 3.0, color: '#ffeeaa' },
  { id: 'whirlpool_galaxy', name: { en: 'Whirlpool Galaxy (M51)', uk: 'Галактика Вир (M51)' }, type: 'galaxy', ra: 13.49, dec: 47.19, size: 3.2, color: '#aaffcc' },
  { id: 'triangulum_galaxy', name: { en: 'Triangulum Galaxy (M33)', uk: 'Галактика Трикутника (M33)' }, type: 'galaxy', ra: 1.56, dec: 30.66, size: 3.5, color: '#ccaaff' }
];
