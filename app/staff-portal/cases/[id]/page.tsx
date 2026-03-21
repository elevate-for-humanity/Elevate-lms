import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadCaseFile } from '@/lib/case-file/loader';
import { 
  User, FileText, GraduationCap, Briefcase, Shield, 
  Clock, AlertCircle, XCircle, ChevronRight,
  Phone, Mail, MapPin, Calendar,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Participant Case File | Staff Portal',
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    active: { bg: 'bg-brand-green-100', text: 'text-brand-green-700', icon: CheckCircle },
    completed: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-700', icon: CheckCircle },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    eligible: { bg: 'bg-brand-green-100', text: 'text-brand-green-700', icon: CheckCircle },
    ineligible: { bg: 'bg-brand-red-100', text: 'text-brand-red-700', icon: XCircle },
    enrolled_pending_approval: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    paused: { bg: 'bg-brand-red-100', text: 'text-brand-red-700', icon: AlertCircle },
    withdrawn: { bg: 'bg-white', text: 'text-slate-700', icon: XCircle },
    approved: { bg: 'bg-brand-green-100', text: 'text-brand-green-700', icon: CheckCircle },
    rejected: { bg: 'bg-brand-red-100', text: 'text-brand-red-700', icon: XCircle },
  };

  const c = config[status] || { bg: 'bg-white', text: 'text-slate-700', icon: Clock };
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}

// Section component
function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <Icon className="w-5 h-5 text-slate-600" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default async function CaseFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseFile = await loadCaseFile(id);

  if (!caseFile) {
    notFound();
  }

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-slate-500 mb-1">Case File</div>
              <h1 className="text-2xl font-bold text-slate-900">{caseFile.profile.fullName}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="font-mono bg-white px-2 py-0.5 rounded">{caseFile.caseNumber}</span>
                <StatusBadge status={caseFile.caseStatus.status} />
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <div>Created: {formatDate(caseFile.createdAt)}</div>
              <div>Last Activity: {formatDate(caseFile.lastActivityAt)}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Profile & Contact */}
        <Section title="Participant Profile" icon={User}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                {caseFile.profile.email || '—'}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                {caseFile.profile.phone || '—'}
              </div>
              {caseFile.profile.address && (
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    {caseFile.profile.address.street && <div>{caseFile.profile.address.street}</div>}
                    <div>
                      {caseFile.profile.address.city}, {caseFile.profile.address.state} {caseFile.profile.address.zip}
                    </div>
                    {caseFile.profile.address.county && (
                      <div className="text-sm text-slate-500">{caseFile.profile.address.county} County</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 mb-2">Demographics</div>
              <div className="flex flex-wrap gap-2">
                {caseFile.profile.demographics?.veteran && (
                  <span className="bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded text-xs">Veteran</span>
                )}
                {caseFile.profile.demographics?.justiceInvolved && (
                  <span className="bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded text-xs">Justice-Involved</span>
                )}
                {caseFile.profile.demographics?.disability && (
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">Disability</span>
                )}
                {caseFile.profile.demographics?.publicAssistance && (
                  <span className="bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded text-xs">Public Assistance</span>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Eligibility */}
        <Section title="Eligibility & Funding" icon={Shield}>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-500 mb-1">Status</div>
              <StatusBadge status={caseFile.eligibility.status} />
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Funding Source</div>
              <div className="font-medium text-slate-900">
                {caseFile.eligibility.fundingSource?.toUpperCase() || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">WorkOne ID</div>
              <div className="font-mono text-slate-900">
                {caseFile.eligibility.workOneId || '—'}
              </div>
            </div>
          </div>
          {caseFile.eligibility.notes && (
            <div className="mt-4 p-3 bg-white rounded-lg text-sm text-slate-600">
              <div className="font-medium text-slate-700 mb-1">Advisor Notes</div>
              {caseFile.eligibility.notes}
            </div>
          )}
        </Section>

        {/* Enrollments */}
        <Section title="Enrollments" icon={GraduationCap}>
          {caseFile.enrollments.length === 0 ? (
            <div className="text-slate-500 text-sm">No enrollments</div>
          ) : (
            <div className="space-y-3">
              {caseFile.enrollments.map(enrollment => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{enrollment.programName}</div>
                    <div className="text-sm text-slate-500">
                      Enrolled: {formatDate(enrollment.enrolledAt)}
                      {enrollment.completedAt && ` • Completed: ${formatDate(enrollment.completedAt)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {enrollment.paymentOption && (
                      <span className="text-xs text-slate-500">
                        {enrollment.paymentOption} {enrollment.amountPaid ? `($${enrollment.amountPaid})` : ''}
                      </span>
                    )}
                    <StatusBadge status={enrollment.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Documents */}
        <Section title="Documents" icon={FileText}>
          {caseFile.documents.length === 0 ? (
            <div className="text-slate-500 text-sm">No documents uploaded</div>
          ) : (
            <div className="space-y-2">
              {caseFile.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{doc.name}</div>
                    <div className="text-sm text-slate-500">
                      {doc.type} • Uploaded: {formatDate(doc.uploadedAt)}
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Credentials */}
        <Section title="Credentials" icon={GraduationCap}>
          {caseFile.credentials.length === 0 ? (
            <div className="text-slate-500 text-sm">No credentials issued</div>
          ) : (
            <div className="space-y-2">
              {caseFile.credentials.map(cred => (
                <div key={cred.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{cred.name}</div>
                    <div className="text-sm text-slate-500">
                      Issued: {formatDate(cred.issuedAt)}
                      {cred.expiresAt && ` • Expires: ${formatDate(cred.expiresAt)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cred.verified && (
                      <span className="bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        <span className="text-slate-400 flex-shrink-0">•</span> Verified
                      </span>
                    )}
                    {cred.verificationUrl && (
                      <Link href={cred.verificationUrl} className="text-brand-blue-600 text-sm hover:underline">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Employment */}
        <Section title="Employment Outcomes" icon={Briefcase}>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-500 mb-1">Status</div>
              <StatusBadge status={caseFile.employment.status} />
            </div>
            {caseFile.employment.employer && (
              <div>
                <div className="text-sm text-slate-500 mb-1">Employer</div>
                <div className="font-medium text-slate-900">{caseFile.employment.employer}</div>
              </div>
            )}
            {caseFile.employment.position && (
              <div>
                <div className="text-sm text-slate-500 mb-1">Position</div>
                <div className="font-medium text-slate-900">{caseFile.employment.position}</div>
              </div>
            )}
          </div>
        </Section>

        {/* Activity Log */}
        <Section title="Activity Log" icon={Clock}>
          {caseFile.activityLog.length === 0 ? (
            <div className="text-slate-500 text-sm">No activity recorded</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {caseFile.activityLog.slice(0, 20).map(log => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="text-slate-400 w-32 flex-shrink-0">
                    {formatDate(log.performedAt)}
                  </div>
                  <div className="text-slate-700">{log.description}</div>
                  <div className="text-slate-400 text-xs">{log.performedBy}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          Case file data is confidential. Access is logged and audited.
        </div>
      </footer>
    </div>
  );
}
