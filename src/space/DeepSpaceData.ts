export interface ConstellationStar {
  name: { en: string; uk: string };
  ra: number; // Right Ascension in hours (0..24)
  dec: number; // Declination in degrees (-90..+90)
  mag?: number; // Apparent visual magnitude
  color?: string; // Spectral color
}

export interface ConstellationItem {
  id: string;
  name: { en: string; uk: string };
  stars: ConstellationStar[];
  lines: Array<[number, number]>;
  color: string;
}

export interface DeepSpaceObjectItem {
  id: string;
  name: { en: string; uk: string };
  type: 'blackhole' | 'exoplanet' | 'star_peculiar' | 'galaxy' | 'nebula' | 'cluster';
  ra: number;
  dec: number;
  size: number;
  color: string;
  haloColor?: string;
}

export const CONSTELLATIONS: ConstellationItem[] = [
  {
    id: 'orion',
    name: { en: 'Orion', uk: 'Оріон' },
    stars: [
      { name: { en: 'Betelgeuse', uk: 'Бетельгейзе' }, ra: 5.9194, dec: 7.4071, mag: 0.42, color: '#ff6633' },
      { name: { en: 'Rigel', uk: 'Рігель' }, ra: 5.2423, dec: -8.2016, mag: 0.13, color: '#bbddff' },
      { name: { en: 'Bellatrix', uk: 'Беллатрікс' }, ra: 5.4189, dec: 6.3497, mag: 1.64, color: '#d0e0ff' },
      { name: { en: 'Mintaka', uk: 'Мінтака' }, ra: 5.5334, dec: -0.2991, mag: 2.23, color: '#d5e5ff' },
      { name: { en: 'Alnilam', uk: 'Альнілам' }, ra: 5.6036, dec: -1.2019, mag: 1.69, color: '#d5e5ff' },
      { name: { en: 'Alnitak', uk: 'Альнітак' }, ra: 5.6793, dec: -1.9426, mag: 1.77, color: '#d5e5ff' },
      { name: { en: 'Saiph', uk: 'Саїф' }, ra: 5.7959, dec: -9.6696, mag: 2.07, color: '#bbd5ff' },
    ],
    lines: [
      [0, 2], [2, 3], [3, 4], [4, 5], [0, 5],
      [3, 1], [5, 6], [1, 6],
    ],
    color: '#aaccff',
  },
  {
    id: 'ursa_major',
    name: { en: 'Ursa Major (Big Dipper)', uk: 'Велика Ведмедиця' },
    stars: [
      { name: { en: 'Dubhe', uk: 'Дубхе' }, ra: 11.0621, dec: 61.7508, mag: 1.79, color: '#ffddaa' },
      { name: { en: 'Merak', uk: 'Мерак' }, ra: 11.0307, dec: 56.3824, mag: 2.37, color: '#ffffff' },
      { name: { en: 'Phecda', uk: 'Фекда' }, ra: 11.8971, dec: 53.6948, mag: 2.44, color: '#ffffff' },
      { name: { en: 'Megrez', uk: 'Мегрез' }, ra: 12.2514, dec: 57.0326, mag: 3.31, color: '#ffffff' },
      { name: { en: 'Alioth', uk: 'Аліот' }, ra: 12.9004, dec: 55.9598, mag: 1.77, color: '#ffffff' },
      { name: { en: 'Mizar', uk: 'Міцар' }, ra: 13.3987, dec: 54.9254, mag: 2.23, color: '#ffffff' },
      { name: { en: 'Alkaid', uk: 'Алькаїд' }, ra: 13.7923, dec: 49.3133, mag: 1.86, color: '#bbddff' },
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [3, 4], [4, 5], [5, 6],
    ],
    color: '#aaccff',
  },
  {
    id: 'cassiopeia',
    name: { en: 'Cassiopeia', uk: 'Кассіопея' },
    stars: [
      { name: { en: 'Caph', uk: 'Каф' }, ra: 0.1529, dec: 59.1498, mag: 2.28, color: '#fff0dd' },
      { name: { en: 'Schedar', uk: 'Шедар' }, ra: 0.6751, dec: 56.5373, mag: 2.24, color: '#ffcc88' },
      { name: { en: 'Gamma Cas', uk: 'Гамма Кассіопеї' }, ra: 0.9453, dec: 60.7167, mag: 2.15, color: '#bbddff' },
      { name: { en: 'Ruchbah', uk: 'Рукбах' }, ra: 1.4297, dec: 60.2353, mag: 2.68, color: '#ffffff' },
      { name: { en: 'Segin', uk: 'Сегін' }, ra: 1.9067, dec: 63.6701, mag: 3.37, color: '#bbddff' },
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4],
    ],
    color: '#aaccff',
  },
  {
    id: 'cygnus',
    name: { en: 'Cygnus (Northern Cross)', uk: 'Лебідь (Північний Хрест)' },
    stars: [
      { name: { en: 'Deneb', uk: 'Денеб' }, ra: 20.6970, dec: 45.2803, mag: 1.25, color: '#ffffff' },
      { name: { en: 'Albireo', uk: 'Альбірео' }, ra: 19.5126, dec: 27.9597, mag: 3.05, color: '#ffbb44' },
      { name: { en: 'Sadr', uk: 'Садр' }, ra: 20.3731, dec: 40.2567, mag: 2.23, color: '#fff5ea' },
      { name: { en: 'Gienah', uk: 'Гієнах' }, ra: 20.7700, dec: 33.9702, mag: 2.48, color: '#ffeedd' },
      { name: { en: 'Rukh', uk: 'Рух' }, ra: 19.7496, dec: 45.1308, mag: 2.87, color: '#bbddff' },
    ],
    lines: [
      [0, 2], [2, 1], [4, 2], [2, 3],
    ],
    color: '#aaccff',
  },
  {
    id: 'crux',
    name: { en: 'Southern Cross', uk: 'Південний Хрест' },
    stars: [
      { name: { en: 'Acrux', uk: 'Акрукс' }, ra: 12.4433, dec: -63.0991, mag: 0.77, color: '#bbddff' },
      { name: { en: 'Gacrux', uk: 'Гакрукс' }, ra: 12.5194, dec: -57.1122, mag: 1.64, color: '#ff6633' },
      { name: { en: 'Mimosa', uk: 'Мімоза' }, ra: 12.7954, dec: -59.6889, mag: 1.25, color: '#bbddff' },
      { name: { en: 'Imai', uk: 'Імаї' }, ra: 12.2524, dec: -58.7497, mag: 2.79, color: '#bbddff' },
    ],
    lines: [
      [0, 1], [2, 3],
    ],
    color: '#aaccff',
  },
];

