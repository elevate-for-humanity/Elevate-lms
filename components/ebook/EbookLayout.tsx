'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Menu, X, BookOpen, Printer } from 'lucide-react';

export interface EbookChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;
  accent: string;
}

interface EbookLayoutProps {
  chapters: EbookChapter[];
  currentChapterId: string;
  children: React.ReactNode;
}

export default function EbookLayout({ chapters, currentChapterId, children }: EbookLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);
  const prev = chapters[currentIndex - 1];
  const next = chapters[currentIndex + 1];

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Top bar — hidden on print */}
      <div className="print:hidden sticky top-0 z-40 bg-slate-900 text-white h-14 flex items-center px-4 gap-4 shadow-lg">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-700 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/ebook/barber-theory" className="flex items-center gap-2 font-bold text-sm">
          <BookOpen className="w-4 h-4 text-orange-400" />
          Barber Theory Ebook
        </Link>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Sidebar drawer */}
      {sidebarOpen && (
        <div className="print:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 bg-white h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <span className="font-bold text-slate-900">Table of Contents</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <Link
                href="/ebook/barber-theory"
                onClick={() => setSidebarOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cover & Introduction
              </Link>
              {chapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/ebook/barber-theory/${ch.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    ch.id === currentChapterId
                      ? 'bg-orange-50 text-orange-700 font-semibold border-l-4 border-orange-500'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs text-slate-400 block">Chapter {ch.number}</span>
                  {ch.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        {children}
      </main>

      {/* Prev / Next nav — hidden on print */}
      <div className="print:hidden max-w-4xl mx-auto px-4 sm:px-6 pb-16 flex justify-between gap-4">
        {prev ? (
          <Link
            href={`/ebook/barber-theory/${prev.id}`}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              <span className="block text-xs text-slate-400">Previous</span>
              Ch. {prev.number}: {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/ebook/barber-theory/${next.id}`}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors shadow-sm ml-auto"
          >
            <span className="text-right">
              <span className="block text-xs text-slate-400">Next</span>
              Ch. {next.number}: {next.title}
            </span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
