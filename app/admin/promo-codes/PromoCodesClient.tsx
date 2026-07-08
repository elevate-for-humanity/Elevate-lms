'use client';

import { useState } from 'react';
import { Tag, Plus, Search, Edit, Trash2, Copy, CheckCircle } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'expired' | 'disabled';
  program_id?: string;
}

export default function PromoCodesClient() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes');
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'expired': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Expired</span>;
      case 'disabled': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Disabled</span>;
      default: return status;
    }
  };

  const filteredCodes = codes.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="w-6 h-6" /> Promo Codes</h1>
        <button onClick={fetchCodes} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
      </div>
      <div className="flex gap-4">
        <input type="text" placeholder="Search codes..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Create Code</button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uses</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCodes.map(code => (
              <tr key={code.id}>
                <td className="px-4 py-3 font-mono font-bold">{code.code}</td>
                <td className="px-4 py-3">{code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`}</td>
                <td className="px-4 py-3">{code.used_count}{code.max_uses ? `/${code.max_uses}` : ''}</td>
                <td className="px-4 py-3 text-gray-600">{code.valid_until}</td>
                <td className="px-4 py-3">{getStatusBadge(code.status)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => copyCode(code.code)} className="p-1 text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4" /></button>
                    <button className="p-1 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                    <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
