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

        setDeviceInfo({
          isDesktop,
          isMobile: !isDesktop,
          isNative,
          width,
          height,
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
