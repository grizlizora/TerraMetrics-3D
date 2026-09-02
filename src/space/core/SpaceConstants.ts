import type { AppLanguage } from '../../types';

export const AU = 2348100;
export const EARTH_RADIUS = 100;
export const CELESTIAL_SPHERE_RADIUS = 45000000;
export const J2000_MS = 946728000000; // 2000-01-01T12:00:00Z

export const MOON_NAMES_SET = new Set([
  'Io',
  'Europa',
  'Ganymede',
  'Callisto',
  'Titan',
  'Charon',
]);

export const BODY_NAMES: Record<string, Record<AppLanguage, string>> = {
  Sun: { uk: '☀️ Сонце', en: '☀️ Sun' },
  Moon: { uk: '🌕 Місяць', en: '🌕 Moon' },
  Mercury: { uk: 'Меркурій', en: 'Mercury' },
  Venus: { uk: 'Венера', en: 'Venus' },
  Mars: { uk: 'Марс', en: 'Mars' },
  Jupiter: { uk: 'Юпітер', en: 'Jupiter' },
  Saturn: { uk: 'Сатурн', en: 'Saturn' },
  Uranus: { uk: 'Уран', en: 'Uranus' },
  Neptune: { uk: 'Нептун', en: 'Neptune' },
  Pluto: { uk: 'Плутон', en: 'Pluto' },
  Io: { uk: 'Іо', en: 'Io' },
  Europa: { uk: 'Європа', en: 'Europa' },
  Ganymede: { uk: 'Ганімед', en: 'Ganymede' },
  Callisto: { uk: 'Каллісто', en: 'Callisto' },
  Titan: { uk: 'Титан', en: 'Titan' },
  Charon: { uk: 'Харон', en: 'Charon' },
  Betelgeuse: { uk: 'Бетельгейзе', en: 'Betelgeuse' },
  Antares: { uk: 'Антарес', en: 'Antares' },
  Rigel: { uk: 'Рігель', en: 'Rigel' },
  'Eta Carinae': { uk: 'Ета Кіля', en: 'Eta Carinae' },
  Spica: { uk: 'Спіка', en: 'Spica' },
  Sirius: { uk: 'Сіріус', en: 'Sirius' },
  Canopus: { uk: 'Канопус', en: 'Canopus' },
  Vega: { uk: 'Вега', en: 'Vega' },
  Arcturus: { uk: 'Арктур', en: 'Arcturus' },
  Polaris: { uk: 'Полярна зоря', en: 'Polaris' },
  Deneb: { uk: 'Денеб', en: 'Deneb' },
  Altair: { uk: 'Альтаїр', en: 'Altair' },
  Aldebaran: { uk: 'Альдебаран', en: 'Aldebaran' },
  Capella: { uk: 'Капелла', en: 'Capella' },
  Pollux: { uk: 'Поллукс', en: 'Pollux' },
  Fomalhaut: { uk: 'Фомальгаут', en: 'Fomalhaut' },
};
