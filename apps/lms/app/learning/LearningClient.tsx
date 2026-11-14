'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BookOpen, Play, Clock, Award, FileText, MessageCircle, TrendingUp } from 'lucide-react';

const quickLinks = [
  { icon: BookOpen, title: 'My Courses', href: '/lms/programs', description: 'View enrolled programs' },
  { icon: Play, title: 'Continue Learning', href: '/lms/lessons', description: 'Resume where you left off' },
  { icon: FileText, title: 'Course Materials', href: '/lms/resources', description: 'Downloadable resources' },
  { icon: Award, title: 'Certifications', href: '/certifications', description: 'View earned credentials' },
  { icon: Clock, title: 'Schedule', href: '/lms/calendar', description: 'Upcoming sessions' },
  { icon: TrendingUp, title: 'Progress', href: '/lms/progress', description: 'Track your achievements' },
];

const recentLessons = [
  { title: 'Patient Communication Fundamentals', course: 'CNA Training', progress: 75, duration: '25 min' },
  { title: 'HVAC Safety Protocols', course: 'HVAC Technician', progress: 50, duration: '40 min' },
  { title: 'Barber Shop Etiquette', course: 'Barber Apprenticeship', progress: 30, duration: '15 min' },
];

export default function LearningClient() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'My Learning' }]} />
      
      {/* Hero */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-black">My Learning</h1>
          <p className="text-slate-600 mt-1">Continue your career training journey.</p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg font-bold text-black mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:shadow-md hover:border-brand-blue-300 transition-all"
              >
                <link.icon className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <span className="text-sm font-semibold text-black block">{link.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Continue Learning */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black">Continue Learning</h2>
            <Link href="/lms/lessons" className="text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {recentLessons.map((lesson) => (
              <div key={lesson.title} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Play className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">{lesson.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{lesson.course}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </span>
                        <span className="text-xs text-slate-500">{lesson.progress}% complete</span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href="/lms/lessons/current"
                    className="bg-brand-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors text-sm"
                  >
                    Continue
                  </Link>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-brand-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${lesson.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <MessageCircle className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-brand-blue-900">Need Help with Your Studies?</h3>
                <p className="text-sm text-brand-blue-800 mt-1">
                  Paris AI tutor is available 24/7 to help with your coursework. Click the chat icon to start.
                </p>
                <Link href="/ai/paris" className="inline-block mt-3 text-sm font-semibold text-brand-blue-700 hover:text-brand-blue-900">
                  Chat with Paris →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
