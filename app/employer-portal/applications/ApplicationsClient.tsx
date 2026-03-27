'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Clock, Eye, MessageSquare, MapPin, Star } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-brand-blue-100 text-brand-blue-700',
  Reviewed: 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-brand-blue-100 text-brand-blue-700',
  Offered: 'bg-brand-green-100 text-brand-green-700',
  Rejected: 'bg-brand-red-100 text-brand-red-700',
};

type Application = {
  id: string;
  candidate: { name: string; image: string | null };
  position: string;
  status: string;
  appliedDate: string;
  rating: number;
  location: string;
  userId: string;
};

export function ApplicationsClient({ applications }: { applications: Application[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const counts = {
    Total: applications.length,
    New: applications.filter(a => a.status === 'New').length,
    'In Review': applications.filter(a => a.status === 'Reviewed').length,
    Interview: applications.filter(a => a.status === 'Interview').length,
    Offered: applications.filter(a => a.status === 'Offered').length,
  };

  const statColors: Record<string, string> = {
    Total: 'text-gray-900',
    New: 'text-brand-blue-600',
    'In Review': 'text-yellow-600',
    Interview: 'text-brand-blue-600',
    Offered: 'text-brand-green-600',
  };

  const filtered = applications.filter(a => {
    const matchesStatus = statusFilter === 'All'
      || a.status === statusFilter
      || (statusFilter === 'In Review' && a.status === 'Reviewed');
    const matchesSearch = !search
      || a.candidate.name.toLowerCase().includes(search.toLowerCase())
      || a.position.toLowerCase().includes(search.toLowerCase())
      || a.location.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      {/* Stats — clicking filters the list */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-8 overflow-x-auto">
            {Object.entries(counts).map(([label, count]) => (
              <button
                key={label}
                onClick={() => setStatusFilter(label === 'Total' ? 'All' : label)}
                className={`flex items-center gap-2 whitespace-nowrap transition-opacity ${
                  (statusFilter === 'All' && label === 'Total') || statusFilter === label
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-75'
                }`}
              >
                <span className={`text-2xl font-bold ${statColors[label]}`}>{count}</span>
                <span className="text-gray-500">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex-1 relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, position, or location..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Applications List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No applications match your filter.</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {filtered.map((app, index) => (
                <div
                  key={app.id}
                  className={`flex items-center gap-4 p-4 hover:bg-slate-50 ${index !== filtered.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-brand-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {app.candidate.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{app.candidate.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{app.position}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{app.appliedDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/employer-portal/applications/${app.id}`}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="View application"
                    >
                      <Eye className="w-5 h-5 text-gray-400" />
                    </Link>
                    <Link
                      href={`/employer-portal/messages?to=${app.userId}`}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="Message applicant"
                    >
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </Link>
                    <Link
                      href={`/employer-portal/applications/${app.id}`}
                      className="px-4 py-2 bg-brand-blue-600 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-700"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
