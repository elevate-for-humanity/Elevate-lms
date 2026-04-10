'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, Clock, Award, AlertCircle, Flower2, BookOpen, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/pwa/esthetician', icon: Flower2, label: 'Home' },
  { href: '/pwa/esthetician/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/esthetician/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/esthetician/progress', icon: TrendingUp, label: 'Progress' },
];

export default function EstheticianStateBoardPage() {
  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-rose-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/pwa/esthetician" className="w-10 h-10 bg-rose-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">State Board Exam</h1>
        </div>
        <p className="text-rose-200 text-sm">Indiana IPLA Esthetician Examination</p>
      </header>

      <main className="px-4 py-6 space-y-4">
        <div className="bg-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6 text-rose-400" />
            <h2 className="text-white font-bold">Eligibility Requirements</h2>
          </div>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2"><span className="text-rose-400 flex-shrink-0">•</span>Complete all 700 required apprenticeship hours</li>
            <li className="flex items-start gap-2"><span className="text-rose-400 flex-shrink-0">•</span>Pass all RTI coursework with a 70% or higher</li>
            <li className="flex items-start gap-2"><span className="text-rose-400 flex-shrink-0">•</span>Obtain program completion certificate from Elevate</li>
            <li className="flex items-start gap-2"><span className="text-rose-400 flex-shrink-0">•</span>Be at least 16 years of age</li>
          </ul>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-rose-400" />
            <h2 className="text-white font-bold">Exam Details</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Exam Fee</span>
              <span className="text-white font-medium">~$75</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Format</span>
              <span className="text-white font-medium">Written + Practical</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Licensing Body</span>
              <span className="text-white font-medium">Indiana IPLA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Required Hours</span>
              <span className="text-white font-medium">700</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-sm">
              Do not schedule your exam until you receive your completion certificate from Elevate for Humanity. Your coordinator will notify you when you are eligible.
            </p>
          </div>
        </div>

        <a
          href="https://www.in.gov/pla/professions/cosmetology-and-related-professions/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full bg-rose-600 text-white rounded-xl p-4 font-bold hover:bg-rose-700 transition"
        >
          <span>Indiana IPLA — Apply for Exam</span>
          <ExternalLink className="w-5 h-5" />
        </a>

        <Link
          href="/apprentice/state-board"
          className="flex items-center justify-between w-full bg-slate-800 text-slate-300 rounded-xl p-4 hover:bg-slate-700 transition"
        >
          <span className="text-sm">Full State Board Details</span>
          <Clock className="w-4 h-4" />
        </Link>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 text-slate-400 hover:text-rose-400 transition">
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
