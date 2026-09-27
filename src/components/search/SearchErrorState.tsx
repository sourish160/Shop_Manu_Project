import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface SearchErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const SearchErrorState: React.FC<SearchErrorStateProps> = ({
  message = 'Search failed to load results. Please check your connection and try again.',
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="bg-white border border-red-200 rounded-lg p-6 sm:p-8 text-center my-6 max-w-xl mx-auto shadow-sm"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-base font-bold text-slate-900 mb-1">
        Search failed
      </h2>
      <p className="text-sm text-slate-600 mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry search</span>
        </button>
      )}
    </div>
  );
};
