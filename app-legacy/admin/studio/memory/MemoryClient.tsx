'use client';

import { useState } from 'react';
import { Brain, Plus, Trash2, Search, RefreshCw } from 'lucide-react';

interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  type: 'fact' | 'preference' | 'context';
  created_at: string;
  updated_at: string;
}

export default function MemoryClient() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/memory');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this memory entry?')) return;
    try {
      await fetch(`/api/admin/studio/memory/${id}`, { method: 'DELETE' });
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.key.toLowerCase().includes(search.toLowerCase()) || 
    e.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-6 h-6" /> AI Memory</h1>
        <button onClick={fetchEntries} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search memory..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Entries</p>
          <p className="text-2xl font-bold">{entries.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Facts</p>
          <p className="text-2xl font-bold text-blue-600">{entries.filter(e => e.type === 'fact').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Preferences</p>
          <p className="text-2xl font-bold text-green-600">{entries.filter(e => e.type === 'preference').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.map(entry => (
              <tr key={entry.id}>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    entry.type === 'fact' ? 'bg-blue-100 text-blue-800' :
                    entry.type === 'preference' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>{entry.type}</span>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{entry.key}</td>
                <td className="px-4 py-3 text-gray-600 max-w-md truncate">{entry.value}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{entry.updated_at}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
