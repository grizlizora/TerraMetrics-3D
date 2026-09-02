import { useRef, useEffect, useCallback } from 'react';
import type { SheetSnap } from '../types';
import { audioManager } from '../audio/AudioManager';
import { TerraHaptics } from '../native/TerraHaptics';

export interface UseSheetGesturesOptions {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  activeSnap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
}

export interface TouchSample {
  y: number;
  time: number;
}

export interface SnapPoints {
  full: number;
  half: number;
  peek: number;
  closed: number;
  fullHeight: number;
  sat: number;
  sab: number;
}

export function getDOMSafeAreaInsets(): { sat: number; sab: number } {
  if (typeof document === 'undefined') return { sat: 0, sab: 0 };
  let probe = document.getElementById('safe-area-probe');
  if (!probe) {
    probe = document.createElement('div');
    probe.id = 'safe-area-probe';
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden;z-index:-9999;';
    document.body.appendChild(probe);
  }
  const cs = getComputedStyle(probe);
  const sat = parseFloat(cs.paddingTop) || 0;
  const sab = parseFloat(cs.paddingBottom) || 0;
  return { sat, sab };
}

export function useSheetGestures({ sheetRef, activeSnap, onSnapChange }: UseSheetGesturesOptions) {
  const isDragging = useRef(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const startTranslateY = useRef(0);
  const currentTranslateY = useRef(0);
  const rafId = useRef<number | null>(null);
  const touchHistory = useRef<TouchSample[]>([]);
  const isHorizontalScroll = useRef(false);
  const isVerticalLocked = useRef(false);
  const activeSnapRef = useRef<SheetSnap>(activeSnap);

  activeSnapRef.current = activeSnap;

  // Cached snap points to prevent Layout Thrashing in touchmove
  const cachedPoints = useRef<SnapPoints>({
    full: 64,
    half: 400,
    peek: 680,
    closed: 900,
    fullHeight: 900,
    sat: 0,
    sab: 0,
  });

  const updateSnapPoints = useCallback((): SnapPoints => {
    if (typeof window === 'undefined') {
      return cachedPoints.current;
    }
    const fullHeight = window.innerHeight;
    const { sat, sab } = getDOMSafeAreaInsets();

    const isSmallScreen = fullHeight < 700;
    const peekHeight = (isSmallScreen ? 140 : 174) + sab;
    const halfRatio = isSmallScreen ? 0.54 : 0.48;

    const full = Math.max(sat + 14, isSmallScreen ? 48 : 56);
    const half = Math.round(fullHeight * (1 - halfRatio));
    const peek = Math.round(fullHeight - peekHeight);
    const closed = fullHeight;

    const pts: SnapPoints = {
      full,
      half,
      peek,
      closed,
      fullHeight,
      sat,
      sab,
    };
    cachedPoints.current = pts;
    return pts;
  }, []);

  const getSnapPoints = useCallback(() => {
    return cachedPoints.current;
  }, []);

  const setTranslateY = useCallback((y: number) => {
    currentTranslateY.current = y;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
    }
  }, [sheetRef]);

  const animateToSnap = useCallback(
    (targetSnap: SheetSnap, releaseVelocity: number = 0) => {
      const points = cachedPoints.current;
      const targetY = points[targetSnap] ?? points.peek;
      const currentY = currentTranslateY.current || points[activeSnapRef.current] || points.peek;
      const distance = Math.abs(targetY - currentY);
      const duration = Math.min(400, Math.max(240, Math.round(320 + distance * 0.2 - Math.abs(releaseVelocity) * 40)));

      if (sheetRef.current) {
        sheetRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`;
        setTranslateY(targetY);
      }

      if (targetSnap !== activeSnapRef.current) {
        if (targetSnap === 'full' || (targetSnap === 'half' && activeSnapRef.current === 'peek')) {
          audioManager.playOpenPanel();
        } else {
          audioManager.playClosePanel();
        }
        TerraHaptics.selectionChanged();
        onSnapChange(targetSnap);
      }
    },
    [setTranslateY, onSnapChange, sheetRef]
  );

  const toggleSnap = useCallback(() => {
    if (activeSnapRef.current === 'peek') {
      animateToSnap('half');
    } else if (activeSnapRef.current === 'half') {
      animateToSnap('peek');
    } else {
      animateToSnap('half');
    }
  }, [animateToSnap]);

  // Initial & external snap sync
  useEffect(() => {
    updateSnapPoints();
    if (isDragging.current) return;
    const points = cachedPoints.current;
    const targetY = points[activeSnap] ?? points.peek;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)';
      setTranslateY(targetY);
    }
  }, [activeSnap, updateSnapPoints, setTranslateY, sheetRef]);

  // Window resize & orientation change handler
  useEffect(() => {
    const handleResize = () => {
      updateSnapPoints();
      if (isDragging.current) return;
      const points = cachedPoints.current;
      const targetY = points[activeSnapRef.current] ?? points.peek;
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none';
        setTranslateY(targetY);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateSnapPoints, setTranslateY, sheetRef]);

  const handleTouchStart = (e: React.TouchEvent) => {
    updateSnapPoints();
    const touch = e.touches[0];
    isDragging.current = true;
    isHorizontalScroll.current = false;
    isVerticalLocked.current = false;
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;

    // In-flight catch: if animating, read current live transform matrix so sheet doesn't jump
    if (sheetRef.current) {
      try {
        const transformStr = window.getComputedStyle(sheetRef.current).transform;
        if (transformStr && transformStr !== 'none') {
          const matrix = new DOMMatrixReadOnly(transformStr);
          if (Number.isFinite(matrix.m42) && matrix.m42 > 0) {
            currentTranslateY.current = matrix.m42;
          }
        }
      } catch {
        // Fallback to cached position
      }
      sheetRef.current.style.transition = 'none';
    }

    startTranslateY.current = currentTranslateY.current;
    touchHistory.current = [{ y: touch.clientY, time: performance.now() }];
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isHorizontalScroll.current) return;

    const touch = e.touches[0];
    const dy = touch.clientY - touchStartY.current;
    const dx = touch.clientX - touchStartX.current;

    // Direction locking
    if (!isVerticalLocked.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        isHorizontalScroll.current = true;
        return;
      }
      isVerticalLocked.current = true;
    }

    const now = performance.now();
    touchHistory.current.push({ y: touch.clientY, time: now });
    if (touchHistory.current.length > 5) touchHistory.current.shift();

    let newY = startTranslateY.current + dy;
    const points = cachedPoints.current;

    // Apple Rubber-Banding with extended natural resistance
    if (newY < points.full) {
      const overdrag = points.full - newY;
      const coefficient = 0.45;
      const maxResistance = 100;
      const dampedOverdrag = (overdrag * coefficient * maxResistance) / (overdrag + maxResistance);
      newY = points.full - dampedOverdrag;
    } else if (newY > points.peek) {
      const overdrag = newY - points.peek;
      const coefficient = 0.45;
      const maxResistance = 100;
      const dampedOverdrag = (overdrag * coefficient * maxResistance) / (overdrag + maxResistance);
      newY = points.peek + dampedOverdrag;
    }

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setTranslateY(newY);
    });
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    const history = touchHistory.current;
    let velocity = 0;
    const now = performance.now();

    if (history.length >= 2) {
      const last = history[history.length - 1];
      if (now - last.time < 90) {
        const first = history[0];
        const dt = last.time - first.time;
        if (dt > 10) {
          velocity = (last.y - first.y) / dt;
        }
      }
    }

    const points = cachedPoints.current;
    const currentY = currentTranslateY.current;

    // Projected landing position with 220ms flick momentum
    const projectedY = currentY + velocity * 220;

    let targetSnap: SheetSnap = 'peek';

    if (Math.abs(velocity) > 0.45) {
      if (velocity < -0.45) {
        // Flick up: fast flick jumps directly to full
        if (velocity < -1.1) {
          targetSnap = 'full';
        } else {
          targetSnap = projectedY < (points.full + points.half) / 2 ? 'full' : 'half';
        }
      } else {
        // Flick down: fast flick jumps directly to peek
        if (velocity > 1.1) {
          targetSnap = 'peek';
        } else {
          targetSnap = projectedY > (points.half + points.peek) / 2 ? 'peek' : 'half';
        }
      }
    } else {
      // Positional closest snap
      const dFull = Math.abs(currentY - points.full);
      const dHalf = Math.abs(currentY - points.half);
      const dPeek = Math.abs(currentY - points.peek);

      if (dFull <= dHalf && dFull <= dPeek) targetSnap = 'full';
      else if (dHalf <= dFull && dHalf <= dPeek) targetSnap = 'half';
      else targetSnap = 'peek';
    }

    animateToSnap(targetSnap, velocity);
  };

  return {
    bindHeaderTouch: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
    animateToSnap,
    toggleSnap,
    getSnapPoints,
  };
}
