import { Capacitor } from '@capacitor/core';
import type { CameraContext, ICameraStrategy } from '../types';
import { desktopCameraStrategy } from './DesktopCameraStrategy';
import { mobileCameraStrategy } from './MobileCameraStrategy';
import { ViewportBoundsCalculator } from '../ViewportBoundsCalculator';
import type { SheetSnap } from '../../../types';

export class CameraStrategyResolver {
  public static buildContext(
    snap: SheetSnap = 'half',
    isSidebarCollapsed = false,
    projection: 'globe' | 'mercator' = 'globe'
  ): CameraContext {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isMobile =
      typeof window !== 'undefined' &&
      (Capacitor.isNativePlatform() || windowWidth < 768);

    const safeArea = ViewportBoundsCalculator.resolveSafeAreaInsets(isMobile);

    return {
      isMobile,
      windowWidth,
      windowHeight,
      safeArea,
      sheetSnap: snap,
      isSidebarCollapsed,
      projection,
    };
  }

  public static resolve(context: CameraContext): ICameraStrategy {
    return context.isMobile ? mobileCameraStrategy : desktopCameraStrategy;
  }
}
