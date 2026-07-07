'use client';

import { useState } from 'react';
import { Search, User, Building, Mail, Phone, MapPin, Edit2, Save } from 'lucide-react';

interface DirectoryEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  location: string;
}

export default function DirectoryInfoClient() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DirectoryEntry>>({});

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/directory');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to fetch directory:', err);
    }
    setLoading(false);
  };

  const startEdit = (entry: DirectoryEntry) => {
    setEditingId(entry.id);
    setEditForm(entry);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/admin/directory/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEntries(entries.map(e => e.id === editingId ? { ...e, ...editForm } as DirectoryEntry : e));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const filteredEntries = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">FERPA Directory Info</h1>
        <button
          onClick={fetchEntries}
          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search directory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              No directory entries found
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-4">
                {editingId === entry.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                      placeholder="Name"
                    />
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                      placeholder="Phone"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 inline mr-1" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-brand-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{entry.name}</h3>
                          <p className="text-sm text-slate-500">{entry.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1 text-slate-400 hover:text-brand-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {entry.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {entry.phone}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building className="w-4 h-4 text-slate-400" />
                        {entry.department}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {entry.location}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
