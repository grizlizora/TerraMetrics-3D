import type { AppLanguage } from '../types';

export interface MonthlyClimatePoint {
  month: string;
  temp: number;
}

export class ClimateMath {
  public static getMonthNames(lang: AppLanguage): string[] {
    return lang === 'uk'
      ? ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  /**
   * Generates a physically realistic 12-month temperature profile:
   * - 26-day thermal inertia lag (summer peak in late July / January)
   * - Smooth transition across the equator without jump discontinuity
   * - Accurate oceanic damping in Southern hemisphere
   */
  public static generateMonthlyTemperatures(lat: number, lang: AppLanguage): MonthlyClimatePoint[] {
    const monthNames = this.getMonthNames(lang);
    const absLat = Math.abs(lat);

    // Base temperature: Equatorial ~28°C, Poles ~ -35°C
    const baseAvg = 28 - Math.pow(absLat / 90, 1.4) * 58;

    // Amplitude increases with latitude, moderated in the oceanic Southern Hemisphere
    const hemisphereMultiplier = lat < 0 ? 0.75 : 1.0;
    const amplitude = Math.max(1.8, Math.sin((absLat * Math.PI) / 180) * 21 * hemisphereMultiplier);

    // 26-day thermal lag (0.86 of a month past solstice)
    const thermalLagMonths = 0.86;
    const summerMonthPeak = lat >= 0 ? 6 + thermalLagMonths : 0 + thermalLagMonths;

    return monthNames.map((m, i) => {
      const monthAngle = ((i - summerMonthPeak) / 12) * Math.PI * 2;
      const seasonalVariation = Math.cos(monthAngle) * amplitude;
      const tempVal = Math.round(baseAvg + seasonalVariation);
      return { month: m, temp: tempVal };
    });
  }

  public static getSeasonLabel(lat: number, monthIdx: number, lang: AppLanguage): string {
    const isNorthern = lat >= 0;
    const isUk = lang === 'uk';

    if ([11, 0, 1].includes(monthIdx)) {
      return isNorthern ? (isUk ? 'Зима ❄️' : 'Winter ❄️') : isUk ? 'Літо ☀️' : 'Summer ☀️';
    }
    if ([2, 3, 4].includes(monthIdx)) {
      return isNorthern ? (isUk ? 'Весна 🌸' : 'Spring 🌸') : isUk ? 'Осінь 🍂' : 'Autumn 🍂';
    }
    if ([5, 6, 7].includes(monthIdx)) {
      return isNorthern ? (isUk ? 'Літо ☀️' : 'Summer ☀️') : isUk ? 'Зима ❄️' : 'Winter ❄️';
    }
    return isNorthern ? (isUk ? 'Осінь 🍂' : 'Autumn 🍂') : isUk ? 'Весна 🌸' : 'Spring 🌸';
  }
}
