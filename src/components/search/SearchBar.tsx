import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Utensils, Store, MapPin, Layers } from 'lucide-react';
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
  placeholder = 'Search dishes, portions, or food shops...',
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

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

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
    }, 280);
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
        <div className="absolute left-4 pointer-events-none text-cream-200/50 flex items-center">
          <Search className={isLarge ? 'w-5 h-5 text-amber-400' : 'w-4 h-4 text-amber-400'} aria-hidden="true" />
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
          className={`w-full bg-[#14100D] text-cream-100 border border-cream-200/20 placeholder-cream-200/40 rounded-xl
            transition-all duration-200 focus:outline-none focus:border-amber-400/70 focus:bg-[#1A1410] focus:ring-1 focus:ring-amber-400/50 shadow-xl
            ${isLarge ? 'pl-12 pr-32 py-4 text-sm sm:text-base font-normal tracking-wide' : 'pl-10 pr-28 py-3 text-xs sm:text-sm font-normal tracking-wide'}
          `}
        />

        {/* Trailing Controls */}
        <div className="absolute right-2.5 flex items-center space-x-2">
          {(isSuggesting || isLoading) && (
            <div className="p-1 text-amber-400 animate-spin" aria-label="Loading suggestions">
              <Loader2 className={isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </div>
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="p-1.5 text-cream-200/50 hover:text-cream-100 transition-colors"
            >
              <X className={isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </button>
          )}

          <button
            type="submit"
            aria-label="Submit search"
            className={`font-sans uppercase tracking-widest text-[11px] font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-espresso-950 transition-all rounded-lg shadow-md active:scale-95
              ${isLarge ? 'px-4 py-2.5' : 'px-3.5 py-1.5'}
            `}
          >
            Search
          </button>
        </div>
      </form>

      {/* Real-Data Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 left-0 right-0 mt-2 bg-[#16110E] border border-cream-200/15 shadow-2xl rounded-xl overflow-hidden py-1.5 max-h-72 overflow-y-auto divide-y divide-cream-200/10 backdrop-blur-md"
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
                className={`px-4 py-3 cursor-pointer flex items-center justify-between text-left transition-colors ${
                  isHighlighted ? 'bg-amber-400/15 text-cream-100' : 'text-cream-200/80 hover:bg-cream-100/[0.06]'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="text-amber-400 flex-shrink-0">
                    {item.type === 'food' ? (
                      <Utensils className="w-4 h-4 text-amber-400" />
                    ) : item.type === 'restaurant' ? (
                      <Store className="w-4 h-4 text-amber-300" />
                    ) : item.type === 'category' ? (
                      <Layers className="w-4 h-4 text-amber-400" />
                    ) : (
                      <MapPin className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-serif font-normal text-cream-100 text-sm block truncate">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-[11px] text-cream-200/50 block truncate font-sans">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>

                <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-amber-300 bg-amber-400/10 px-2 py-0.5 border border-amber-400/20 rounded flex-shrink-0">
                  {item.type === 'food' ? 'Dish' : item.type === 'restaurant' ? 'Shop' : item.type === 'category' ? 'Category' : 'Area'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
