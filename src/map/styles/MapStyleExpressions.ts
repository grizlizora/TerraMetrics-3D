import type { SubMode } from '../../types';

export class MapStyleExpressions {
  public static getFillColorExpression(subMode: SubMode): any {
    switch (subMode) {
      case 'religion':
        return [
          'match',
          ['coalesce', ['to-string', ['get', 'dominant_religion']], ''],
          'Християнство',
          '#3b82f6',
          'Іслам',
          '#10b981',
          'Індуїзм',
          '#f59e0b',
          'Буддизм',
          '#ec4899',
          'Атеїзм/Нерелігійні',
          '#8b5cf6',
          'Народні вірування',
          '#14b8a6',
          'Юдаїзм',
          '#6366f1',
          '#64748b',
        ];

      case 'population':
        return [
          'interpolate',
          ['exponential', 1.6],
          ['coalesce', ['get', 'population'], 0],
          0,
          '#1e293b',
          5000000,
          '#0284c7',
          30000000,
          '#3b82f6',
          100000000,
          '#8b5cf6',
          500000000,
          '#d946ef',
          1400000000,
          '#f43f5e',
        ];

      case 'demographics':
        return [
          'case',
          ['==', ['coalesce', ['get', 'gini'], 0], 0],
          '#475569',
          [
            'interpolate',
            ['linear'],
            ['get', 'gini'],
            24,
            '#10b981',
            32,
            '#06b6d4',
            38,
            '#3b82f6',
            45,
            '#f59e0b',
            55,
            '#ef4444',
          ],
        ];

      case 'economy':
        return [
          'case',
          ['==', ['coalesce', ['get', 'gdpPerCapita'], 0], 0],
          '#334155',
          [
            'interpolate',
            ['linear'],
            ['get', 'gdpPerCapita'],
            1000,
            '#ef4444',
            5000,
            '#f97316',
            15000,
            '#eab308',
            35000,
            '#22c55e',
            75000,
            '#06b6d4',
          ],
        ];

      case 'politics':
        return [
          'case',
          ['==', ['coalesce', ['get', 'democracyIndex'], 0], 0],
          '#475569',
          [
            'interpolate',
            ['linear'],
            ['get', 'democracyIndex'],
            1.5,
            '#ef4444',
            4.0,
            '#f97316',
            6.0,
            '#eab308',
            8.0,
            '#10b981',
            9.5,
            '#06b6d4',
          ],
        ];

      case 'military':
        return [
          'case',
          ['==', ['coalesce', ['get', 'militarySpending'], 0], 0],
          '#475569',
          [
            'interpolate',
            ['linear'],
            ['get', 'militarySpending'],
            0.5,
            '#10b981',
            1.5,
            '#3b82f6',
            2.8,
            '#f59e0b',
            4.5,
            '#ef4444',
          ],
        ];

      case 'geography':
        return [
          'case',
          ['==', ['coalesce', ['get', 'highestPeak'], 0], 0],
          '#334155',
          [
            'interpolate',
            ['linear'],
            ['get', 'highestPeak'],
            200,
            '#10b981',
            1500,
            '#eab308',
            3500,
            '#f97316',
            5500,
            '#8b5cf6',
            8500,
            '#ffffff',
          ],
        ];

      case 'resources':
        return [
          'case',
          ['==', ['coalesce', ['get', 'cleanEnergy'], 0], 0],
          '#334155',
          [
            'interpolate',
            ['linear'],
            ['get', 'cleanEnergy'],
            5,
            '#ef4444',
            25,
            '#f97316',
            50,
            '#eab308',
            75,
            '#10b981',
            95,
            '#06b6d4',
          ],
        ];

      case 'climate':
      default:
        return [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'centerLat'], 30],
          0,
          '#f97316',
          15,
          '#eab308',
          30,
          '#10b981',
          48,
          '#06b6d4',
          65,
          '#3b82f6',
          80,
          '#a855f7',
        ];
    }
  }
}
