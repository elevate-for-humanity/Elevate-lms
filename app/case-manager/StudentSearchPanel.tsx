'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, User } from 'lucide-react';

interface Student {
  id: string;
  full_name?: string;
  email?: string;
  program?: string;
  status?: string;
}

export function StudentSearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/case-manager/students?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.students ?? data ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Student Search</h2>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or email…"
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-brand-red-500 hover:bg-brand-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {results !== null && (
        <div className="mt-3 space-y-1">
          {results.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-3">No students found</p>
          ) : (
            results.slice(0, 8).map((s) => (
              <Link
                key={s.id}
                href={`/case-manager/participants/${s.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 bg-brand-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-brand-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{s.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-slate-500 truncate">{s.email ?? s.program ?? ''}</p>
                </div>
                {s.status && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    s.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.status}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
