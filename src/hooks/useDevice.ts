import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface DeviceInfo {
  isDesktop: boolean;
  isMobile: boolean;
  isNative: boolean;
  width: number;
  height: number;
}

const DESKTOP_BREAKPOINT = 768; // px (Tailwind md)

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const isNative = Capacitor.isNativePlatform();
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isDesktop = width >= DESKTOP_BREAKPOINT;

    return {
      isDesktop,
      isMobile: !isDesktop,
      isNative,
      width,
      height,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const isNative = Capacitor.isNativePlatform();
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isDesktop = width >= DESKTOP_BREAKPOINT;

        setDeviceInfo((prev) => {
          if (
            prev.isDesktop === isDesktop &&
            prev.isMobile === !isDesktop &&
            prev.isNative === isNative &&
            Math.abs(prev.width - width) < 40 &&
            Math.abs(prev.height - height) < 40
          ) {
            return prev;
          }

          return {
            isDesktop,
            isMobile: !isDesktop,
            isNative,
            width,
            height,
          };
        });
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceInfo;
}

/**
 * Ultra-performant breakpoint hook based on matchMedia.
 * Triggers zero re-renders during window resize unless crossing the 768px desktop threshold.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
