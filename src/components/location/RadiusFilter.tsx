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
    <div className={`flex items-center space-x-1.5 ${className}`}>
      <span className="text-[10px] font-mono font-semibold text-[#C5A064] uppercase tracking-widest">
        Radius:
      </span>
      <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5" role="group" aria-label="Distance Radius">
        {RADIUS_OPTIONS.map((radius) => {
          const isSelected = selectedRadius === radius;
          return (
            <button
              key={radius}
              type="button"
              disabled={disabled}
              onClick={() => onChange(radius)}
              aria-pressed={isSelected}
              className={`px-2.5 py-0.5 text-xs font-mono rounded-md transition-all ${
                isSelected
                  ? 'bg-[#C5A064]/20 text-[#F4F2ED] border border-[#C5A064]/40 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {radius} km
            </button>
          );
        })}
      </div>
    </div>
  );
};
