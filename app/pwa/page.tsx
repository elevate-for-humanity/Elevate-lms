
import { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, Building2, ChevronRight } from 'lucide-react';


export const metadata: Metadata = {
  title: 'Pwa | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/pwa',
  },
};

export default function PWAIndexPage() {

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 px-6 pt-16 pb-8 text-center">
        <div className="w-20 h-20 bg-brand-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl font-black text-white">E</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Elevate Apps</h1>
        <p className="text-slate-400">Choose your app to get started</p>
      </header>

      {/* App Selection */}
      <main className="flex-1 px-6 py-8 space-y-4">
        {/* Barber Apprentice App */}
        <Link 
          href="/pwa/barber"
          className="block bg-brand-blue-600/20 border border-brand-blue-500/30 rounded-2xl p-6 hover:border-brand-blue-500/50 transition-colors"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-brand-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">Barber Apprentice</h2>
              <p className="text-brand-blue-300 text-sm">Track hours, access training, monitor progress</p>
            </div>
            <ChevronRight className="w-6 h-6 text-brand-blue-400" />
          </div>
          
          <div className="mt-4 pt-4 border-t border-brand-blue-500/20">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-brand-blue-500/20 text-brand-blue-300 rounded-full text-xs">Log Hours</span>
              <span className="px-3 py-1 bg-brand-blue-500/20 text-brand-blue-300 rounded-full text-xs">Training Materials</span>
              <span className="px-3 py-1 bg-brand-blue-500/20 text-brand-blue-300 rounded-full text-xs">Progress Tracking</span>
            </div>
          </div>
        </Link>

        {/* Shop Owner App */}
        <Link 
          href="/pwa/shop-owner"
          className="block bg-brand-blue-600/20 border border-brand-blue-500/30 rounded-2xl p-6 hover:border-brand-blue-500/50 transition-colors"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-brand-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">Shop Partner</h2>
              <p className="text-brand-blue-300 text-sm">Manage apprentices, approve hours, view reports</p>
            </div>
            <ChevronRight className="w-6 h-6 text-brand-blue-400" />
          </div>
          
          <div className="mt-4 pt-4 border-t border-brand-blue-500/20">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-brand-blue-500/20 text-brand-blue-300 rounded-full text-xs">Manage Team</span>
              <span className="px-3 py-1 bg-brand-blue-500/20 text-brand-blue-300 rounded-full text-xs">Log Hours</span>
              <span className="px-3 py-1 bg-brand-blue-500/20 text-brand-blue-300 rounded-full text-xs">Compliance Reports</span>
            </div>
          </div>
        </Link>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-slate-500 text-sm mb-4">
          Part of the Elevate for Humanity platform
        </p>
        <Link 
          href="/"
          className="text-slate-400 hover:text-white text-sm underline"
        >
          Go to main website
        </Link>
      </footer>
    </div>
  );
}
