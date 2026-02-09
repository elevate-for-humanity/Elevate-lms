'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, Calendar, CheckCircle, XCircle,
  AlertCircle, Loader2, Filter, Scissors, BookOpen, TrendingUp
} from 'lucide-react';

interface HourEntry {
  id: string;
  weekEnding: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected' | 'submitted';
  notes?: string;
  submittedAt: string;
  approvedAt?: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function BarberHistoryPage() {
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/pwa/barber/history');
      
      if (response.status === 401) {
        setError('Please sign in to view your history');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.status === filter || (filter === 'pending' && e.status === 'submitted'));

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const approvedHours = entries
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.hours, 0);

  const getStatusBadge = (status: HourEntry['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-green-400 text-xs">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'pending':
      case 'submitted':
        return (
          <span className="flex items-center gap-1 text-amber-400 text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-white">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/login?redirect=/pwa/barber/history"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Hour History</h1>
            <p className="text-slate-400 text-sm">{entries.length} entries</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs">Total Logged</p>
            <p className="text-xl font-bold text-white">{totalHours} hrs</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs">Approved</p>
            <p className="text-xl font-bold text-green-400">{approvedHours} hrs</p>
          </div>
        </div>
      </header>

      {/* Filter */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <main className="px-4 space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {filter === 'all' ? 'No hours logged yet' : `No ${filter} entries`}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-white font-medium">
                    Week of {new Date(entry.weekEnding).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                {getStatusBadge(entry.status)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">
                  Submitted {new Date(entry.submittedAt).toLocaleDateString()}
                </span>
                <span className="text-2xl font-bold text-white">{entry.hours} hrs</span>
              </div>

              {entry.notes && (
                <p className="text-slate-400 text-sm mt-2 pt-2 border-t border-slate-700">
                  {entry.notes}
                </p>
              )}
            </div>
          ))
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
