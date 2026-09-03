import { redirect } from 'next/navigation';
import { CheckCircle, Clock, AlertTriangle, Upload } from 'lucide-react';
import ComplianceUpload from './ComplianceUpload';
import { requireProviderPortal } from '@/lib/auth/provider-access';

export const metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  mou: 'Memorandum of Understanding', insurance: 'Certificate of Insurance', w9: 'W-9', state_license: 'State License', etpl_approval: 'ETPL Approval', accreditation: 'Accreditation Certificate', other: 'Other Document',
};

export default async function ProviderCompliancePage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const { tenant: requestedTenant } = await searchParams;
  const access = await requireProviderPortal(requestedTenant);
  if (access.isPlatformAdmin && access.platformWide) redirect('/provider/dashboard');
  const tenantId = access.tenantId!;

  const { data: artifacts } = await access.db.from('provider_compliance_artifacts').select('*').eq('tenant_id', tenantId).order('artifact_type');
  const now = Date.now();
  const categorized = (artifacts ?? []).map((artifact: any) => ({ ...artifact, daysLeft: artifact.expires_at ? Math.ceil((new Date(artifact.expires_at).getTime() - now) / 86400000) : null }));
  const expired = categorized.filter((a: any) => a.daysLeft != null && a.daysLeft <= 0);
  const expiring = categorized.filter((a: any) => a.daysLeft != null && a.daysLeft > 0 && a.daysLeft <= 30);

  return <div className="p-6 max-w-3xl">
    <div className="mb-6"><h1 className="text-xl font-bold text-slate-900">Compliance Documents</h1><p className="text-slate-500 text-sm mt-0.5">Upload and manage required provider compliance documents.</p>{access.isPlatformAdmin ? <p className="mt-1 text-xs font-bold text-amber-700">Admin oversight · tenant {tenantId}</p> : null}</div>
    {expired.length > 0 ? <Alert tone="red" text={`${expired.length} document${expired.length > 1 ? 's' : ''} expired: ${expired.map((a: any) => a.label).join(', ')}.`} /> : null}
    {expiring.length > 0 ? <Alert tone="yellow" text={`${expiring.length} document${expiring.length > 1 ? 's' : ''} expiring soon: ${expiring.map((a: any) => `${a.label} (${a.daysLeft}d)`).join(', ')}.`} /> : null}

    {categorized.length > 0 ? <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-6">{categorized.map((artifact: any) => <div key={artifact.id} className="flex items-center justify-between px-5 py-4 gap-4"><div className="flex items-center gap-3">{artifact.verified ? <CheckCircle className="w-4 h-4 text-brand-green-500" /> : artifact.daysLeft != null && artifact.daysLeft <= 0 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-slate-300" />}<div><div className="text-sm font-medium text-slate-900">{artifact.label}</div><div className="text-xs text-slate-400 mt-0.5">{ARTIFACT_TYPE_LABELS[artifact.artifact_type] ?? artifact.artifact_type}{artifact.issuer ? ` · ${artifact.issuer}` : ''}</div></div></div><div className="flex items-center gap-3">{artifact.daysLeft != null ? <span className={`text-xs font-medium ${artifact.daysLeft <= 0 ? 'text-red-600' : artifact.daysLeft <= 30 ? 'text-yellow-600' : 'text-slate-400'}`}>{artifact.daysLeft <= 0 ? 'Expired' : `Expires ${new Date(artifact.expires_at).toLocaleDateString()}`}</span> : null}{artifact.verified ? <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded-full font-medium">Verified</span> : null}{artifact.external_url ? <a href={artifact.external_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue-600 hover:underline">View</a> : null}</div></div>)}</div> : null}

    <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 mb-4"><Upload className="w-4 h-4 text-slate-500" /><h2 className="font-semibold text-slate-900 text-sm">Upload Document</h2></div><ComplianceUpload tenantId={tenantId} /></div>
  </div>;
}

function Alert({ tone, text }: { tone: 'red' | 'yellow'; text: string }) { const cls = tone === 'red' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'; return <div className={`${cls} border rounded-xl px-4 py-3 flex items-start gap-3 mb-4`}><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p className="text-sm font-semibold">{text}</p></div>; }
