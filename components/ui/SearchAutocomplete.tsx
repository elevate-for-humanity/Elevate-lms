
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  url?: string;
}

export interface SearchAutocompleteProps {
  Content?: string;
  results: SearchResult[];
  onSearch: (query: string) => void;
  onSelect: (result: SearchResult) => void;
  isLoading?: boolean;
  maxResults?: number;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  placeholder = 'Search programs, courses...',
  results,
  onSearch,
  onSelect,
  isLoading = false,
  maxResults = 8,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayResults = results.slice(0, maxResults);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    onSearch(value);
    setIsOpen(value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return null; return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < displayResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && displayResults[selectedIndex]) {
          handleSelect(displayResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.title);
    setIsOpen(false);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={Content}
          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          aria-label="Search"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="search-results"
          className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {isLoading ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-brand-blue-600" />
              <p className="mt-2">Searching...</p>
            </div>
          ) : displayResults.length > 0 ? (
            <ul>
              {displayResults.map((result, index) => (
                <li
                  key={result.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <button
                    onClick={() => handleSelect(result)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                      index === selectedIndex ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black truncate">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-sm text-black line-clamp-1 mt-0.5">
                            {result.description}
                          </p>
                        )}
                      </div>
                      {result.category && (
                        <span className="flex-shrink-0 text-xs px-2 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-full">
                          {result.category}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length > 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
