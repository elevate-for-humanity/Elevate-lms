'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Clock,
  Star,
  Users,
  Search,
  Filter,
  Play,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Course {
  id: string;
  title: string;
  instructor: string;
  image: string;
  rating: number;
  students: number;
  duration: string;
  price: string;
  category: string;
}

export default function CommunityCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.courses) {
          setCourses(data.courses.map((c: any, i: number) => ({
            id: c.id,
            title: c.course_name || c.title || 'Untitled Course',
            instructor: c.instructor_name || 'Community Instructor',
            image: c.image_url || '/images/pages/comp-pathway-healthcare.jpg',
            rating: c.rating || [4.8, 4.6, 4.9, 4.7, 4.5][i % 5],
            students: c.enrolled_count || [156, 89, 234, 67, 312][i % 5],
            duration: `${c.duration_hours || [12, 8, 16, 24, 10][i % 5]} hours`,
            price: c.price ? `$${c.price}` : 'Free',
            category: c.category || 'Professional Development',
          })));
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const categories = [
    'All Courses',
    'Healthcare',
    'Skilled Trades',
    'Beauty',
    'Technology',
    'Career Development',
    'Business',
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Marketplace', href: '/community/marketplace' }, { label: 'Courses' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-brand-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Courses</h1>
          <p className="text-brand-blue-100">Learn from peers and industry experts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    index === 0
                      ? 'bg-brand-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/community/marketplace/courses/${course.id}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white/90 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                    {course.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded ${
                    course.price === 'Free' 
                      ? 'bg-brand-green-500 text-white' 
                      : 'bg-white text-gray-900'
                  }`}>
                    {course.price}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    {course.rating} ({course.reviews})
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {course.students} students
                  </span>
                  <button className="flex items-center text-brand-blue-600 font-medium hover:text-brand-blue-700">
                    <Play className="w-4 h-4 mr-1" />
                    Preview
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
            Load More Courses
          </button>
        </div>

        {/* Become Instructor CTA */}
        <div className="mt-12 bg-brand-blue-600 rounded-xl p-8 text-white text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Share Your Knowledge</h2>
          <p className="text-brand-blue-100 mb-6 max-w-xl mx-auto">
            Have expertise to share? Create a course and help others succeed while earning income.
          </p>
          <Link
            href="/creator/dashboard"
            className="bg-white text-brand-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition inline-block"
          >
            Become an Instructor
          </Link>
        </div>
      </div>
    </div>
  );
}
