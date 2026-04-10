'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Play, FileText, Sparkles, Clock, TrendingUp, ExternalLink } from 'lucide-react';

const NAV = [
  { href: '/pwa/nail-tech', icon: Sparkles, label: 'Home' },
  { href: '/pwa/nail-tech/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/nail-tech/training', icon: BookOpen, label: 'Learn', active: true },
  { href: '/pwa/nail-tech/progress', icon: TrendingUp, label: 'Progress' },
];

const MODULES = [
  { title: 'Infection Control & Safety', topics: ['Sanitation Standards', 'OSHA Compliance', 'Chemical Safety'] },
  { title: 'Nail Anatomy & Disorders', topics: ['Nail Structure & Growth', 'Common Nail Disorders', 'When to Refer Clients'] },
  { title: 'Manicuring', topics: ['Basic Manicure', 'Spa Manicure', 'Paraffin Treatments'] },
  { title: 'Pedicuring', topics: ['Basic Pedicure', 'Spa Pedicure', 'Foot Care Techniques'] },
  { title: 'Nail Enhancements', topics: ['Acrylic Nails', 'Gel Systems', 'Nail Wraps & Tips'] },
  { title: 'Nail Art & Design', topics: ['Polish Techniques', 'Nail Art Basics', 'Gel Polish & Curing'] },
  { title: 'Indiana Nail Tech Law', topics: ['Licensing Requirements', 'Salon Regulations', 'Client Rights'] },
];

export default function NailTechTrainingPage() {
  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-pink-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/pwa/nail-tech" className="w-10 h-10 bg-pink-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">RTI Training</h1>
        </div>
        <p className="text-pink-200 text-sm">Related Technical Instruction — complete online to fulfill your RTI hours.</p>
      </header>

      <main className="px-4 py-6 space-y-4">
        <Link
          href="/lms/dashboard"
          className="flex items-center justify-between w-full bg-pink-600 text-white rounded-xl p-4 font-bold hover:bg-pink-700 transition"
        >
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5" />
            <span>Open LMS Dashboard</span>
          </div>
          <ExternalLink className="w-4 h-4" />
        </Link>

        <div className="space-y-3">
          {MODULES.map((mod, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-white font-medium">{mod.title}</h3>
              </div>
              <ul className="space-y-1 pl-11">
                {mod.topics.map((topic) => (
                  <li key={topic} className="text-slate-400 text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-pink-500 rounded-full flex-shrink-0" />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label, active }) => (
          <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-3 transition ${active ? 'text-pink-400' : 'text-slate-400 hover:text-pink-400'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
