import { Metadata } from 'next';
import { FileText, Plus, Edit, Eye } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SOPs | Admin',
  description: 'Standard Operating Procedures management',
};

const sampleSOPs = [
  { id: 1, title: 'Student Enrollment Process', category: 'Enrollment', updated: '2026-07-15', status: 'Active' },
  { id: 2, title: 'Apprenticeship Registration', category: 'Apprenticeship', updated: '2026-07-10', status: 'Active' },
  { id: 3, title: 'Payment Processing', category: 'Billing', updated: '2026-07-08', status: 'Active' },
  { id: 4, title: 'Document Verification', category: 'Compliance', updated: '2026-07-01', status: 'Draft' },
  { id: 5, title: 'Testing Center Procedures', category: 'Testing', updated: '2026-06-28', status: 'Active' },
];

export default function SOPsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'SOPs' }]} />
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Standard Operating Procedures</h1>
            <p className="text-slate-700 mt-1">Manage and view all SOPs</p>
          </div>
          <Link href="/sops/new" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-5 h-5" /> New SOP
          </Link>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Last Updated</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sampleSOPs.map((sop) => (
                <tr key={sop.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{sop.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{sop.category}</td>
                  <td className="px-6 py-4 text-slate-600">{sop.updated}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sop.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/sops/${sop.id}`} className="p-2 hover:bg-slate-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-slate-600" />
                      </Link>
                      <Link href={`/sops/${sop.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4 text-slate-600" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
