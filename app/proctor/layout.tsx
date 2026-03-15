import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ClipboardList, Plus, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Proctor Portal | Elevate for Humanity',
  description: 'Manage proctored certification exams — EPA 608, Certiport, OSHA, and more.',
  robots: { index: false, follow: false },
};

export default function ProctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-brand-blue-400" />
            <div>
              <h1 className="text-lg font-bold leading-tight">Proctor Portal</h1>
              <p className="text-xs text-slate-400">Elevate for Humanity Testing Center</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/proctor"
              className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Sessions
            </Link>
            <Link
              href="/proctor/new"
              className="inline-flex items-center gap-1.5 text-sm bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Session
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
