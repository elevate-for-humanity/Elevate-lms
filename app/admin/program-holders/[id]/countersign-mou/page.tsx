import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileSignature, CheckCircle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Countersign MOU | Admin | Elevate For Humanity',
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function CountersignMouPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error: pageError, success: pageSuccess } = await searchParams;

  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  // Fetch the program holder
  const { data: holder } = await db
    .from('program_holders')
    .select(
      'id, organization_name, contact_name, contact_email, mou_signed, mou_signed_at, mou_final_pdf_url, mou_status, status, user_id',
    )
    .eq('id', id)
    .maybeSingle();

  if (!holder) notFound();

  // Fetch MOU signature record scoped to this holder's user_id
  const { data: mouSig } = await db
    .from('mou_signatures')
    .select(
      'id, signer_name, signer_title, supervisor_name, supervisor_license, compensation_model, compensation_rate, mou_version, signed_at, ip_address',
    )
    .eq('user_id', holder.user_id)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Server action: mark MOU as countersigned
  async function countersignMou() {
    'use server';
    const db2 = await requireAdminClient();
    const { error } = await db2
      .from('program_holders')
      .update({
        mou_signed: true,
        mou_signed_at: new Date().toISOString(),
        mou_status: 'countersigned',
      })
      .eq('id', id);

    if (error) {
      redirect(
        `/admin/program-holders/${id}/countersign-mou?error=${encodeURIComponent('Failed to countersign MOU — check server logs')}`,
      );
    }
    redirect(
      `/admin/program-holders/${id}?success=${encodeURIComponent('MOU countersigned successfully')}`,
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Program Holders', href: '/admin/program-holders' },
            { label: holder.organization_name ?? 'Holder', href: `/admin/program-holders/${id}` },
            { label: 'Countersign MOU' },
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/program-holders/${id}`}
            className="text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Countersign MOU</h1>
            <p className="text-sm text-slate-500">{holder.organization_name}</p>
          </div>
        </div>

        {pageError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <strong>Error:</strong> {pageError}
          </div>
        )}
        {pageSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            {pageSuccess}
          </div>
        )}

        {/* MOU Status */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-slate-600" />
            MOU Status
          </h2>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Organization</dt>
              <dd className="font-medium text-slate-900">{holder.organization_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Contact</dt>
              <dd className="font-medium text-slate-900">{holder.contact_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">MOU Signed by Holder</dt>
              <dd className="flex items-center gap-1 font-medium">
                {holder.mou_signed ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">
                      Yes —{' '}
                      {holder.mou_signed_at
                        ? new Date(holder.mou_signed_at).toLocaleDateString()
                        : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Not yet signed</span>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">MOU Status</dt>
              <dd className="font-medium text-slate-900 capitalize">
                {holder.mou_status ?? 'pending'}
              </dd>
            </div>
            {holder.mou_final_pdf_url && (
              <div className="sm:col-span-2">
                <dt className="text-slate-500 mb-1">Signed PDF</dt>
                <dd>
                  <a
                    href={holder.mou_final_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-blue-600 hover:underline text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Signed MOU PDF
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Signature Details */}
        {mouSig && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Holder Signature Details</h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Signer Name</dt>
                <dd className="font-medium text-slate-900">{mouSig.signer_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Title</dt>
                <dd className="font-medium text-slate-900">{mouSig.signer_title ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Supervisor</dt>
                <dd className="font-medium text-slate-900">{mouSig.supervisor_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Supervisor License</dt>
                <dd className="font-medium text-slate-900">{mouSig.supervisor_license ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Compensation Model</dt>
                <dd className="font-medium text-slate-900">{mouSig.compensation_model ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Compensation Rate</dt>
                <dd className="font-medium text-slate-900">{mouSig.compensation_rate ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">MOU Version</dt>
                <dd className="font-medium text-slate-900">{mouSig.mou_version ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Signed At</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(mouSig.signed_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Countersign Action */}
        <div className="bg-white rounded-xl border-2 border-amber-300 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Admin Countersignature</h2>
          {holder.mou_status === 'countersigned' ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-4">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                MOU has already been countersigned by {PLATFORM_DEFAULTS.orgName}.
              </p>
            </div>
          ) : !holder.mou_signed ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              The program holder has not yet signed the MOU. Countersignature is only available
              after the holder signs.
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                By clicking below, you confirm that {PLATFORM_DEFAULTS.orgName} countersigns this MOU on
                behalf of the organization. This action is recorded and cannot be undone.
              </p>
              <form action={countersignMou}>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FileSignature className="w-4 h-4" />
                  Countersign MOU
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
