import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CheckCircle, Clock, AlertTriangle, Upload } from 'lucide-react';
import ComplianceUpload from './ComplianceUpload';

export const dynamic = 'force-dynamic';

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  mou: 'Memorandum of Understanding',
  insurance: 'Certificate of Insurance',
  w9: 'W-9',
  state_license: 'State License',
  etpl_approval: 'ETPL Approval',
  accreditation: 'Accreditation Certificate',
  other: 'Other Document',
};

export default async function ProviderCompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/provider/compliance');

  const db = createAdminClient()!;
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) redirect('/unauthorized');

  const { data: artifacts } = await supabase
    .from('provider_compliance_artifacts')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('artifact_type');

  const now = Date.now();
  const categorized = (artifacts ?? []).map(a => {
    const daysLeft = a.expires_at
      ? Math.ceil((new Date(a.expires_at).getTime() - now) / 86400000)
      : null;
    return { ...a, daysLeft };
  });

  const expired = categorized.filter(a => a.daysLeft != null && a.daysLeft <= 0);
  const expiring = categorized.filter(a => a.daysLeft != null && a.daysLeft > 0 && a.daysLeft <= 30);
  const current = categorized.filter(a => a.daysLeft == null || a.daysLeft > 30);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Compliance Documents</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Upload and manage required compliance documents. All documents are reviewed by Elevate staff.
        </p>
      </div>

      {/* Alerts */}
      {expired.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            <strong>{expired.length} document{expired.length > 1 ? 's' : ''} expired:</strong>{' '}
            {expired.map(a => a.label).join(', ')}. Upload renewals to avoid a compliance hold.
          </p>
        </div>
      )}
      {expiring.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            <strong>{expiring.length} document{expiring.length > 1 ? 's' : ''} expiring soon:</strong>{' '}
            {expiring.map(a => `${a.label} (${a.daysLeft}d)`).join(', ')}
          </p>
        </div>
      )}

      {/* Document list */}
      {categorized.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-6">
          {categorized.map(artifact => (
            <div key={artifact.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                {artifact.verified
                  ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : artifact.daysLeft != null && artifact.daysLeft <= 0
                  ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  : <Clock className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                <div>
                  <div className="text-sm font-medium text-slate-900">{artifact.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {ARTIFACT_TYPE_LABELS[artifact.artifact_type] ?? artifact.artifact_type}
                    {artifact.issuer && ` · ${artifact.issuer}`}
                    {artifact.issued_at && ` · Issued ${new Date(artifact.issued_at).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {artifact.daysLeft != null && (
                  <span className={`text-xs font-medium ${
                    artifact.daysLeft <= 0 ? 'text-red-600'
                    : artifact.daysLeft <= 30 ? 'text-yellow-600'
                    : 'text-slate-400'
                  }`}>
                    {artifact.daysLeft <= 0 ? 'Expired'
                      : artifact.expires_at
                      ? `Expires ${new Date(artifact.expires_at).toLocaleDateString()}`
                      : ''}
                  </span>
                )}
                {artifact.verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Verified
                  </span>
                )}
                {(artifact.storage_path || artifact.external_url) && (
                  <a
                    href={artifact.external_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-blue-600 hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900 text-sm">Upload Document</h2>
        </div>
        <ComplianceUpload tenantId={profile.tenant_id} />
      </div>
    </div>
  );
}
