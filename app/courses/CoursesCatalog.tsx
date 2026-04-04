"use client";

import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  duration_hours?: number;
  thumbnail_url?: string;
  status: string;
}

interface CoursesCatalogProps {
  courses: Course[];
  categories: string[];
  levels: string[];
}

export default function CoursesCatalog({
  courses,
  categories,
  levels,
}: CoursesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'duration') {
      return (a.duration_hours || 0) - (b.duration_hours || 0);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-brand-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-3xl md:text-4xl lg:text-5xl">
              Course Catalog
            </h1>
            <p className="text-xl text-white mb-8">
              Explore our complete catalog of workforce development courses. All
              programs are Funded through WIOA funding.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white transition-colors"
              >
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                {courses.length}
              </div>
              <div className="text-black">Courses Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                100%
              </div>
              <div className="text-black">Free Training</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                {categories.length}
              </div>
              <div className="text-black">Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                24/7
              </div>
              <div className="text-black">Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >
                  ) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <select
                  value={selectedLevel}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >
                  ) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level} className="capitalize">
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count & Sort */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-black">
                Showing{' '}
                <span className="font-semibold">{sortedCourses.length}</span> of{' '}
                <span className="font-semibold">{courses.length}</span> courses
              </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-black">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >
                  ) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                >
                  <option value="title">A-Z</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {sortedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedCourses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}/enroll`}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow overflow-hidden group"
                  >
                    {course.thumbnail_url ? (
                      <div className="relative h-48    overflow-hidden">
                        <Image alt="Course thumbnail" loading="lazy"
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          quality={100}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="h-48    flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-white opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    )}

                    <div className="p-6">
                      {course.category && (
                        <span className="inline-block px-3 py-2 bg-brand-blue-100 text-brand-blue-600 text-xs font-semibold rounded-full mb-3">
                          {course.category}
                        </span>
                      )}

                      <h3 className="text-xl font-bold text-black mb-2 group-hover:text-brand-blue-600 transition-colors">
                        {course.title}
                      </h3>

                      {course.description && (
                        <p className="text-black text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-black">
                        {course.duration_hours && (
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {course.duration_hours}h
                          </span>
                        )}
                        {course.level && (
                          <span className="capitalize">{course.level}</span>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <span className="text-brand-green-600 font-semibold">
                          Funded
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg
                  className="w-16 h-16 text-black mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-black mb-2">
                  No courses found
                </h3>
                <p className="text-black mb-6">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                  }}
                  className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-white mb-8">
              All courses are Funded through WIOA funding. No cost to you.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white transition-colors"
            >
              Apply for Free Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
