import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, CheckCircle2 } from 'lucide-react';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Shop Onboarding | Elevate LMS',
  robots: { index: false, follow: false },
};

async function loadContext() {
  try {
    return await requireCurrentHostShopPartner();
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'HOST_SHOP_UNAUTHENTICATED') {
      redirect('/host-shop/login?redirect=/host-shop/onboarding/profile');
    }
    if (code === 'HOST_SHOP_ADMIN_PARTNER_REQUIRED') {
      redirect('/host-shop/dashboard');
    }
    redirect('/unauthorized');
  }
}

function boolValue(value: FormDataEntryValue | null) {
  return String(value ?? '').toLowerCase() === 'yes';
}

async function saveHostShopProfile(formData: FormData) {
  'use server';

  const { db, partner } = await requireCurrentHostShopPartner();
  const supervisorName = String(formData.get('supervisorName') ?? '').trim();
  const supervisorLicense = String(formData.get('supervisorLicense') ?? '').trim();
  const yearsLicensedRaw = Number(formData.get('yearsLicensed') ?? 0);
  const compensationModel = String(formData.get('compensationModel') ?? '').trim();
  const workersCompStatus = String(formData.get('workersCompStatus') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const website = String(formData.get('website') ?? '').trim();

  if (
    !supervisorName ||
    !supervisorLicense ||
    !Number.isFinite(yearsLicensedRaw) ||
    yearsLicensedRaw < 0 ||
    !compensationModel ||
    !workersCompStatus
  ) {
    redirect('/host-shop/onboarding/profile?error=required');
  }

  const updatedAt = new Date().toISOString();
  const { error } = await db
    .from('partners')
    .update({
      supervisor_name: supervisorName,
      supervisor_license_number: supervisorLicense,
      supervisor_years_licensed: Math.floor(yearsLicensedRaw),
      compensation_model: compensationModel,
      workers_comp_status: workersCompStatus,
      has_general_liability: boolValue(formData.get('hasGeneralLiability')),
      can_supervise_and_verify: boolValue(formData.get('canSuperviseAndVerify')),
      phone: phone || partner.phone || null,
      contact_phone: phone || partner.contact_phone || partner.phone || null,
      website: website || partner.website || null,
      website_url: website || partner.website_url || null,
      onboarding_completed: true,
      onboarding_step: 'documents',
      updated_at: updatedAt,
    })
    .eq('id', partner.id);

  if (error) throw new Error(`HOST_SHOP_PROFILE_SAVE_FAILED:${error.message}`);
  redirect('/host-shop/onboarding/documents?profile=saved');
}

export default async function HostShopOnboardingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mou?: string }>;
}) {
  const { partner, isPlatformAdmin } = await loadContext();
  const params = await searchParams;

  return (
    <main className="bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <Building2 className="h-9 w-9 text-blue-700" />
          <h1 className="mt-4 text-3xl font-black">Host Shop onboarding profile</h1>
          <p className="mt-2 max-w-2xl text-slate-700">
            Confirm the licensed supervisor and employment/compliance model for {partner.dba || partner.name}.
          </p>
          {isPlatformAdmin ? (
            <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-950">
              Admin tenant view: changes apply to the selected Host Shop only.
            </p>
          ) : null}
        </div>

        {params.mou === 'signed' ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 p-4 font-bold text-green-950">
            <CheckCircle2 className="h-5 w-5" /> MOU signed successfully.
          </div>
        ) : null}
        {params.error === 'required' ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-950">
            Complete all required supervisor and employment fields.
          </div>
        ) : null}

        <form action={saveHostShopProfile} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="font-bold">
              Licensed supervisor name *
              <input name="supervisorName" required defaultValue={partner.supervisor_name || ''} className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="font-bold">
              Supervisor license number *
              <input name="supervisorLicense" required defaultValue={partner.supervisor_license_number || ''} className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="font-bold">
              Years licensed *
              <input name="yearsLicensed" type="number" min="0" required defaultValue={partner.supervisor_years_licensed ?? ''} className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="font-bold">
              Apprentice compensation model *
              <select name="compensationModel" required defaultValue={partner.compensation_model || ''} className="mt-2 w-full rounded-xl border border-slate-400 bg-white px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100">
                <option value="">Select</option>
                <option value="hourly">Hourly employee</option>
                <option value="hourly_plus_commission">Hourly + commission</option>
                <option value="other">Other approved employment model</option>
              </select>
            </label>
            <label className="font-bold">
              Workers&apos; compensation status *
              <select name="workersCompStatus" required defaultValue={partner.workers_comp_status || ''} className="mt-2 w-full rounded-xl border border-slate-400 bg-white px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100">
                <option value="">Select</option>
                <option value="covered">Covered</option>
                <option value="exempt">Valid exemption</option>
                <option value="none">No coverage / exemption</option>
              </select>
            </label>
            <label className="font-bold">
              Public business phone
              <input name="phone" type="tel" defaultValue={partner.phone || partner.contact_phone || ''} className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="font-bold sm:col-span-2">
              Website / booking URL
              <input name="website" type="url" defaultValue={partner.website_url || partner.website || ''} className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            <label className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 text-sm font-semibold leading-6">
              <input name="canSuperviseAndVerify" value="yes" type="checkbox" defaultChecked={partner.can_supervise_and_verify === true} className="mt-1 h-5 w-5" />
              The licensed supervisor can verify apprentice OJT hours and competencies.
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 text-sm font-semibold leading-6">
              <input name="hasGeneralLiability" value="yes" type="checkbox" defaultChecked={partner.has_general_liability === true} className="mt-1 h-5 w-5" />
              This worksite currently carries commercial/general liability insurance.
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" className="rounded-xl bg-blue-700 px-6 py-3 font-black text-white hover:bg-blue-800">
              Save and continue to documents
            </button>
            <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
              Return to dashboard
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
