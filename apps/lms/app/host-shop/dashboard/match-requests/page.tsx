'use client';
import { useEffect, useState } from 'react';

export default function HostShopMatchRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actioning, setActioning] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<any>(null);
  const [declineNote, setDeclineNote] = useState('');

  useEffect(() => {
    fetch('/api/host-shop/match-requests')
      .then(r => r.json())
      .then(d => { setRequests(d.requests || []); setLoading(false); });
  }, []);

  async function handleAction(id: string, action: string, note?: string) {
    setActioning(id);
    const res = await fetch(`/api/host-shop/match-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, shop_notes: note }),
    });
    const d = await res.json();
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? d.request : r));
    }
    setActioning(null);
    setDeclineModal(null);
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-rose-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold">Match Requests</h1>
          <p className="text-rose-100 mt-1">{pendingCount} pending request{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your review</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {[['pending', 'Pending'], ['approved', 'Approved'], ['declined', 'Declined'], ['all', 'All']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === v ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 border'}`}>
              {l}{v === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-20 text-gray-500">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <p className="text-gray-400 text-lg">No requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{req.apprentice?.full_name || 'Apprentice'}</h3>
                    <p className="text-gray-500 text-sm">{req.apprentice?.email}</p>
                    <p className="text-gray-400 text-xs">Applied {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'declined' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{req.status}</span>
                </div>
                {req.apprentice_notes && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-500 font-medium mb-1">Apprentice Notes</p>
                    <p className="text-gray-700 text-sm">{req.apprentice_notes}</p>
                  </div>
                )}
                {req.message && (
                  <p className="text-gray-600 text-sm italic mb-3">"{req.message}"</p>
                )}
                {req.status === 'pending' ? (
                  <div className="flex gap-3 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={actioning === req.id}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actioning === req.id ? 'Processing...' : 'Approve Match'}
                    </button>
                    <button
                      onClick={() => setDeclineModal(req)}
                      disabled={actioning === req.id}
                      className="flex-1 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                ) : req.status === 'approved' ? (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-emerald-600 text-sm">✓ Match approved. An admin will create the formal placement record.</p>
                    {req.shop_notes && <p className="text-gray-500 text-sm mt-1">Your note: {req.shop_notes}</p>}
                  </div>
                ) : req.status === 'declined' && (
                  <div className="mt-4 pt-4 border-t">
                    {req.shop_notes && <p className="text-gray-500 text-sm">Reason: {req.shop_notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {declineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-4">Decline Request</h3>
            <p className="text-gray-500 text-sm mb-4">From: {declineModal.apprentice?.full_name}</p>
            <textarea
              value={declineNote}
              onChange={e => setDeclineNote(e.target.value)}
              placeholder="Reason for declining (optional)..."
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => handleAction(declineModal.id, 'decline', declineNote)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Confirm Decline</button>
              <button onClick={() => setDeclineModal(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
