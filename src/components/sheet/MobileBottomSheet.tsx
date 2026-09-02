import React, { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { CategorySubmodeBar } from '../common/CategorySubmodeBar';
import { SheetGrabHandle } from './header/SheetGrabHandle';
import { SheetEntityBanner } from './header/SheetEntityBanner';
import { SheetContentRouter } from './SheetContentRouter';
import { useSheetGestures } from '../../hooks/useSheetGestures';
import { useEntityDetails } from '../../hooks/useEntityDetails';

export const MobileBottomSheet: React.FC = React.memo(() => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetSnap = useAppStore((s) => s.sheetSnap);
  const setSheetSnap = useAppStore((s) => s.setSheetSnap);

  const {
    selectedCountryIso,
    countryProps,
    continentStats,
    isCountry,
    title,
    subtitle,
    isRefreshing,
    copied,
    dataVersion,
    subMode,
    handleManualSync,
    handleCopySummary,
    resetSelection,
    resetToWorld,
  } = useEntityDetails();

  const { bindHeaderTouch, animateToSnap, toggleSnap } = useSheetGestures({
    sheetRef,
    activeSnap: sheetSnap,
    onSnapChange: setSheetSnap,
  });

  return (
    <>
      {sheetSnap === 'full' && (
        <div
          onClick={() => animateToSnap('peek')}
          role="button"
          tabIndex={0}
          aria-label="Закрити аналітичну шторку"
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              animateToSnap('peek');
            }
          }}
          className="fixed inset-0 z-35 bg-black/40 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"
        />
      )}

      <div
        ref={sheetRef}
        role="region"
        aria-label="Аналітична панель даних"
        aria-expanded={sheetSnap !== 'peek'}
        className="fixed inset-x-0 top-0 z-40 max-w-xl mx-auto flex flex-col pointer-events-auto select-none px-2 sm:px-4"
        style={{
          height: 'calc(100dvh + 120px)',
          contain: 'layout style',
          willChange: 'transform',
          transform: 'translate3d(0, 100%, 0)',
          touchAction: 'pan-y',
        }}
      >
        <LiquidGlassPanel
          intensity="high"
          className="w-full h-full flex flex-col rounded-t-[32px] rounded-b-none shadow-2xl overflow-hidden"
        >
          {/* Header Drag Zone */}
          <div
            {...bindHeaderTouch}
            style={{ touchAction: 'none' }}
            className="flex flex-col gap-2 p-3 pb-2.5 border-b border-black/5 dark:border-white/10 shrink-0 cursor-grab active:cursor-grabbing select-none"
          >
            <SheetGrabHandle
              onToggleSnap={toggleSnap}
              onExpandFull={() => animateToSnap('full')}
            />
            <SheetEntityBanner
              title={title}
              subtitle={subtitle}
              selectedCountryIso={selectedCountryIso}
              sheetSnap={sheetSnap}
              copied={copied}
              isRefreshing={isRefreshing}
              onToggleSnap={toggleSnap}
              onResetCountry={resetSelection}
              onResetWorld={resetToWorld}
              onCopySummary={handleCopySummary}
              onManualSync={handleManualSync}
            />
            <CategorySubmodeBar variant="mobile" />
          </div>

          {/* Scrollable Analytics Content Area */}
          <div
            className="flex-1 overflow-y-auto custom-scrollbar p-3.5 pt-2 pb-[calc(var(--sab)+32px)] overscroll-contain select-text"
            style={{ touchAction: 'pan-y' }}
          >
            <SheetContentRouter
              subMode={subMode}
              dataVersion={dataVersion}
              countryProps={countryProps}
              continentStats={continentStats}
              isCountry={isCountry}
            />
          </div>
        </LiquidGlassPanel>
      </div>
    </>
  );
});
