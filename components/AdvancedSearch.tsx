"use client";

import React from 'react';
import Image from 'next/image';

import { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SearchFilters {
  category?: string[];
  duration?: string[];
  level?: string[];
  price?: string[];
  rating?: number;
}

interface SearchResult {
  id: string;
  title: string;
  category: string;
  duration: string;
  level: string;
  price: number;
  rating: number;
  students: number;
  image: string;
}

interface AdvancedSearchProps {
  onSearch?: (query: string, filters: SearchFilters) => void;
}

export function AdvancedSearch({ onSearch }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);

  const categories = ['Healthcare', 'Skilled Trades', 'Technology', 'Business'];
  const durations = ['1-4 weeks', '1-3 months', '3-6 months', '6+ months'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const priceRanges = ['Free', '$1-$500', '$501-$1000', '$1000+'];

  const handleSearch = () => {
    onSearch?.(query, filters);

    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Certified Nursing Assistant (CNA)',
        category: 'Healthcare',
        duration: '6-8 weeks',
        level: 'Beginner',
        price: 0,
        rating: 4.8,
        students: 342,
        image: '/media/programs/healthcare-1.jpg',
      },
      {
        id: '2',
        title: 'HVAC Technician',
        category: 'Skilled Trades',
        duration: '12 weeks',
        level: 'Beginner',
        price: 0,
        rating: 4.7,
        students: 256,
        image: '/media/programs/trades-1.jpg',
      },
      {
        id: '3',
        title: 'Web Development Bootcamp',
        category: 'Technology',
        duration: '16 weeks',
        level: 'Intermediate',
        price: 0,
        rating: 4.9,
        students: 189,
        image: '/media/programs/tech-1.jpg',
      },
    ];

    setResults(mockResults);
  };

  const toggleFilter = (filterType: keyof SearchFilters, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[filterType] as string[] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [filterType]: newValues.length > 0 ? newValues : undefined,
      };
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search courses, programs, skills..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="border-2"
        >
          <SlidersHorizontal size={20} className="mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-brand-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button onClick={handleSearch} className="bg-brand-blue-600 hover:bg-brand-blue-700">
          Search
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              {activeFilterCount > 0 && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {/* Category */}
              <div>
                <h4 className="font-semibold mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.category?.includes(category)}
                        onChange={() => toggleFilter('category', category)}
                        className="w-4 h-4 text-brand-blue-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <h4 className="font-semibold mb-3">Duration</h4>
                <div className="space-y-2">
                  {durations.map((duration) => (
                    <label key={duration} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.duration?.includes(duration)}
                        onChange={() => toggleFilter('duration', duration)}
                        className="w-4 h-4 text-brand-blue-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm">{duration}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <h4 className="font-semibold mb-3">Level</h4>
                <div className="space-y-2">
                  {levels.map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.level?.includes(level)}
                        onChange={() => toggleFilter('level', level)}
                        className="w-4 h-4 text-brand-blue-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h4 className="font-semibold mb-3">Price</h4>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.price?.includes(range)}
                        onChange={() => toggleFilter('price', range)}
                        className="w-4 h-4 text-brand-blue-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm">{range}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, values]) => {
            if (!values || (Array.isArray(values) && values.length === 0)) return null;

            const filterValues = Array.isArray(values) ? values : [values];
            return filterValues.map((value) => (
              <div
                key={`${key}-${value}`}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-full text-sm"
              >
                <span>{value}</span>
                <button
                  onClick={() => toggleFilter(key as keyof SearchFilters, value.toString())}
                  className="hover:text-red-900"
                >
                  <X size={14} />
                </button>
              </div>
            ));
          })}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{results.length} Results</h3>
            <select className="px-4 py-2 border rounded-lg">
              <option>Most Relevant</option>
              <option>Highest Rated</option>
              <option>Most Popular</option>
              <option>Newest</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-lg transition">
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={result.image}
                    alt={result.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-2 bg-brand-blue-600 text-white text-xs font-semibold rounded-full">
                      {result.category}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{result.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-black mb-4">
                    <span>{result.duration}</span>
                    <span>•</span>
                    <span>{result.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500">★</span>
                      <span className="font-semibold">{result.rating}</span>
                      <span className="text-sm text-black">({result.students})</span>
                    </div>
                    <div className="font-bold text-green-600">
                      {result.price === 0 ? 'FREE' : `$${result.price}`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
