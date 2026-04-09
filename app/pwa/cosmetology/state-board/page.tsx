'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, Clock, Award, AlertCircle, Scissors, BookOpen, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/pwa/cosmetology', icon: Scissors, label: 'Home' },
  { href: '/pwa/cosmetology/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/cosmetology/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/cosmetology/progress', icon: TrendingUp, label: 'Progress' },
];

export default function CosmetologyStateBoardPage() {
  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-purple-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/pwa/cosmetology" className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">State Board Info</h1>
        </div>
        <p className="text-purple-200 text-sm mt-2">Indiana Cosmetology Licensing — what you need to know</p>
      </header>

      <main className="px-4 py-6 space-y-5">

        {/* Licensing body */}
        <div className="bg-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold">Licensing Authority</h2>
          </div>
          <p className="text-slate-300 text-sm mb-1">Indiana Professional Licensing Agency (IPLA)</p>
          <p className="text-slate-400 text-sm">Indiana State Board of Cosmetology and Barber Examiners</p>
          <a href="https://www.in.gov/pla" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-purple-400 text-sm hover:text-purple-300">
            Visit IPLA Website <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Hour requirements */}
        <div className="bg-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold">Hour Requirements</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Hours Required', value: '2,000 hours' },
              { label: 'On-the-Job Training (OJT)', value: 'Performed at your host salon' },
              { label: 'Related Technical Instruction (RTI)', value: 'Completed via Elevate LMS' },
              { label: 'Hours Tracking', value: 'Logged weekly in this app' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-slate-400 text-sm">{label}</span>
                <span className="text-white text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exam info */}
        <div className="bg-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold">State Board Exam</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Exam Provider', value: 'PSI Exams' },
              { label: 'Exam Format', value: 'Written theory + practical skills' },
              { label: 'Passing Score', value: '75% on both sections' },
              { label: 'Exam Fee', value: '~$75 (paid to IPLA)' },
              { label: 'Eligibility', value: 'After completing all 2,000 hours' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-slate-400 text-sm">{label}</span>
                <span className="text-white text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
          <a href="https://candidate.psiexams.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-purple-400 text-sm hover:text-purple-300">
            Schedule Exam at PSI <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* What to study */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-white font-bold mb-3">Exam Topic Areas</h2>
          <div className="grid grid-cols-2 gap-2">
            {['Hair Theory & Chemistry', 'Scalp & Hair Care', 'Chemical Services', 'Haircutting & Styling', 'Skin Care & Facials', 'Nail Care', 'Infection Control', 'Salon Business & Law'].map(topic => (
              <div key={topic} className="bg-slate-700 rounded-lg px-3 py-2">
                <p className="text-slate-300 text-xs">{topic}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-bold text-sm">Apply for Your License After Passing</p>
              <p className="text-amber-400 text-xs mt-1">After passing both exam sections, submit your license application to IPLA with your exam results and apprenticeship completion documentation from Elevate.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/support" className="text-purple-400 text-sm hover:text-purple-300">Questions? Contact your coordinator →</Link>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 text-slate-400">
              <Icon className="w-6 h-6" /><span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
