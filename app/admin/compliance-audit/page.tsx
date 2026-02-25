'use client';
import Image from 'next/image';
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
      console.error('Failed to fetch audits:', error);
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
      console.error('Failed to generate audit:', error);
    }
    setGenerating(false);
  }

  async function signAudit(auditId: string, role: string) {
    try {
      const res = await fetch('/api/compliance-audit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          auditId, 
          action: `sign_${role}` 
        }),
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
      console.error('Failed to sign audit:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Compliance Audit" }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Compliance Audit</h1>
            <p className="text-gray-600 mt-1">
              Review enrollment integrity, funding distribution, and payment compliance
            </p>
          </div>
          
          {/* Generate New Audit */}
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={generateAudit}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Generate Audit
            </button>
          </div>
        </div>

        {/* Audit List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audit Cards */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-semibold text-gray-900">Audit History</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : audits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No audits found. Generate one to get started.
              </div>
            ) : (
              audits.map((audit) => (
                <button
                  key={audit.id}
                  onClick={() => setSelectedAudit(audit)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    selectedAudit?.id === audit.id
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {MONTHS[audit.audit_month - 1]} {audit.audit_year}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      audit.status === 'completed' 
                        ? 'bg-brand-green-100 text-brand-green-700'
                        : audit.status === 'pending_signoff'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {audit.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {audit.total_enrollments} enrollments • {audit.auto_flagged_issues?.length || 0} flags
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Audit Detail */}
          <div className="lg:col-span-2">
            {selectedAudit ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">
                    {MONTHS[selectedAudit.audit_month - 1]} {selectedAudit.audit_year} Audit
                  </h2>
                </div>

                {/* Auto-Flagged Issues */}
                {selectedAudit.auto_flagged_issues?.length > 0 && (
                  <div className="p-6 bg-brand-red-50 border-b border-brand-red-100">
                    <h3 className="font-semibold text-brand-red-800 flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5" />
                      Auto-Flagged Issues ({selectedAudit.auto_flagged_issues.length})
                    </h3>
                    <ul className="space-y-2">
                      {selectedAudit.auto_flagged_issues.map((issue: any, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-brand-red-700">
                          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {issue.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    label="Total Enrollments"
                    value={selectedAudit.total_enrollments}
                    icon={Users}
                  />
                  <MetricCard
                    label="Completed Intakes"
                    value={selectedAudit.completed_intakes}
                    icon={ClipboardCheck}
                    color={selectedAudit.enrollments_without_intake > 0 ? 'red' : 'green'}
                  />
                  <MetricCard
                    label="Lane 3 %"
                    value={`${selectedAudit.lane3_percentage?.toFixed(1)}%`}
                    icon={DollarSign}
                    color={selectedAudit.lane3_threshold_exceeded ? 'red' : 'green'}
                  />
                  <MetricCard
                    label="Beyond 90 Days"
                    value={selectedAudit.accounts_beyond_90_days}
                    icon={Calendar}
                    color={selectedAudit.accounts_beyond_90_days > 0 ? 'red' : 'green'}
                  />
                </div>

                {/* Funding Distribution */}
                <div className="p-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Funding Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-brand-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-brand-green-700">
                        {selectedAudit.workforce_funded_count}
                      </p>
                      <p className="text-sm text-brand-green-600">Workforce-Funded</p>
                    </div>
                    <div className="p-4 bg-brand-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-brand-blue-700">
                        {selectedAudit.employer_sponsored_count}
                      </p>
                      <p className="text-sm text-brand-blue-600">Employer-Sponsored</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-700">
                        {selectedAudit.structured_tuition_count}
                      </p>
                      <p className="text-sm text-slate-600">Structured Tuition</p>
                    </div>
                  </div>
                </div>

                {/* Payment Compliance */}
                <div className="p-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Compliance</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">{selectedAudit.accounts_current}</p>
                      <p className="text-xs text-gray-500">Current</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-600">{selectedAudit.accounts_missed_payment}</p>
                      <p className="text-xs text-gray-500">Missed Payment</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-brand-orange-600">{selectedAudit.accounts_paused}</p>
                      <p className="text-xs text-gray-500">Paused</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-brand-red-600">{selectedAudit.accounts_beyond_90_days}</p>
                      <p className="text-xs text-gray-500">Beyond 90 Days</p>
                    </div>
                  </div>
                </div>

                {/* Sign-offs */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-4">Leadership Sign-Off</h3>
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
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
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
  color = 'gray' 
}: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color?: string;
}) {
  const colors = {
    gray: 'bg-gray-50 text-gray-600',
    green: 'bg-brand-green-50 text-brand-green-600',
    red: 'bg-brand-red-50 text-brand-red-600',
  };

  return (
    <div className={`p-4 rounded-lg ${colors[color as keyof typeof colors]}`}>
      <Icon className="w-5 h-5 mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-75">{label}</p>
    </div>
  );
}

function SignoffCard({ 
  role, 
  signed, 
  signedAt, 
  onSign 
}: { 
  role: string; 
  signed: boolean; 
  signedAt: string | null; 
  onSign: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      signed ? 'border-brand-green-200 bg-brand-green-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {signed ? (
          <span className="text-slate-400 flex-shrink-0">•</span>
        ) : (
          <Signature className="w-5 h-5 text-gray-400" />
        )}
        <span className="font-medium text-gray-900">{role}</span>
      </div>
      
      {signed ? (
        <p className="text-xs text-brand-green-600">
          Signed {new Date(signedAt!).toLocaleDateString()}
        </p>
      ) : (
        <button
          onClick={onSign}
          className="text-xs px-3 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
        >
          Sign Now
        </button>
      )}
    </div>
  );
}
