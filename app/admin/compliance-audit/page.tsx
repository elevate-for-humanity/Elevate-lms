'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  XCircle,
  FileText,
  Users,
  DollarSign,
  ClipboardCheck,
  Signature,
  Calendar,
  RefreshCw
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ComplianceAuditPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAudits();
  }, []);

  async function fetchAudits() {
    setLoading(true);
    try {
      const res = await fetch('/api/compliance-audit');
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (error) {
      // silent
    }
    setLoading(false);
  }

  async function generateAudit() {
    setGenerating(true);
    try {
      const res = await fetch('/api/compliance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      if (res.ok) {
        fetchAudits();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to generate audit');
      }
    } catch (error) {
      // silent
    }
    setGenerating(false);
  }

  async function signAudit(auditId: string, role: string) {
    try {
      const res = await fetch('/api/compliance-audit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, action: `sign_${role}` }),
      });
      if (res.ok) {
        fetchAudits();
        if (selectedAudit?.id === auditId) {
          const updated = await fetch(`/api/compliance-audit?id=${auditId}`);
          const data = await updated.json();
          setSelectedAudit(data.audits?.[0]);
        }
      }
    } catch (error) {
      // silent
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Compliance Audit' }]} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Monthly Compliance Audit</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review enrollment integrity, funding distribution, and payment compliance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={generateAudit}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate Audit
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Audit list */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Audit History</h2>

            {loading ? (
              <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
            ) : audits.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                No audits found. Generate one to get started.
              </div>
            ) : (
              audits.map((audit) => (
                <button
                  key={audit.id}
                  onClick={() => setSelectedAudit(audit)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedAudit?.id === audit.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {MONTHS[audit.audit_month - 1]} {audit.audit_year}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                      {audit.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {audit.total_enrollments} enrollments · {audit.auto_flagged_issues?.length || 0} flags
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Audit detail */}
          <div className="lg:col-span-2">
            {selectedAudit ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">

                {/* Detail header */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {MONTHS[selectedAudit.audit_month - 1]} {selectedAudit.audit_year} Audit
                  </h2>
                </div>

                {/* Flagged issues */}
                {selectedAudit.auto_flagged_issues?.length > 0 && (
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      Auto-Flagged Issues ({selectedAudit.auto_flagged_issues.length})
                    </h3>
                    <ul className="space-y-2">
                      {selectedAudit.auto_flagged_issues.map((issue: any, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                          {issue.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metrics */}
                <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100">
                  <MetricCard label="Total Enrollments" value={selectedAudit.total_enrollments} icon={Users} />
                  <MetricCard label="Completed Intakes" value={selectedAudit.completed_intakes} icon={ClipboardCheck} />
                  <MetricCard label="Lane 3 %" value={`${selectedAudit.lane3_percentage?.toFixed(1)}%`} icon={DollarSign} />
                  <MetricCard label="Beyond 90 Days" value={selectedAudit.accounts_beyond_90_days} icon={Calendar} />
                </div>

                {/* Funding distribution */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Funding Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Workforce-Funded', value: selectedAudit.workforce_funded_count },
                      { label: 'Employer-Sponsored', value: selectedAudit.employer_sponsored_count },
                      { label: 'Structured Tuition', value: selectedAudit.structured_tuition_count },
                    ].map(({ label, value }) => (
                      <div key={label} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-2xl font-semibold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment compliance */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Payment Compliance</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Current', value: selectedAudit.accounts_current },
                      { label: 'Missed Payment', value: selectedAudit.accounts_missed_payment },
                      { label: 'Paused', value: selectedAudit.accounts_paused },
                      { label: 'Beyond 90 Days', value: selectedAudit.accounts_beyond_90_days },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-xl font-semibold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign-offs */}
                <div className="px-6 py-5 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Leadership Sign-Off</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <SignoffCard
                      role="Admissions Lead"
                      signed={selectedAudit.admissions_lead_signed}
                      signedAt={selectedAudit.admissions_lead_signed_at}
                      onSign={() => signAudit(selectedAudit.id, 'admissions_lead')}
                    />
                    <SignoffCard
                      role="Program Director"
                      signed={selectedAudit.program_director_signed}
                      signedAt={selectedAudit.program_director_signed_at}
                      onSign={() => signAudit(selectedAudit.id, 'program_director')}
                    />
                    <SignoffCard
                      role="Executive"
                      signed={selectedAudit.executive_signed}
                      signedAt={selectedAudit.executive_signed_at}
                      onSign={() => signAudit(selectedAudit.id, 'executive')}
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-16 text-center text-sm text-gray-400">
                Select an audit to view details
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <Icon className="w-4 h-4 text-gray-400 mb-2" />
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SignoffCard({
  role,
  signed,
  signedAt,
  onSign,
}: {
  role: string;
  signed: boolean;
  signedAt: string | null;
  onSign: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg border ${signed ? 'border-gray-300 bg-white' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Signature className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{role}</span>
      </div>
      {signed ? (
        <p className="text-xs text-gray-500">
          Signed {new Date(signedAt!).toLocaleDateString()}
        </p>
      ) : (
        <button
          onClick={onSign}
          className="text-xs px-3 py-1 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 transition-colors"
        >
          Sign Now
        </button>
      )}
    </div>
  );
}
