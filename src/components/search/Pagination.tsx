import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex items-center justify-between border-t border-cream-200/10 pt-6 px-1 ${className}`}
    >
      <div className="text-xs font-mono text-cream-200/50">
        Showing <span className="font-medium text-amber-300">{startItem}</span> to{' '}
        <span className="font-medium text-amber-300">{endItem}</span> of{' '}
        <span className="font-medium text-cream-100">{totalItems}</span> results
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="inline-flex items-center px-3.5 py-1.5 border border-cream-200/15 rounded-lg text-xs font-mono uppercase tracking-wider text-cream-200 bg-cream-100/[0.05] hover:bg-cream-100/[0.1] hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          <span>Previous</span>
        </button>

        <span className="text-xs font-mono text-cream-200/60 px-2">
          Page {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="inline-flex items-center px-3.5 py-1.5 border border-cream-200/15 rounded-lg text-xs font-mono uppercase tracking-wider text-cream-200 bg-cream-100/[0.05] hover:bg-cream-100/[0.1] hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </nav>
  );
};
