'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, XCircle, User,
  Loader2, AlertCircle, Building2, Users, FileText
} from 'lucide-react';

interface PendingEntry {
  id: string;
  apprenticeId: string;
  apprenticeName: string;
  weekEnding: string;
  hours: number;
  notes?: string;
  submittedAt: string;
}

export default function ApproveHoursPage() {
  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const fetchPendingEntries = async () => {
    try {
      const response = await fetch('/api/pwa/shop-owner/pending-hours');
      
      if (response.status === 401) {
        setError('Please sign in to approve hours');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending entries');
      }
      
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Error fetching pending entries:', err);
      setError('Failed to load pending hours');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId: string) => {
    setProcessing(entryId);
    try {
      const response = await fetch('/api/pwa/shop-owner/approve-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, action: 'approve' }),
      });

      if (response.ok) {
        setEntries(entries.filter(e => e.id !== entryId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve');
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('Failed to approve hours');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (entryId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    
    setProcessing(entryId);
    try {
      const response = await fetch('/api/pwa/shop-owner/approve-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, action: 'reject', reason }),
      });

      if (response.ok) {
        setEntries(entries.filter(e => e.id !== entryId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Failed to reject hours');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-900">Loading pending hours...</p>
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
            href="/login?redirect=/pwa/shop-owner/approve-hours"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/shop-owner" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Approve Hours</h1>
            <p className="text-slate-500 text-sm">{entries.length} pending approval</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        {entries.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <span className="text-slate-500 flex-shrink-0">•</span>
            <h2 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h2>
            <p className="text-slate-500">No pending hours to approve</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-brand-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">{entry.apprenticeName}</p>
                  <p className="text-slate-500 text-sm">
                    Week ending {new Date(entry.weekEnding).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{entry.hours}</p>
                  <p className="text-slate-500 text-sm">hours</p>
                </div>
              </div>

              {entry.notes && (
                <p className="text-slate-500 text-sm mb-4 bg-slate-700/50 rounded-lg p-3">
                  {entry.notes}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(entry.id)}
                  disabled={processing === entry.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-green-600 text-white py-3 rounded-xl font-medium hover:bg-brand-green-700 disabled:opacity-50"
                >
                  {processing === entry.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(entry.id)}
                  disabled={processing === entry.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-red-600/20 border border-brand-red-500/30 text-brand-red-400 py-3 rounded-xl font-medium hover:bg-brand-red-600/30 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </main>

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
          <Link href="/pwa/shop-owner/apprentices" className="flex flex-col items-center gap-1 text-slate-400">
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
