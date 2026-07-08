'use client';

import { useState } from 'react';
import { Camera, Download, Trash2, RefreshCw, Clock } from 'lucide-react';

interface Snapshot {
  id: string;
  name: string;
  type: 'full' | 'partial';
  size_mb: number;
  created_at: string;
  description?: string;
}

export default function SnapshotsClient() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/snapshots');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const createSnapshot = async (type: 'full' | 'partial') => {
    try {
      const res = await fetch('/api/admin/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        fetchSnapshots();
      }
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const deleteSnapshot = async (id: string) => {
    if (!confirm('Delete this snapshot?')) return;
    try {
      await fetch(`/api/admin/snapshots/${id}`, { method: 'DELETE' });
      setSnapshots(snapshots.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const downloadSnapshot = (id: string, name: string) => {
    window.open(`/api/admin/snapshots/${id}/download`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Camera className="w-6 h-6" /> Snapshots</h1>
        <div className="flex gap-2">
          <button onClick={fetchSnapshots} disabled={loading} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => createSnapshot('partial')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create Partial</button>
          <button onClick={() => createSnapshot('full')} className="px-4 py-2 bg-green-600 text-white rounded-lg">Create Full</button>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {snapshots.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <Camera className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  No snapshots found
                </td>
              </tr>
            ) : (
              snapshots.map(snapshot => (
                <tr key={snapshot.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{snapshot.name}</p>
                    {snapshot.description && <p className="text-sm text-gray-500">{snapshot.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${snapshot.type === 'full' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {snapshot.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{snapshot.size_mb} MB</td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-1"><Clock className="w-4 h-4" />{snapshot.created_at}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => downloadSnapshot(snapshot.id, snapshot.name)} className="p-1 text-gray-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                      <button onClick={() => deleteSnapshot(snapshot.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
