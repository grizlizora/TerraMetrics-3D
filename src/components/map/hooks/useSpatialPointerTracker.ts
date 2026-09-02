import { useEffect, useRef, useCallback } from 'react';

export function useSpatialPointerTracker() {
  const lastPointerXRef = useRef(
    typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  );

  // Return stereo panning [-1.0 ... +1.0] for spatial audio
  const getPointerPanX = useCallback(() => {
    if (typeof window === 'undefined') return 0;
    const width = window.innerWidth || 1;
    const normalized = (lastPointerXRef.current / width - 0.5) * 2.0;
    return Math.max(-1.0, Math.min(1.0, normalized));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePointerX = (e: MouseEvent | TouchEvent) => {
      const clientX =
        'touches' in e && e.touches[0]
          ? e.touches[0].clientX
          : (e as MouseEvent).clientX;
      if (typeof clientX === 'number') {
        lastPointerXRef.current = clientX;
      }
    };

    window.addEventListener('pointerdown', updatePointerX, { passive: true });
    window.addEventListener('touchstart', updatePointerX, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', updatePointerX);
      window.removeEventListener('touchstart', updatePointerX);
    };
  }, []);

  return { getPointerPanX };
}
