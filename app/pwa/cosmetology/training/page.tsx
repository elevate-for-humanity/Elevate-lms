'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Play, FileText, Scissors, Clock, TrendingUp, ExternalLink } from 'lucide-react';

const NAV = [
  { href: '/pwa/cosmetology', icon: Scissors, label: 'Home' },
  { href: '/pwa/cosmetology/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/cosmetology/training', icon: BookOpen, label: 'Learn', active: true },
  { href: '/pwa/cosmetology/progress', icon: TrendingUp, label: 'Progress' },
];

const MODULES = [
  { title: 'Foundations of Cosmetology', topics: ['History & Career Opportunities', 'Life Skills & Professional Image', 'Infection Control & Safety'] },
  { title: 'Hair Science & Chemistry', topics: ['Hair Structure & Growth', 'Scalp Disorders', 'Chemical Texture Services'] },
  { title: 'Haircutting & Styling', topics: ['Basic Haircuts', 'Advanced Cutting Techniques', 'Thermal Styling'] },
  { title: 'Hair Coloring', topics: ['Color Theory', 'Single-Process Color', 'Highlights & Balayage'] },
  { title: 'Skin Care', topics: ['Skin Analysis', 'Facial Treatments', 'Hair Removal & Waxing'] },
  { title: 'Nail Care', topics: ['Manicures & Pedicures', 'Nail Enhancements', 'Nail Disorders'] },
  { title: 'Salon Business', topics: ['Client Consultation', 'Salon Management', 'Indiana Cosmetology Law'] },
];

export default function CosmetologyTrainingPage() {
  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-purple-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/pwa/cosmetology" className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Training Modules</h1>
        </div>
        <p className="text-purple-200 text-sm">Milady-based RTI curriculum via Elevate LMS</p>
      </header>

      <main className="px-4 py-6 space-y-4">
        {/* LMS link */}
        <Link href="/lms" className="flex items-center justify-between bg-purple-600 rounded-xl p-4 hover:bg-purple-700 transition-colors">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-white" />
            <div>
              <p className="text-white font-bold">Open Full LMS</p>
              <p className="text-purple-200 text-xs">Access all lessons, videos, and quizzes</p>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-purple-300" />
        </Link>

        {/* Module list */}
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Curriculum Overview</p>
          <div className="space-y-3">
            {MODULES.map((mod, i) => (
              <div key={mod.title} className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{i + 1}</div>
                  <div>
                    <p className="text-white font-medium text-sm">{mod.title}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mod.topics.map(t => (
                        <span key={t} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State board prep */}
        <Link href="/pwa/cosmetology/state-board" className="flex items-center justify-between bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-white font-medium text-sm">State Board Exam Prep</p>
              <p className="text-slate-400 text-xs">Exam topics, format, and scheduling</p>
            </div>
          </div>
          <span className="text-slate-500">›</span>
        </Link>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          {NAV.map(({ href, icon: Icon, label, active }) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 ${active ? 'text-purple-400' : 'text-slate-400'}`}>
              <Icon className="w-6 h-6" /><span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
