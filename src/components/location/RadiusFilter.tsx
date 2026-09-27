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
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Radius:
      </span>
      <div className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5" role="group" aria-label="Distance Radius">
        {RADIUS_OPTIONS.map((radius) => {
          const isSelected = selectedRadius === radius;
          return (
            <button
              key={radius}
              type="button"
              disabled={disabled}
              onClick={() => onChange(radius)}
              aria-pressed={isSelected}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
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
