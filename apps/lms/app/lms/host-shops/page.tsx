'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BrowseShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/host-shops/available')
      .then(r => r.json())
      .then(d => { setShops(d.shops || []); setLoading(false); });
  }, []);

  async function requestMatch(shopId: string) {
    setSubmitting(shopId);
    const res = await fetch('/api/host-shop/match-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_shop_id: shopId, program_slug: 'barber-apprenticeship' }),
    });
    const d = await res.json();
    setSubmitting(null);
    if (res.ok) {
      setSubmitted(prev => [...prev, shopId]);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, request_status: 'pending' } : s));
    } else {
      alert(d.error || 'Failed to submit request');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold">Find a Host Shop</h1>
          <p className="text-emerald-100 mt-2 text-lg">Browse approved barber shops accepting apprentices in Indiana</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by city or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-96 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No shops available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops
              .filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase()))
              .map(shop => (
                <div key={shop.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                  {shop.image_url && (
                    <img src={shop.image_url} alt={shop.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{shop.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${shop.request_status === 'pending' ? 'bg-amber-100 text-amber-700' : shop.request_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {shop.request_status === 'pending' ? 'Pending' : shop.request_status === 'approved' ? 'Matched' : 'Available'}
                    </span>
                  </div>
                  {shop.city && shop.state && (
                    <p className="text-gray-500 text-sm mb-2">{shop.city}, {shop.state}</p>
                  )}
                  {shop.services && shop.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {shop.services.slice(0, 4).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  {shop.specializations && shop.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {shop.specializations.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">{shop.slots_available} slot{shop.slots_available !== 1 ? 's' : ''} open</span>
                    {shop.request_status === 'pending' ? (
                      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">Request Pending</span>
                    ) : shop.request_status === 'approved' ? (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">Matched</span>
                    ) : (
                      <button
                        onClick={() => requestMatch(shop.id)}
                        disabled={submitting === shop.id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {submitting === shop.id ? 'Sending...' : 'Request Match'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
