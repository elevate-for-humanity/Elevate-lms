'use client';

import { useState, useEffect } from 'react';
import type { ProgramKey } from '@/lib/programs/host-shops';

type ShopOption = {
  id: string;
  name: string;
  city: string;
  state: string;
};

type Props = {
  program: ProgramKey;
  value: string;
  onChange: (value: string) => void;
};

export default function HostShopSelect({ program, value, onChange }: Props) {
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOther, setShowOther] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  useEffect(() => {
    fetch(`/api/programs/host-shops?program=${program}`)
      .then((r) => r.json())
      .then((data) => {
        setShops(data.shops ?? []);
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [program]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__other__') {
      setShowOther(true);
      onChange('');
    } else {
      setShowOther(false);
      onChange(val);
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherValue(e.target.value);
    onChange(e.target.value);
  };

  // Determine current select value
  const selectValue = showOther ? '__other__' : value || '';

  return (
    <div>
      <label className="block text-sm font-medium text-black mb-1">Select Your Training Shop</label>

      {loading ? (
        <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-400 text-sm">
          Loading approved shops…
        </div>
      ) : (
        <select
          value={selectValue}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 bg-white text-black"
        >
          <option value="">— Select a shop —</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.name}>
              {shop.name} — {shop.city}, {shop.state}
            </option>
          ))}
          <option value="__other__">Other / Not listed</option>
        </select>
      )}

      {showOther && (
        <input
          type="text"
          value={otherValue}
          onChange={handleOtherChange}
          className="w-full mt-2 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-black"
          placeholder="Enter shop name"
          autoFocus
        />
      )}

      {shops.length === 0 && !loading && (
        <p className="mt-1 text-xs text-slate-500">
          No approved shops on file yet.{' '}
          <a href="/programs/barber-apprenticeship/host-shops" className="underline">
            Learn about becoming a training site.
          </a>
        </p>
      )}
    </div>
  );
}
