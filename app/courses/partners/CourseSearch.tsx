
"use client";

import React from 'react';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  course_name: string;
  description: string;
  category: string;
  retail_price: number;
  duration_hours: number | null;
  enrollment_type: 'paid' | 'direct' | 'wioa' | 'apprenticeship';
  requires_payment: boolean;
}

interface CourseSearchProps {
  courses: Course[];
}

export default function CourseSearch({ courses }: CourseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');

  // Get unique providers and categories
  const providers = useMemo(() => {
    return [...new Set(courses.map((c) => c.provider_name))].sort();
  }, [courses]);

  const categories = useMemo(() => {
    return [...new Set(courses.map((c) => c.category))].filter(Boolean).sort();
  }, [courses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          course.course_name.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.provider_name.toLowerCase().includes(query) ||
          course.category.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Provider filter
      if (
        selectedProvider !== 'all' &&
        course.provider_name !== selectedProvider
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && course.category !== selectedCategory) {
        return false;
      }

      // Price range filter
      if (priceRange !== 'all') {
        const price = course.retail_price;
        switch (priceRange) {
          case 'free':
            if (price > 0) return false;
            break;
          case 'under-50':
            if (price >= 50) return false;
            break;
          case '50-150':
            if (price < 50 || price >= 150) return false;
            break;
          case '150-300':
            if (price < 150 || price >= 300) return false;
            break;
          case 'over-300':
            if (price < 300) return false;
            break;
        }
      }

      return true;
    });
  }, [courses, searchQuery, selectedProvider, selectedCategory, priceRange]);

  return (
    <div>
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-black mb-2">
              Search Courses
            </label>
            <input
              type="text"
              placeholder="Search by name, description, or provider..."
              value={searchQuery}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          {/* Provider Filter */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => setSelectedProvider(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="all">All Providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-black mb-2">
            Price Range
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Prices' },
              { value: 'free', label: 'Free' },
              { value: 'under-50', label: 'Under $50' },
              { value: '50-150', label: '$50 - $150' },
              { value: '150-300', label: '$150 - $300' },
              { value: 'over-300', label: 'Over $300' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPriceRange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  priceRange === option.value
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-black">
            Showing{' '}
            <span className="font-semibold">{filteredCourses.length}</span> of{' '}
            <span className="font-semibold">{courses.length}</span> courses
          </p>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-black text-lg">
            No courses found matching your criteria
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedProvider('all');
              setSelectedCategory('all');
              setPriceRange('all');
            }}
            className="mt-4 px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-brand-blue-500 transition-all"
            >
              <div className="mb-3">
                <span className="inline-block px-3 py-2 bg-brand-blue-100 text-brand-blue-800 text-xs font-semibold rounded-full">
                  {course.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-black mb-2 line-clamp-2">
                {course.course_name}
              </h3>
              <p className="text-sm text-black mb-4 line-clamp-3">
                {course.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-brand-blue-600">
                    {course.retail_price === 0
                      ? 'Free'
                      : `$${course.retail_price}`}
                  </div>
                  {course.duration_hours && (
                    <div className="text-xs text-black">
                      {course.duration_hours} hours
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={`/courses/partners/${course.id}/enroll`}
                className="block w-full px-4 py-2 bg-brand-blue-600 text-white text-center font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                {course.requires_payment
                  ? `Enroll Now - $${course.retail_price}`
                  : course.enrollment_type === 'wioa'
                    ? 'Apply with WIOA'
                    : 'Enroll Free'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
