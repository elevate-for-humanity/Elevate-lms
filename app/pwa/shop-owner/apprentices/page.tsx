'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Clock, TrendingUp, ChevronRight, Loader2, AlertCircle, Building2, FileText } from 'lucide-react';

interface Apprentice {
  id: string;
  name: string;
  email?: string;
  totalHours: number;
  weeklyHours: number;
  weeklyAvg: number;
  status: string;
  progress: number;
  startDate?: string;
  lastActivity?: string;
}

interface ApprenticesData {
  isPartner: boolean;
  apprentices: Apprentice[];
  counts: {
    active: number;
    pending: number;
    total: number;
  };
}

export default function ApprenticesPage() {
  const [data, setData] = useState<ApprenticesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprentices();
  }, []);

  const fetchApprentices = async () => {
    try {
      const response = await fetch('/api/pwa/shop-owner/apprentices');
      
      if (response.status === 401) {
        setError('Please sign in to view apprentices');
        setLoading(false);
        return;
      }
      
      if (response.status === 404) {
        setError('You are not associated with a partner shop');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch apprentices');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching apprentices:', err);
      setError('Failed to load apprentices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-900">Loading apprentices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-brand-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Unable to Load</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link
            href="/login?redirect=/pwa/shop-owner/apprentices"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { apprentices, counts } = data;
  const activeApprentices = apprentices.filter(a => a.status === 'active');
  const pendingApprentices = apprentices.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-slate-800 px-4 pt-12 pb-4 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/shop-owner" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-slate-900 font-bold text-xl">My Apprentices</h1>
            <p className="text-slate-500 text-sm">{counts.active} active, {counts.pending} pending</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {apprentices.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Apprentices Yet</h2>
            <p className="text-slate-500">Apprentices will appear here once they are assigned to your shop.</p>
          </div>
        ) : (
          <>
            {/* Active Apprentices */}
            {activeApprentices.length > 0 && (
              <div>
                <h2 className="text-slate-900 font-bold text-lg mb-4">Active</h2>
                <div className="space-y-3">
                  {activeApprentices.map((apprentice) => (
                    <Link 
                      key={apprentice.id}
                      href={`/pwa/shop-owner/apprentices/${apprentice.id}`}
                      className="block bg-slate-800 rounded-xl p-4 active:bg-slate-700"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-brand-blue-400 font-bold text-xl">
                            {apprentice.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-900 font-medium text-lg">{apprentice.name}</p>
                          {apprentice.startDate && (
                            <p className="text-slate-500 text-sm">
                              Started {new Date(apprentice.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Progress</span>
                          <span className="text-white font-medium">{apprentice.progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full"
                            style={{ width: `${Math.min(apprentice.progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600 text-sm">{apprentice.totalHours.toLocaleString()} total hrs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600 text-sm">{apprentice.weeklyAvg} hrs/week avg</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Apprentices */}
            {pendingApprentices.length > 0 && (
              <div>
                <h2 className="text-slate-900 font-bold text-lg mb-4">Pending Assignment</h2>
                <div className="space-y-3">
                  {pendingApprentices.map((apprentice) => (
                    <div 
                      key={apprentice.id}
                      className="bg-slate-800/50 rounded-xl p-4 border border-dashed border-slate-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                          <span className="text-slate-500 font-bold text-xl">
                            {apprentice.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-600 font-medium text-lg">{apprentice.name}</p>
                          <p className="text-slate-500 text-sm">Awaiting start date assignment</p>
                        </div>
                        <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/shop-owner" className="flex flex-col items-center gap-1 text-slate-400">
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/shop-owner/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/shop-owner/apprentices" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/pwa/shop-owner/reports" className="flex flex-col items-center gap-1 text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
