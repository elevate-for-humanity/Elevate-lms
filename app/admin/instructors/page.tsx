
'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Award, BookOpen, Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function InstructorsPage() {
  const supabase = createClient();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    // Load instructors with their course assignments and performance
    let query = supabase
      .from('profiles')
      .select(
        `
        *,
        instructor_courses:course_instructors(
          course:courses(name, slug)
        ),
        instructor_ratings:instructor_reviews(rating)
      `
      )
      .eq('role', 'instructor')
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.eq('is_active', true);
    } else if (filter === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: instructorsData } = await query;
    setInstructors(instructorsData || []);
    setLoading(false);
  }

  function calculateAverageRating(ratings: any[]) {
    if (!ratings || ratings.length === 0) return '0';
    const sum: number = ratings.reduce(
      (acc: number, r) => acc + ((r as any).rating || 0),
      0
    ) as number;
    return (sum / ratings.length).toFixed(1);
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Instructors' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/employer-partner-3.jpg"
          alt="Instructors Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Instructors Management
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Manage instructors, track performance, and monitor teaching quality
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/instructors/performance"
              className="bg-brand-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Performance
            </Link>
            <Link
              href="/admin/dashboard"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-11 w-11 text-brand-blue-600" />
              <p className="text-sm text-black">Total Instructors</p>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">
              {instructors.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-11 w-11 text-brand-green-600" />
              <p className="text-sm text-black">Active</p>
            </div>
            <p className="text-3xl font-bold text-brand-green-600">
              {instructors.filter((i) => i.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-11 w-11 text-brand-blue-600" />
              <p className="text-sm text-black">Total Courses</p>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">
              {instructors.reduce(
                (acc, i) => acc + (i.instructor_courses?.length || 0),
                0
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-11 w-11 text-yellow-600" />
              <p className="text-sm text-black">Avg Rating</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {instructors.length > 0
                ? (
                    instructors.reduce(
                      (acc, i) =>
                        acc +
                        parseFloat(
                          calculateAverageRating(i.instructor_ratings)
                        ),
                      0
                    ) / instructors.length
                  ).toFixed(1)
                : '0.0'}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex gap-4 p-4 border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              All Instructors
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'active'
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'inactive'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Instructors List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-4">Instructors</h2>
          {instructors && instructors.length > 0 ? (
            <div className="space-y-4">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {instructor.full_name}
                      </h3>
                      <p className="text-sm text-black">
                        {instructor.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <span className="text-black">
                          Courses: {instructor.instructor_courses?.length || 0}
                        </span>
                        <span className="text-black flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Rating:{' '}
                          {calculateAverageRating(
                            instructor.instructor_ratings
                          )}
                        </span>
                        <span className="text-black">
                          Joined:{' '}
                          {new Date(instructor.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {instructor.instructor_courses &&
                        instructor.instructor_courses.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-black mb-1">
                              Teaching:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {instructor.instructor_courses.map(
                                (ic: Record<string, any>, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-2 rounded"
                                  >
                                    {ic.course?.name}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      {instructor.is_active ? (
                        <span className="text-brand-green-600 text-sm font-medium bg-brand-green-100 px-3 py-2 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-black text-sm font-medium bg-gray-100 px-3 py-2 rounded-full">
                          Inactive
                        </span>
                      )}
                      <Link
                        href={`/admin/instructors/${instructor.id}`}
                        className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-black text-center py-8">
              No instructors found
            </p>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Explore training programs and earn industry certifications through Elevate for
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
