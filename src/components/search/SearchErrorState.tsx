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
      className="editorial-card p-8 sm:p-10 text-center my-8 max-w-xl mx-auto rounded-2xl border border-red-500/25 bg-[#140D0B] shadow-2xl"
    >
      <div className="w-14 h-14 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mx-auto text-red-400 mb-4">
        <AlertCircle className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h2 className="font-serif text-2xl font-normal text-cream-100 mb-2">
        Unable to Load Search Results
      </h2>
      <p className="text-xs sm:text-sm text-cream-200/70 mb-6 leading-relaxed font-sans">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center space-x-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry search</span>
        </button>
      )}
    </div>
  );
};
