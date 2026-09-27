import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Utensils, Store, MapPin } from 'lucide-react';
import { fetchSearchSuggestions, SearchSuggestion } from '../../services/searchService';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  size?: 'default' | 'large';
  showSuggestions?: boolean;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  onSearch,
  placeholder = 'Search food or restaurant',
  autoFocus = false,
  className = '',
  size = 'default',
  showSuggestions = true,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external initialValue if it changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Handle outside clicks to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightedIndex(-1);

    if (!showSuggestions || !val.trim() || val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSuggesting(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await fetchSearchSuggestions(val);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 280); // 280ms debounce
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
    onSearch('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    onSearch(query.trim());
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => {
    setQuery(item.title);
    setIsOpen(false);
    onSearch(item.title);
  };

  // Keyboard navigation through suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isLarge = size === 'large';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} role="search" className="relative flex items-center">
        {/* Leading Search Icon */}
        <div className="absolute left-3.5 sm:left-4 pointer-events-none text-slate-400 flex items-center">
          <Search className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search food or restaurant"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          className={`w-full bg-white text-slate-900 border border-slate-300 rounded-lg placeholder-slate-400
            transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
            ${isLarge ? 'pl-11 pr-24 py-3.5 text-base sm:text-lg shadow-sm' : 'pl-10 pr-20 py-2.5 text-sm'}
          `}
        />

        {/* Trailing Controls: Loading Spinner, Clear Button, Search Action */}
        <div className="absolute right-2 flex items-center space-x-1">
          {(isSuggesting || isLoading) && (
            <div className="p-1.5 text-slate-400 animate-spin" aria-label="Loading suggestions">
              <Loader2 className={isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </div>
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className={isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </button>
          )}

          <button
            type="submit"
            aria-label="Submit search"
            className={`font-medium rounded text-white bg-slate-900 hover:bg-slate-800 transition-colors
              ${isLarge ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'}
            `}
          >
            Search
          </button>
        </div>
      </form>

      {/* Debounced Real-Data Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 max-h-72 overflow-y-auto divide-y divide-slate-100"
        >
          {suggestions.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelectSuggestion(item)}
                className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-left transition-colors ${
                  isHighlighted ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="text-slate-400 flex-shrink-0">
                    {item.type === 'food' ? (
                      <Utensils className="w-4 h-4" />
                    ) : item.type === 'restaurant' ? (
                      <Store className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-medium text-slate-900 text-sm block truncate">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-xs text-slate-500 block truncate">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>

                <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                  {item.type === 'food' ? 'Food' : item.type === 'restaurant' ? 'Restaurant' : 'Location'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
