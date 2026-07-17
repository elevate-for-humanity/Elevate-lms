'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Video, FileText, Award, Clock, CheckCircle, ArrowLeft, Play } from 'lucide-react';

export default function StudentDemoPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const demoCourses = [
    {
      id: 'barber-101',
      title: 'Barber Fundamentals',
      progress: 65,
      lessons: 12,
      completed: 8,
      duration: '15 weeks',
      image: '/hero-images/barber-hero.jpg',
    },
    {
      id: 'hvac-basics',
      title: 'HVAC Technician Training',
      progress: 30,
      lessons: 20,
      completed: 6,
      duration: '16 weeks',
      image: '/hero-images/hvac-hero.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-600 text-white py-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/store/demo" className="hover:bg-blue-700 p-2 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="text-xs text-blue-200">DEMO MODE</div>
              <div className="font-bold">Student Portal</div>
            </div>
          </div>
          <Link
            href="/store/licenses"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition"
          >
            Purchase License
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">JD</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, John Doe</h1>
              <p className="text-slate-600">Demo Student Account</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <div className="text-sm text-slate-700">Active Courses</div>
            </div>
            <div className="bg-brand-green-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-brand-green-600 mb-2">14</div>
              <div className="text-sm text-slate-700">Lessons Completed</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">48%</div>
              <div className="text-sm text-slate-700">Overall Progress</div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">My Courses</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {demoCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white opacity-80" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-bold text-blue-600">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourse(course.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Continue Learning
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Course Content</h2>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((lesson) => (
                <div key={lesson} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition">
                  <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-brand-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Lesson {lesson}: Introduction to Tools</div>
                    <div className="text-sm text-slate-600">15 minutes · Video + Quiz</div>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 text-center">
          <Award aria-label="award" className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">This is a Demo</h3>
          <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
            You're experiencing the student portal with sample data. The full platform includes video lessons, SCORM courses, quizzes, certificates, and more.
          </p>
          <Link
            href="/store/licenses"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Get Full Access
          </Link>
        </div>
      </div>
    </div>
  );
}
