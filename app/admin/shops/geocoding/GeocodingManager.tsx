'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, RefreshCw, XCircle, Loader2 } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_at: string | null;
  geocode_source: string | null;
  geocode_failed_at: string | null;
  geocode_error: string | null;
  active: boolean;
}

interface Props {
  shops: Shop[];
}

export default function GeocodingManager({ shops }: Props) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [currentShop, setCurrentShop] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, 'success' | 'error'>>({});
  const [filter, setFilter] = useState<'all' | 'needs' | 'geocoded' | 'failed'>('needs');

  const needsGeocoding = shops.filter(s => s.active && !s.latitude && !s.geocode_failed_at);

  const filteredShops = shops.filter(s => {
    if (filter === 'needs') return s.active && !s.latitude && !s.geocode_failed_at;
    if (filter === 'geocoded') return s.latitude && s.longitude;
    if (filter === 'failed') return s.geocode_failed_at;
    return true;
  });

  const geocodeSingle = async (shopId: string) => {
    setCurrentShop(shopId);
    try {
      const res = await fetch('/api/admin/shops/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId }),
      });
      const data = await res.json();
      setResults(prev => ({ ...prev, [shopId]: data.success ? 'success' : 'error' }));
    } catch {
      setResults(prev => ({ ...prev, [shopId]: 'error' }));
    }
    setCurrentShop(null);
  };

  const geocodeAll = async () => {
    setProcessing(true);
    for (const shop of needsGeocoding) {
      setCurrentShop(shop.id);
      try {
        const res = await fetch('/api/admin/shops/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_id: shop.id }),
        });
        const data = await res.json();
        setResults(prev => ({ ...prev, [shop.id]: data.success ? 'success' : 'error' }));
      } catch {
        setResults(prev => ({ ...prev, [shop.id]: 'error' }));
      }
      // Rate limit: 100ms between requests
      await new Promise(r => setTimeout(r, 100));
    }
    setCurrentShop(null);
    setProcessing(false);
    router.refresh();
  };

  const retryFailed = async (shopId: string) => {
    // Clear failed status first
    await fetch('/api/admin/shops/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shopId, retry: true }),
    });
    router.refresh();
  };

  const formatAddress = (shop: Shop) => {
    const parts = [shop.address1, shop.address2, shop.city, shop.state, shop.zip].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('needs')}
            className={`px-3 py-1 rounded text-sm ${filter === 'needs' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}
          >
            Needs Geocoding
          </button>
          <button
            onClick={() => setFilter('geocoded')}
            className={`px-3 py-1 rounded text-sm ${filter === 'geocoded' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
          >
            Geocoded
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1 rounded text-sm ${filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
          >
            Failed
          </button>
        </div>

        {needsGeocoding.length > 0 && (
          <button
            onClick={geocodeAll}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            Geocode All ({needsGeocoding.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordinates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredShops.map(shop => (
              <tr key={shop.id} className={currentShop === shop.id ? 'bg-brand-blue-50' : ''}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{shop.name}</div>
                  {!shop.active && <span className="text-xs text-gray-400">Inactive</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatAddress(shop)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {shop.latitude && shop.longitude ? (
                    <span className="font-mono text-xs">
                      {shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {results[shop.id] === 'success' ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <span className="text-slate-400 flex-shrink-0">•</span> Done
                    </span>
                  ) : results[shop.id] === 'error' ? (
                    <span className="flex items-center gap-1 text-red-600 text-sm">
                      <XCircle className="w-4 h-4" /> Error
                    </span>
                  ) : shop.geocoded_at ? (
                    <span className="text-green-600 text-sm">
                      {shop.geocode_source}
                    </span>
                  ) : shop.geocode_failed_at ? (
                    <span className="text-red-600 text-sm" title={shop.geocode_error || ''}>
                      Failed
                    </span>
                  ) : currentShop === shop.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-blue-600" />
                  ) : (
                    <span className="text-gray-400 text-sm">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {shop.geocode_failed_at ? (
                    <button
                      onClick={() => retryFailed(shop.id)}
                      className="text-brand-blue-600 hover:text-brand-blue-800 text-sm"
                    >
                      <RefreshCw className="w-4 h-4 inline" /> Retry
                    </button>
                  ) : !shop.latitude && !currentShop ? (
                    <button
                      onClick={() => geocodeSingle(shop.id)}
                      disabled={processing}
                      className="text-brand-blue-600 hover:text-brand-blue-800 text-sm disabled:opacity-50"
                    >
                      Geocode
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {filteredShops.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No shops match this filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
