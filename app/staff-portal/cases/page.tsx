export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { loadCaseFileSummaries } from '@/lib/case-file/loader';
import { Search, Filter, ChevronRight, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Participant Case Files | Staff Portal',
  description: 'View and manage participant case files.',
};

// Status badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-brand-green-100 text-brand-green-700',
    closed: 'bg-slate-100 text-slate-700',
    archived: 'bg-slate-100 text-slate-500',
    pending: 'bg-amber-100 text-amber-700',
    eligible: 'bg-brand-green-100 text-brand-green-700',
    ineligible: 'bg-brand-red-100 text-brand-red-700',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}

export default async function CaseFilesListPage() {
  const cases = await loadCaseFileSummaries({ limit: 50 });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Participant Case Files</h1>
          <p className="text-slate-600 mt-1">
            Unified view of all participant records, enrollments, and outcomes.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or case number..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
            <div className="text-slate-600 text-sm">Total Cases</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-brand-green-600">
              {cases.filter(c => c.caseStatus === 'active').length}
            </div>
            <div className="text-slate-600 text-sm">Active</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-brand-blue-600">
              {cases.filter(c => c.eligibilityStatus === 'eligible').length}
            </div>
            <div className="text-slate-600 text-sm">Eligible</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-amber-600">
              {cases.filter(c => c.eligibilityStatus === 'pending').length}
            </div>
            <div className="text-slate-600 text-sm">Pending Review</div>
          </div>
        </div>

        {/* Case List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Case #</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Participant</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Program</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Eligibility</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Last Activity</th>
                  <th className="text-left py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No case files found
                    </td>
                  </tr>
                ) : (
                  cases.map(caseFile => (
                    <tr key={caseFile.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-slate-600">{caseFile.caseNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{caseFile.participantName}</div>
                            <div className="text-slate-500 text-sm">{caseFile.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-sm">
                        {caseFile.currentProgram || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={caseFile.eligibilityStatus} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={caseFile.caseStatus} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-sm">
                        {formatDate(caseFile.lastActivityAt)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/staff-portal/cases/${caseFile.id}`}
                          className="text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 text-sm font-medium"
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Case file access is logged and audited. Only view records you are authorized to access.
        </p>
      </div>
    </div>
  );
}
