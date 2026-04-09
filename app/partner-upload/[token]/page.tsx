import { getAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PartnerUploadForm from './PartnerUploadForm'

export default async function PartnerUploadPage({ params }: { params: { token: string } }) {
  const supabase = await getAdminClient()

  const { data: partner } = await supabase
    .from('partners')
    .select('id, name, contact_name, onboarding_step')
    .eq('onboarding_step', params.token)
    .single()

  if (!partner) notFound()

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#1E293B] py-4 px-6">
        <p className="text-white font-bold text-lg">Elevate for Humanity</p>
        <p className="text-slate-500 text-sm">Partner Document Upload</p>
      </div>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Upload Your Documents</h1>
          <p className="text-gray-500 text-sm mb-6">
            {partner.contact_name ?? partner.name} — please upload the three required documents below to complete your onboarding with Elevate for Humanity.
          </p>
          <PartnerUploadForm partnerId={partner.id} token={params.token} />
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Email <a href="mailto:elevate4humanityedu@gmail.com" className="underline">elevate4humanityedu@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
