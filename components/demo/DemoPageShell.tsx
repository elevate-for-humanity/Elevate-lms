'use client';

import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';

interface DemoPageShellProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

/**
 * Shell for public demo pages. Renders a read-only view with
 * a demo banner and back navigation. The TourOverlay is provided
 * by the parent layout's DemoTourProvider.
 */
export function DemoPageShell({ title, description, children }: DemoPageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white text-center py-2.5 px-4 text-sm flex items-center justify-center gap-2">
        <Info className="w-4 h-4" />
        <span>Demo Mode — Read-only sample data</span>
      </div>

      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link
          href="/demo/admin"
          className="text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
