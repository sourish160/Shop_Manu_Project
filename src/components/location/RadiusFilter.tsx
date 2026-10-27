import React from 'react';
import { RADIUS_OPTIONS, RadiusOption } from '../../utils/geolocation';

interface RadiusFilterProps {
  selectedRadius: number;
  onChange: (radius: RadiusOption) => void;
  disabled?: boolean;
  className?: string;
}

export const RadiusFilter: React.FC<RadiusFilterProps> = ({
  selectedRadius,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/50">
        Radius:
      </span>
      <div className="inline-flex border border-cream-200/15 bg-[#120E0C] p-0.5 rounded-lg" role="group" aria-label="Distance Radius">
        {RADIUS_OPTIONS.map((radius) => {
          const isSelected = selectedRadius === radius;
          return (
            <button
              key={radius}
              type="button"
              disabled={disabled}
              onClick={() => onChange(radius)}
              aria-pressed={isSelected}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                isSelected
                  ? 'bg-amber-400 text-espresso-950 font-semibold'
                  : 'text-cream-200/70 hover:text-cream-100 hover:bg-cream-100/[0.08] disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              {radius}km
            </button>
          );
        })}
      </div>
    </div>
  );
};
