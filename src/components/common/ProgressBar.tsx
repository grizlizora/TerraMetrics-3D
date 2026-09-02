import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  colorClass?: string;
  className?: string;
  label?: string;
  valueLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color,
  colorClass,
  className = '',
  label,
  valueLabel,
}) => {
  const finalColor = colorClass || color || 'bg-blue-500';
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {(label || valueLabel) && (
        <div className="flex justify-between items-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <span>{label}</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{valueLabel || `${clamped.toFixed(1)}%`}</span>
        </div>
      )}
      <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${finalColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
