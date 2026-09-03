export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Search, Plus, Filter, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cases | Workforce | Admin | Elevate For Humanity',
};

export default async function CasesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await createClient();

  const { data: cases } = await db
    .from('workforce_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workforce Cases</h1>
          <p className="text-gray-600 mt-1">Manage participant cases and issues</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Case ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Participant</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Subject</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Priority</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cases && cases.length > 0 ? (
              cases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{c.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{c.participant_name || 'N/A'}</td>
                  <td className="px-4 py-3">{c.subject || 'No subject'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      c.status === 'open' ? 'bg-red-100 text-red-700' :
                      c.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                      c.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {c.status || 'open'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className={`${
                      c.priority === 'high' ? 'text-red-600' :
                      c.priority === 'medium' ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      {c.priority || 'medium'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No cases found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
