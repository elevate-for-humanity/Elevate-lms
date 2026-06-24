'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Search, MapPin, Briefcase, GraduationCap, MessageSquare } from 'lucide-react';

const FILTERS = ['All Candidates', 'Healthcare', 'Skilled Trades', 'Transportation', 'Business'];

const PROGRAM_TO_FILTER: Record<string, string> = {
  'CNA': 'Healthcare',
  'Certified Nursing Assistant': 'Healthcare',
  'HVAC': 'Skilled Trades',
  'HVAC Technician': 'Skilled Trades',
  'CDL': 'Transportation',
  'CDL Class A': 'Transportation',
  'Barber': 'Business',
  'Barber Apprenticeship': 'Business',
};

type Candidate = {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  program: string;
  graduated: string;
  available: boolean;
  image: string | null;
};

export function CandidatesClient({ candidates }: { candidates: Candidate[] }) {
  const [activeFilter, setActiveFilter] = useState('All Candidates');
  const [search, setSearch] = useState('');

  const filtered = candidates.filter(c => {
    const matchesFilter = activeFilter === 'All Candidates'
      || PROGRAM_TO_FILTER[c.program] === activeFilter
      || c.title.toLowerCase().includes(activeFilter.toLowerCase());
    const matchesSearch = !search
      || c.name.toLowerCase().includes(search.toLowerCase())
      || c.program.toLowerCase().includes(search.toLowerCase())
      || c.location.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      {/* Search & Filters */}
      <section className="border-b sticky top-0 z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, skill, or location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'bg-brand-green-600 text-white'
                    : 'bg-white text-slate-900 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Candidates Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-slate-700 mb-6">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found</p>

          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(candidate => (
                <div key={candidate.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        {candidate.image ? (
                          <Image src={candidate.image} alt={candidate.name} fill className="object-cover"  sizes="100vw" />
                        ) : (
                          <div className="w-full h-full bg-brand-blue-700 flex items-center justify-center text-white text-xl font-bold">
                            {candidate.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{candidate.name}</h3>
                        <p className="text-slate-700 text-sm">{candidate.title}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <MapPin className="w-4 h-4" />{candidate.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Briefcase className="w-4 h-4" />{candidate.experience}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <GraduationCap className="w-4 h-4" />{candidate.program}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link
                        href={`/employer-portal/candidates/${candidate.id}`}
                        className="flex-1 px-4 py-2 bg-brand-green-600 text-white font-medium rounded-lg hover:bg-brand-green-700 transition-colors text-center"
                      >
                        View Profile
                      </Link>
                      <Link
                        href={`/employer-portal/messages?to=${candidate.id}`}
                        className="px-4 py-2 border border-gray-300 text-slate-900 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Message candidate"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {search || activeFilter !== 'All Candidates' ? 'No matching candidates' : 'No Candidates Yet'}
              </h3>
              <p className="text-slate-700">
                {search || activeFilter !== 'All Candidates'
                  ? 'Try adjusting your search or filter.'
                  : 'Candidates will appear here as students complete their programs.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
