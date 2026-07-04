'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const SOP_CATEGORIES = [
  { value: 'admissions', label: 'Admissions' },
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'testing', label: 'Testing' },
  { value: 'instructor_duties', label: 'Instructor Duties' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'workone', label: 'WorkOne' },
  { value: 'voc_rehab', label: 'Voc Rehab' },
  { value: 'grants', label: 'Grants' },
  { value: 'billing', label: 'Billing' },
  { value: 'compliance', label: 'Compliance' },
];

export default function SOPsPage() {
  const [sops, setSops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSOP, setNewSOP] = useState({ title: '', category: 'admissions', description: '' });
  const router = useRouter();

  useEffect(() => {
    fetchSOPs();
  }, [filterCategory, filterStatus]);

  async function fetchSOPs() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from('sop_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSops(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load SOPs');
    } finally {
      setLoading(false);
    }
  }

  async function createSOP() {
    if (!newSOP.title.trim()) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('sop_templates')
        .insert({
          title: newSOP.title,
          category: newSOP.category,
          description: newSOP.description,
          content: {
            purpose: '',
            scope: '',
            required_documents: [],
            steps: [],
            responsibilities: [],
            compliance_checklist: [],
          },
          created_by: user?.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      
      setShowCreateModal(false);
      setNewSOP({ title: '', category: 'admissions', description: '' });
      router.push(`/admin/sops/${data.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create SOP');
    }
  }

  async function archiveSOP(id: string) {
    if (!confirm('Archive this SOP?')) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('sop_templates')
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
      fetchSOPs();
    } catch (err: any) {
      alert(err.message || 'Failed to archive SOP');
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">SOP Builder</h1>
          <p className="text-gray-600">Standard Operating Procedures</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create SOP
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Categories</option>
          {SOP_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading SOPs...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sops.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No SOPs found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:underline"
          >
            Create your first SOP
          </button>
        </div>
      )}

      {/* SOP List */}
      {!loading && !error && sops.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Version</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Updated</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sops.map((sop) => (
                <tr key={sop.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/sops/${sop.id}`} className="text-blue-600 hover:underline font-medium">
                      {sop.title}
                    </Link>
                    {sop.description && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">{sop.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100">
                      {SOP_CATEGORIES.find(c => c.value === sop.category)?.label || sop.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      sop.status === 'active' ? 'bg-green-100 text-green-700' :
                      sop.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">v{sop.version}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(sop.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/sops/${sop.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      {sop.status !== 'archived' && (
                        <button
                          onClick={() => archiveSOP(sop.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New SOP</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newSOP.title}
                  onChange={(e) => setNewSOP({ ...newSOP, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., WorkOne Student Enrollment Process"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newSOP.category}
                  onChange={(e) => setNewSOP({ ...newSOP, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {SOP_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newSOP.description}
                  onChange={(e) => setNewSOP({ ...newSOP, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Brief description of this SOP..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createSOP}
                disabled={!newSOP.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create SOP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
