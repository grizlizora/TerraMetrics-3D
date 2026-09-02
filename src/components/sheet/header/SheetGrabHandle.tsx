import React from 'react';

interface SheetGrabHandleProps {
  onToggleSnap: () => void;
  onExpandFull?: () => void;
}

export const SheetGrabHandle: React.FC<SheetGrabHandleProps> = React.memo(({ onToggleSnap, onExpandFull }) => {
  return (
    <div
      onClick={onToggleSnap}
      onDoubleClick={onExpandFull}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleSnap();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Toggle Sheet"
      className="w-full flex items-center justify-center py-1 cursor-grab active:cursor-grabbing group"
    >
      <div className="w-12 h-1.5 rounded-full bg-zinc-400/50 dark:bg-zinc-500/50 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400 transition-colors" />
    </div>
  );
});
