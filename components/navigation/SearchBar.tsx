"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Loader2, BookOpen, GraduationCap, FileText, Users, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SearchResult {
  id: string;
  type: 'program' | 'course' | 'article' | 'user' | 'page';
  title: string;
  description?: string;
  href: string;
  category?: string;
  image?: string;
}

interface Props {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

const TYPE_ICONS = {
  program: GraduationCap,
  course: BookOpen,
  article: FileText,
  user: Users,
  page: FileText,
};

const TYPE_COLORS = {
  program: 'text-brand-blue-600 bg-brand-blue-100',
  course: 'text-green-600 bg-green-100',
  article: 'text-purple-600 bg-purple-100',
  user: 'text-orange-600 bg-orange-100',
  page: 'text-gray-600 bg-gray-100',
};

export function SearchBar({ placeholder = "Search programs, courses...", className, onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch { /* Parse error ignored */ }
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const searchResults: SearchResult[] = [];

    try {
      // Search training programs
      const { data: programs } = await supabase
        .from('training_programs')
        .select('id, name, description, slug, category')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (programs) {
        programs.forEach(p => {
          searchResults.push({
            id: p.id,
            type: 'program',
            title: p.name,
            description: p.description?.substring(0, 100),
            href: `/programs/${p.slug || p.id}`,
            category: p.category,
          });
        });
      }

      // Search courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, slug')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (courses) {
        courses.forEach(c => {
          searchResults.push({
            id: c.id,
            type: 'course',
            title: c.title,
            description: c.description?.substring(0, 100),
            href: `/courses/${c.slug || c.id}`,
          });
        });
      }

      // Search help articles
      const { data: articles } = await supabase
        .from('help_articles')
        .select('id, title, excerpt, slug, category')
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(3);

      if (articles) {
        articles.forEach(a => {
          searchResults.push({
            id: a.id,
            type: 'article',
            title: a.title,
            description: a.excerpt,
            href: `/help/articles/${a.slug || a.id}`,
            category: a.category,
          });
        });
      }

      // Log search for analytics
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('search_logs').insert({
          user_id: user.id,
          query: searchQuery,
          results_count: searchResults.length,
        }).catch(() => {});
      }

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + recentSearches.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          const result = results[selectedIndex];
          saveRecentSearch(query);
          router.push(result.href);
          setIsOpen(false);
          setQuery('');
        } else if (selectedIndex >= results.length && selectedIndex < totalItems) {
          const recentIndex = selectedIndex - results.length;
          setQuery(recentSearches[recentIndex]);
        } else if (query.trim()) {
          saveRecentSearch(query);
          router.push(`/search?q=${encodeURIComponent(query)}`);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    onSearch?.(query);
    setIsOpen(false);
    setQuery('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className={`relative ${className || ''}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 py-2 w-full md:w-72 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
          aria-label="Search"
          aria-expanded={isOpen}
          aria-controls="search-results"
          role="combobox"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-blue-500 animate-spin" />
        )}
      </div>

      {isOpen && (
        <div
          ref={resultsRef}
          id="search-results"
          className="absolute top-full mt-2 w-full md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
          role="listbox"
        >
          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Results for "{query}"
              </div>
              {results.map((result, index) => {
                const Icon = TYPE_ICONS[result.type];
                const colorClass = TYPE_COLORS[result.type];
                const isSelected = index === selectedIndex;

                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    onClick={() => handleResultClick(result)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition ${
                      isSelected ? 'bg-brand-blue-50' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.title}
                      </div>
                      {result.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {result.description}
                        </div>
                      )}
                      {result.category && (
                        <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {result.category}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No results found for "{query}"</p>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="text-sm text-brand-blue-600 hover:underline mt-2 inline-block"
              >
                View all search results
              </Link>
            </div>
          )}

          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-brand-blue-600 hover:text-brand-blue-800 normal-case font-normal"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => {
                const isSelected = index + results.length === selectedIndex;
                return (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                      isSelected ? 'bg-brand-blue-50' : ''
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{search}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick links when empty */}
          {!query && recentSearches.length === 0 && (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {['CNA', 'Barber', 'HVAC', 'CDL', 'Medical Assistant'].map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search all link */}
          {query && (
            <div className="border-t border-gray-100 p-2 bg-gray-50">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-blue-600 hover:bg-white rounded-lg transition"
              >
                <Search className="w-4 h-4" />
                Search all for "{query}"
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
