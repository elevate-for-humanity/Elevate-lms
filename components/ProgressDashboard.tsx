"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, Target, BookOpen, CheckCircle, } from 'lucide-react';

interface ProgressData {
  overall_progress: number;
  courses_completed: number;
  courses_in_progress: number;
  total_courses: number;
  hours_studied: number;
  assignments_completed: number;
  assignments_total: number;
  quiz_average: number;
  streak_days: number;
  certificates_earned: number;
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  last_accessed: string;
  grade?: number;
}

export function ProgressDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  async function loadProgressData() {
    try {
      const res = await fetch(`/api/users/${userId}/progress`);
      if (res.ok) {
        const result = await res.json();
        setData(result.progress);
        setCourses(result.courses || []);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-center text-slate-500">Loading progress...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-center text-slate-500">No progress data available</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Overall Progress',
      value: `${data.overall_progress}%`,
      icon: TrendingUp,
      color: 'text-brand-orange-600',
      bgColor: 'bg-brand-red-50',
    },
    {
      label: 'Courses Completed',
      value: `${data.courses_completed}/${data.total_courses}`,
      icon: BookOpen,
      color: 'text-brand-blue-600',
      bgColor: 'bg-brand-blue-50',
    },
    {
      label: 'Hours Studied',
      value: data.hours_studied,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Quiz Average',
      value: `${data.quiz_average}%`,
      icon: Target,
      color: 'text-brand-orange-600',
      bgColor: 'bg-brand-orange-50',
    },
    {
      label: 'Assignments',
      value: `${data.assignments_completed}/${data.assignments_total}`,
      icon: CheckCircle,
      color: 'text-brand-green-600',
      bgColor: 'bg-brand-green-50',
    },
    {
      label: 'Certificates',
      value: data.certificates_earned,
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-lg border border-slate-200 p-4"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-black">{stat.value}</p>
              <p className="text-xs text-black mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">Overall Progress</h3>
          <span className="text-2xl font-bold text-brand-orange-600">
            {data.overall_progress}%
          </span>
        </div>
        <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full    transition-all duration-500"
            style={{ width: `${data.overall_progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm text-black">
          <span>{data.courses_completed} courses completed</span>
          <span>{data.courses_in_progress} in progress</span>
        </div>
      </div>

      {/* Course Progress */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Course Progress</h3>
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="border-b border-slate-200 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-black">{course.course_name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Last accessed: {new Date(course.last_accessed).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-brand-orange-600">
                    {course.progress}%
                  </p>
                  {course.grade !== undefined && (
                    <p className="text-xs text-black">Grade: {course.grade}%</p>
                  )}
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-orange-500 transition-all duration-300"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Streak */}
      {data.streak_days > 0 && (
        <div className="   rounded-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔥</span>
            </div>
            <div>
              <p className="text-3xl font-bold">{data.streak_days} Days</p>
              <p className="text-white/90">Learning Streak</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
