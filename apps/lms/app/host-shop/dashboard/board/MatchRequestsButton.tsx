'use client';
import Link from 'next/link';
import { UserPlus, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MatchRequestStats {
  pending: number;
  approved: number;
  total: number;
}

export default function MatchRequestsButton() {
  const [stats, setStats] = useState<MatchRequestStats>({ pending: 0, approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/host-shop/match-requests?limit=1')
      .then(r => r.json())
      .then(d => {
        const total = d.pagination?.total || d.requests?.length || 0;
        setStats({
          pending: d.requests?.filter((r: any) => r.status === 'pending').length || 0,
          approved: d.requests?.filter((r: any) => r.status === 'approved').length || 0,
          total
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Link href="/host-shop/dashboard/match-requests" className="bg-white rounded-xl border p-5 hover:border-rose-300 hover:shadow-sm transition block relative">
      {stats.pending > 0 && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {stats.pending > 9 ? '9+' : stats.pending}
        </div>
      )}
      <UserPlus className="w-5 h-5 text-rose-500 mb-2" />
      <h3 className="font-semibold text-slate-900">Match Requests</h3>
      {!loading && (
        <div className="mt-2 space-y-1">
          {stats.pending > 0 && (
            <p className="text-sm text-rose-600 font-medium">{stats.pending} pending</p>
          )}
          {stats.approved > 0 && (
            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {stats.approved} approved
            </p>
          )}
          {stats.pending === 0 && stats.approved === 0 && (
            <p className="text-sm text-slate-500">Review apprentice requests</p>
          )}
        </div>
      )}
      {loading && (
        <p className="text-sm text-slate-500 mt-1">Loading...</p>
      )}
    </Link>
  );
}
