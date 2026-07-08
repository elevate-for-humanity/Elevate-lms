'use client';

import { useState } from 'react';
import { MapPin, Search, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  geocoded: boolean;
}

export default function GeocodingManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shops/geocoding');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const geocodeLocation = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/shops/geocoding/${id}/geocode`, { method: 'POST' });
      if (res.ok) {
        setLocations(locations.map(loc => loc.id === id ? { ...loc, geocoded: true } : loc));
      }
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6" /> Geocoding Manager</h1>
        <button onClick={fetchLocations} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordinates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLocations.map(loc => (
              <tr key={loc.id}>
                <td className="px-4 py-3 font-medium">{loc.name}</td>
                <td className="px-4 py-3 text-gray-600">{loc.address}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-sm">
                  {loc.geocoded ? `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}` : '-'}
                </td>
                <td className="px-4 py-3">
                  {loc.geocoded ? (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Geocoded</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="w-4 h-4" /> Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!loc.geocoded && (
                    <button
                      onClick={() => geocodeLocation(loc.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Geocode
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
