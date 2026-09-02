/**
 * DOM utilities for TerraMetrics-3D
 */

/**
 * Verifies whether a given click/pointer target belongs to an interactive element
 * (button, input, select, slider, link, tab, or marked with .no-drag).
 */
export const isInteractiveElement = (target: HTMLElement | null): boolean => {
  if (!target) return false;
  return !!target.closest(
    'button, input, textarea, select, a, [role="button"], [role="slider"], [role="tab"], .no-drag, [data-no-drag="true"]'
  );
};
