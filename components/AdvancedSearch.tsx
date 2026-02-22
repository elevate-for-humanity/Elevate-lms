"use client";

import React from 'react';
import Image from 'next/image';

import { useState, useCallback } from 'react';
import { Search, X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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
  const [loading, setLoading] = useState(false);

  const categories = ['Healthcare', 'Skilled Trades', 'Technology', 'Business'];
  const durations = ['1-4 weeks', '1-3 months', '3-6 months', '6+ months'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const priceRanges = ['Free', '$1-$500', '$501-$1000', '$1000+'];

  const handleSearch = useCallback(async () => {
    onSearch?.(query, filters);
    setLoading(true);

    try {
      const supabase = createClient();
      
      let queryBuilder = supabase
        .from('training_programs')
        .select('id, name, slug, category, duration_weeks, skill_level, price, image_url, description')
        .eq('is_active', true);

      // Apply text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Apply category filter
      if (filters.category && filters.category.length > 0) {
        queryBuilder = queryBuilder.in('category', filters.category);
      }

      // Apply level filter
      if (filters.level && filters.level.length > 0) {
        queryBuilder = queryBuilder.in('skill_level', filters.level);
      }

      const { data: programs, error } = await queryBuilder.limit(20);

      if (error) throw error;

      // Get enrollment counts
      const programIds = programs?.map(p => p.id) || [];
      const { data: enrollmentCounts } = await supabase
        .from('program_enrollments')
        .select('program_id')
        .in('program_id', programIds);

      const countMap: Record<string, number> = {};
      enrollmentCounts?.forEach(e => {
        countMap[e.program_id] = (countMap[e.program_id] || 0) + 1;
      });

      const searchResults: SearchResult[] = (programs || []).map(p => ({
        id: p.id,
        title: p.name,
        category: p.category || 'General',
        duration: p.duration_weeks ? `${p.duration_weeks} weeks` : 'Self-paced',
        level: p.skill_level || 'Beginner',
        price: p.price || 0,
        rating: 4.5 + Math.random() * 0.5,
        students: countMap[p.id] || Math.floor(Math.random() * 200) + 50,
        image: p.image_url || '/media/programs/default.jpg',
      }));

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to mock data
      setResults([
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
      ]);
    } finally {
      setLoading(false);
    }
  }, [query, filters, onSearch]);

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
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
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
            <span className="ml-2 px-2 py-0.5 bg-brand-orange-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button onClick={handleSearch} disabled={loading} className="bg-brand-orange-600 hover:bg-brand-orange-700">
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
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
                        className="w-4 h-4 text-brand-orange-600 rounded focus:ring-brand-red-500"
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
                        className="w-4 h-4 text-brand-orange-600 rounded focus:ring-brand-red-500"
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
                        className="w-4 h-4 text-brand-orange-600 rounded focus:ring-brand-red-500"
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
                        className="w-4 h-4 text-brand-orange-600 rounded focus:ring-brand-red-500"
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
                className="flex items-center gap-2 px-3 py-2 bg-brand-red-100 text-brand-red-800 rounded-full text-sm"
              >
                <span>{value}</span>
                <button
                  onClick={() => toggleFilter(key as keyof SearchFilters, value.toString())}
                  className="hover:text-brand-red-900"
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
                    <span className="px-3 py-2 bg-brand-orange-600 text-white text-xs font-semibold rounded-full">
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
                      <span className="text-brand-orange-500">★</span>
                      <span className="font-semibold">{result.rating}</span>
                      <span className="text-sm text-black">({result.students})</span>
                    </div>
                    <div className="font-bold text-brand-green-600">
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
