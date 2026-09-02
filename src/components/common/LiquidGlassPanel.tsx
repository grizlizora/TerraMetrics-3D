import React from 'react';

interface LiquidGlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const LiquidGlassPanel: React.FC<LiquidGlassPanelProps> = ({
  children,
  className = '',
  intensity = 'medium',
  ...props
}) => {
  const intensityStyles = {
    low: 'bg-white/75 dark:bg-zinc-900/70 backdrop-blur-md border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100',
    medium: 'bg-white/85 dark:bg-zinc-950/80 backdrop-blur-xl border-black/10 dark:border-white/15 text-zinc-900 dark:text-zinc-100',
    high: 'bg-white/90 dark:bg-black/85 backdrop-blur-2xl border-black/10 dark:border-white/20 text-zinc-900 dark:text-zinc-100',
  };

  return (
    <div
      className={`border rounded-3xl transition-all duration-300 liquid-glass-specular ${intensityStyles[intensity]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
