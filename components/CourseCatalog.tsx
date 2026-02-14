"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Course {
  id: string;
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  rating: number;
  students: number;
  instructor: string;
  thumbnail: string;
  description: string;
  skills: string[];
}

export function CourseCatalog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const courses: Course[] = [
    {
      id: '1',
      title: 'Full-Stack Web Development Bootcamp',
      category: 'Web Development',
      level: 'intermediate',
      duration: '12 weeks',
      price: 2999,
      rating: 4.8,
      students: 1245,
      instructor: 'Dr. Sarah Chen',
      thumbnail: '💻',
      description: 'Master modern web development with React, Node.js, and MongoDB',
      skills: ['React', 'Node.js', 'MongoDB', 'Express'],
    },
    {
      id: '2',
      title: 'Certified Nursing Assistant Training',
      category: 'Healthcare',
      level: 'beginner',
      duration: '8 weeks',
      price: 1499,
      rating: 4.9,
      students: 892,
      instructor: 'Nurse Maria Rodriguez',
      thumbnail: '🏥',
      description: 'Comprehensive CNA training with clinical practice',
      skills: ['Patient Care', 'Vital Signs', 'Medical Records'],
    },
    {
      id: '3',
      title: 'HVAC Technician Certification',
      category: 'Technical',
      level: 'intermediate',
      duration: '10 weeks',
      price: 2499,
      rating: 4.7,
      students: 654,
      instructor: 'Mike Johnson',
      thumbnail: '🔧',
      description: 'Learn HVAC installation, maintenance, and repair',
      skills: ['HVAC Systems', 'Troubleshooting', 'EPA Certification'],
    },
    {
      id: '4',
      title: 'JavaScript Fundamentals',
      category: 'Web Development',
      level: 'beginner',
      duration: '6 weeks',
      price: 999,
      rating: 4.6,
      students: 2103,
      instructor: 'Alex Kim',
      thumbnail: '📱',
      description: 'Learn JavaScript from scratch with hands-on projects',
      skills: ['JavaScript', 'DOM', 'ES6+', 'Async Programming'],
    },
    {
      id: '5',
      title: 'Commercial Truck Driving',
      category: 'Transportation',
      level: 'beginner',
      duration: '4 weeks',
      price: 3999,
      rating: 4.8,
      students: 432,
      instructor: 'Tom Williams',
      thumbnail: '🚛',
      description: 'Get your CDL with comprehensive training',
      skills: ['CDL Class A', 'Safety', 'Regulations'],
    },
    {
      id: '6',
      title: 'Advanced React Patterns',
      category: 'Web Development',
      level: 'advanced',
      duration: '8 weeks',
      price: 1999,
      rating: 4.9,
      students: 567,
      instructor: 'Dr. Sarah Chen',
      thumbnail: '⚛️',
      description: 'Master advanced React concepts and patterns',
      skills: ['React', 'Hooks', 'Context', 'Performance'],
    },
  ];

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  });

  if (sortBy === 'popular') {
    filteredCourses.sort((a, b) => b.students - a.students);
  } else if (sortBy === 'rating') {
    filteredCourses.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price-low') {
    filteredCourses.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredCourses.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Course Catalog</h1>
          <p className="text-red-100">Explore our comprehensive training programs</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-black">
            Showing <span className="font-semibold">{filteredCourses.length}</span> courses
          </p>
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card key={course.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="   h-48 flex items-center justify-center text-7xl">
                {course.thumbnail}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-2 bg-orange-100 text-orange-700 text-xs rounded">
                    {course.category}
                  </span>
                  <span className={`px-2 py-2 text-xs rounded ${
                    course.level === 'beginner' ? 'bg-brand-blue-100 text-brand-blue-700' :
                    course.level === 'intermediate' ? 'bg-purple-100 text-purple-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {course.level}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-sm text-black mb-3">{course.description}</p>

                <div className="flex items-center gap-4 text-sm text-black mb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{course.rating}</span>
                  </div>
                  <span>👥 {course.students.toLocaleString()}</span>
                  <span>⏱️ {course.duration}</span>
                </div>

                <p className="text-sm text-black mb-3">
                  Instructor: <span className="font-semibold">{course.instructor}</span>
                </p>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-black mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {course.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 text-black text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-brand-orange-600">${course.price}</p>
                  </div>
                  <Button size="sm">Enroll Now</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-xl text-black mb-2">No courses found</p>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </Card>
        )}
      </div>
    </div>
  );
}
