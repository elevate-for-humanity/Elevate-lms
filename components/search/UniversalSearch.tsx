'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight, Building2, Code, Briefcase, GraduationCap, Sparkles } from 'lucide-react';

// Types for search results
interface SearchItem {
  id: string;
  item_id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  audiences: string[];
  image?: string;
  price?: string;
  badge?: string;
}

type Audience = 'students' | 'organizations' | 'developers' | 'employers' | 'everyone';

interface UniversalSearchProps {
  placeholder?: string;
  showFilters?: boolean;
  defaultAudience?: Audience;
  autoFocus?: boolean;
  onSelect?: (item: SearchItem) => void;
  className?: string;
}

const audienceFilters: { id: Audience; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'students', label: 'For Students', icon: GraduationCap },
  { id: 'organizations', label: 'For Organizations', icon: Building2 },
  { id: 'developers', label: 'For Developers', icon: Code },
  { id: 'employers', label: 'For Employers', icon: Briefcase },
];

const categoryLabels: Record<string, string> = {
  program: 'Training Program',
  course: 'Course',
  product: 'Shop',
  license: 'Platform License',
  tool: 'Tool',
  resource: 'Resource',
  page: 'Page',
  dashboard: 'Dashboard',
};

export default function UniversalSearch({
  placeholder = 'Search programs, courses, tools...',
  showFilters = true,
  defaultAudience,
  autoFocus = false,
  onSelect,
  className = '',
}: UniversalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Audience | undefined>(defaultAudience);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<SearchItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Search when query or audience changes - fetch from database
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 0) {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&audience=${selectedAudience || ''}&limit=8`);
          if (response.ok) {
            const data = await response.json();
            setResults(data.results || []);
          }
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        }
      } else {
        setResults([]);
      }
    };

    const debounce = setTimeout(fetchResults, 200);
    return () => clearTimeout(debounce);
  }, [query, selectedAudience]);

  // Load featured items for selected audience - fetch from database
  useEffect(() => {
    const fetchFeatured = async () => {
      if (selectedAudience) {
        try {
          const response = await fetch(`/api/search/featured?audience=${selectedAudience}&limit=4`);
          if (response.ok) {
            const data = await response.json();
            setFeaturedItems(data.results || []);
          }
        } catch (error) {
          console.error('Featured fetch error:', error);
          setFeaturedItems([]);
        }
      } else {
        setFeaturedItems([]);
      }
    };

    fetchFeatured();
  }, [selectedAudience]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query ? results : featuredItems;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && items[highlightedIndex]) {
          handleSelect(items[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [query, results, featuredItems, highlightedIndex]);

  const handleSelect = (item: SearchItem) => {
    if (onSelect) {
      onSelect(item);
    } else {
      router.push(item.href);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleAudienceSelect = (audience: Audience) => {
    if (selectedAudience === audience) {
      setSelectedAudience(undefined);
    } else {
      setSelectedAudience(audience);
    }
    setHighlightedIndex(-1);
  };

  const displayItems = query ? results : featuredItems;
  const showDropdown = isOpen && (displayItems.length > 0 || selectedAudience);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
          aria-label="Search"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Audience Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {audienceFilters.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedAudience === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => handleAudienceSelect(filter.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Results Header */}
          {selectedAudience && !query && (
            <div className="px-4 py-3 bg-brand-orange-50 border-b border-brand-orange-100">
              <div className="flex items-center gap-2 text-brand-orange-800">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Recommended for {audienceFilters.find(f => f.id === selectedAudience)?.label.replace('For ', '')}
                </span>
              </div>
            </div>
          )}

          {/* Results List */}
          <ul className="max-h-96 overflow-y-auto" role="listbox">
            {displayItems.map((item, index) => (
              <li key={item.id} role="option" aria-selected={highlightedIndex === index}>
                <button
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full flex items-start gap-4 p-4 text-left transition-colors ${
                    highlightedIndex === index ? 'bg-brand-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Image */}
                  {item.image && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {categoryLabels[item.category] || item.category}
                      </span>
                      {item.badge && (
                        <span className="text-xs bg-brand-orange-100 text-brand-orange-700 px-2 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 truncate">{item.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                    {item.price && (
                      <p className="text-sm font-bold text-brand-orange-600 mt-1">{item.price}</p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    highlightedIndex === index ? 'text-brand-orange-600' : 'text-gray-300'
                  }`} />
                </button>
              </li>
            ))}
          </ul>

          {/* No Results */}
          {query && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-2">No results found for "{query}"</p>
              <p className="text-sm text-gray-400">Try different keywords or browse by category</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {query ? `${results.length} results` : 'Browse or search'}
              </span>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">esc</kbd>
                  close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for header/navbar
export function CompactSearch({ className = '' }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`p-2 hover:bg-gray-100 rounded-lg transition ${className}`}
        aria-label="Open search"
      >
        <Search className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl">
        <UniversalSearch autoFocus onSelect={() => setIsExpanded(false)} />
        <button
          onClick={() => setIsExpanded(false)}
          className="mt-4 w-full py-2 text-white/80 hover:text-white text-sm"
        >
          Press ESC or click to close
        </button>
      </div>
    </div>
  );
}
