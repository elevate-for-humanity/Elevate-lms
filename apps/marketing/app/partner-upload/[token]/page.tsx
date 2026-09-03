import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { requireAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import PartnerUploadForm from './PartnerUploadForm';

export const dynamic = 'force-dynamic';

export default async function PartnerUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await requireAdminClient();

  const { data: partner } = await supabase
    .from('partners')
    .select('id, name, contact_name, onboarding_step')
    .eq('onboarding_step', token)
    .maybeSingle();

  if (!partner) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-800 px-6 py-4">
        <p className="text-white font-bold text-lg">{PLATFORM_DEFAULTS.orgName}</p>
        <p className="text-slate-300 text-sm">Partner Document Upload</p>
      </div>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Upload Your Documents</h1>
          <p className="text-slate-700 text-sm mb-6">
            {partner.contact_name ?? partner.name} — upload the required compliance documents to complete onboarding with {PLATFORM_DEFAULTS.orgName}.
          </p>
          <PartnerUploadForm partnerId={partner.id} token={token} />
        </div>
      </div>
    </div>
  );
}