export const DEEP_SPACE_OBJECTS: DeepSpaceObjectItem[] = [
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

  // ✨ Peculiar Stars (Synced with exact J2000 coordinates)
  { id: 'uy_scuti', name: { en: 'UY Scuti (Hypergiant)', uk: 'UY Щита (Гіпергігант)' }, type: 'star_peculiar', ra: 18.46, dec: -12.46, size: 4.0, color: '#ff2200' },
  { id: 'stephenson_2_18', name: { en: 'Stephenson 2-18', uk: 'Стефенсон 2-18 (Супергігант)' }, type: 'star_peculiar', ra: 18.66, dec: -6.08, size: 4.2, color: '#ff3311' },
  { id: 'vy_canis_majoris', name: { en: 'VY Canis Majoris', uk: 'VY Великого Пса (Гіпергігант)' }, type: 'star_peculiar', ra: 7.38, dec: -25.76, size: 3.8, color: '#ff4422' },
  { id: 'eta_carinae', name: { en: 'Eta Carinae (Luminous Blue Variable)', uk: 'Ета Кіля (Яскрава Блакитна Змінна)' }, type: 'star_peculiar', ra: 10.75, dec: -59.68, size: 3.5, color: '#ffaa44' },

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
  { id: 'triangulum_galaxy', name: { en: 'Triangulum Galaxy (M33)', uk: 'Галактика Трикутника (M33)' }, type: 'galaxy', ra: 1.56, dec: 30.66, size: 3.5, color: '#ccaaff' },
  { id: 'lmc', name: { en: 'Large Magellanic Cloud', uk: 'Велика Магелланова Хмара' }, type: 'galaxy', ra: 5.39, dec: -69.75, size: 5.0, color: '#b0c4de' },
  { id: 'smc', name: { en: 'Small Magellanic Cloud', uk: 'Мала Магелланова Хмара' }, type: 'galaxy', ra: 0.88, dec: -72.80, size: 3.8, color: '#a0b0d0' },
];
