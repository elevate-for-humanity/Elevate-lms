import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Search as SearchIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: `Search | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Search programs, courses, and resources.',
};

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Search</h1>
          <p className="text-xl text-slate-300">Find programs, courses, and resources</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input
              type="search"
              placeholder="Search programs, courses, topics..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
            />
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Popular Searches</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {['CNA', 'HVAC', 'CDL', 'Healthcare', 'Trades', 'Funding', 'WIOA', 'Apprenticeship'].map((term) => (
              <Link key={term} href={`/programs?search=${term}`} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-colors">
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
