import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const dynamic = 'force-dynamic';

export default async function PartnerUploadPage({ params }: { params: { token: string } }) {
  const supabase = await requireAdminClient();

  const { data: partner } = await supabase
    .from('partners')
    .select('id, name, contact_name, onboarding_step')
    .eq('onboarding_step', params.token)
    .maybeSingle();

  if (!partner) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#1E293B] py-4 px-6">
        <p className="text-white font-bold text-lg">{PLATFORM_DEFAULTS.orgName}</p>
        <p className="text-slate-500 text-sm">Partner Document Upload</p>
      </div>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Upload Your Documents</h1>
          <p className="text-slate-700 text-sm mb-6">
            {partner.contact_name ?? partner.name} — please upload the three required documents
            below to complete your onboarding with {PLATFORM_DEFAULTS.orgName}.
          </p>
          <PartnerUploadForm partnerId={partner.id} token={params.token} />
        </div>
        <p className="text-center text-xs text-slate-700 mt-6">
          Questions? Email{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="underline">
            elevate4humanityedu@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
