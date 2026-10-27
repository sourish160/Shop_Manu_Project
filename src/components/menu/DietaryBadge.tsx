import React from 'react';
import { FoodVegType } from '../../lib/insforge';

interface DietaryBadgeProps {
  type: FoodVegType;
  showText?: boolean;
  size?: 'sm' | 'md';
}

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({
  type,
  showText = true,
  size = 'sm',
}) => {
  const isVeg = type === 'veg';
  const isSm = size === 'sm';

  const config = isVeg
    ? {
        label: 'Veg',
        borderColor: 'border-emerald-500/40',
        dotColor: 'bg-emerald-400',
        bgColor: 'bg-emerald-950/40',
        textColor: 'text-emerald-300',
        shape: 'circle',
      }
    : {
        label: 'Non-Veg',
        borderColor: 'border-amber-500/40',
        dotColor: 'bg-amber-400',
        bgColor: 'bg-amber-950/40',
        textColor: 'text-amber-200',
        shape: 'triangle',
      };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border ${config.borderColor} ${config.bgColor} ${config.textColor} font-mono text-[10px] uppercase tracking-wider whitespace-nowrap`}
      title={`Dietary: ${config.label}`}
    >
      {/* Icon Frame */}
      <span
        className={`inline-flex items-center justify-center border ${config.borderColor} p-[2px] shrink-0 ${
          isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'
        }`}
        aria-hidden="true"
      >
        {config.shape === 'triangle' ? (
          <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-accent-amber" />
        ) : (
          <span className={`rounded-full ${config.dotColor} ${isSm ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
        )}
      </span>

      {showText && <span className="font-medium whitespace-nowrap">{config.label}</span>}
    </span>
  );
};
