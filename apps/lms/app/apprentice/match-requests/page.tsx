'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MyMatchRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetch('/api/host-shop/match-requests')
      .then(r => r.json())
      .then(d => { setRequests(d.requests || []); setLoading(false); });
  }, []);

  const filtered = filter ? requests.filter(r => r.status === filter) : requests;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold">My Match Requests</h1>
          <p className="text-purple-100 mt-2">Track your host shop match requests</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {['', 'pending', 'approved', 'declined', 'withdrawn'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === s ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border'}`}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
        {loading ? <div className="text-center py-20 text-gray-500">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No requests found.</p>
            <Link href="/lms/host-shops" className="mt-4 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg">Browse Shops</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{req.shop?.name || 'Shop'}</h3>
                    <p className="text-gray-500 text-sm">{req.shop?.city}, {req.shop?.state}</p>
                    <p className="text-gray-400 text-xs mt-1">Requested {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'declined' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{req.status}</span>
                </div>
                {req.message && <p className="mt-3 text-gray-600 text-sm">"{req.message}"</p>}
                {req.status === 'approved' && req.placement && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                    <p className="text-emerald-700 text-sm font-medium">Placement Active</p>
                    <p className="text-emerald-600 text-xs">Started: {new Date(req.placement.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {req.status === 'pending' && (
                  <p className="mt-3 text-amber-600 text-sm">Awaiting shop review. You'll be notified when they respond.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
