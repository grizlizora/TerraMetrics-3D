import type { Map as MapLibreMap } from 'maplibre-gl';
import type { ThemeMode } from '../../types';

export class MapThemeManager {
  public static applyTheme(
    map: MapLibreMap | null,
    theme: ThemeMode,
    _projection: 'globe' | 'mercator'
  ) {
    if (!map || !map.isStyleLoaded()) return;

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#060a12' : '#f0f4f8';

    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-color', bgColor);
    }

    const canvas = map.getCanvas();
    if (canvas) {
      canvas.style.backgroundColor = bgColor;
    }

    if (map.getLayer('world-base-layer')) {
      map.setPaintProperty('world-base-layer', 'fill-color', bgColor);
    }

    if (map.getLayer('satellite-layer')) {
      map.setPaintProperty('satellite-layer', 'raster-opacity', 1.0);
    }

    if (map.getLayer('country-borders')) {
      map.setPaintProperty(
        'country-borders',
        'line-color',
        isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.65)'
      );
    }

    if (map.getLayer('world-graticule-lines')) {
      map.setPaintProperty(
        'world-graticule-lines',
        'line-color',
        isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
      );
    }
  }
}
