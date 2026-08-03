'use client';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MatchRequestsButton() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/host-shop/match-requests?status=pending')
      .then(r => r.json())
      .then(d => {
        setPendingCount(d.requests?.length || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Link href="/host-shop/dashboard/match-requests" className="bg-white rounded-xl border p-5 hover:border-rose-300 hover:shadow-sm transition block relative">
      {pendingCount > 0 && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </div>
      )}
      <UserPlus className="w-5 h-5 text-rose-500 mb-2" />
      <h3 className="font-semibold text-slate-900">Match Requests</h3>
      <p className="text-sm text-slate-600 mt-1">
        {!loading && pendingCount > 0 ? `${pendingCount} pending` : 'Review apprentice requests'}
      </p>
    </Link>
  );
}
