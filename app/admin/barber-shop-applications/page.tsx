import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Building2, CheckCircle, Clock, XCircle,
  Phone, Mail, MapPin, User, ShieldCheck, AlertTriangle,
  FileText, PenLine, Hash,
} from 'lucide-react';
import ApproveButton from './ApproveButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partner Barbershop Applications | Admin | Elevate for Humanity',
};

type Application = {
  id: string;
  created_at: string;
  shop_legal_name: string;
  shop_dba_name: string | null;
  owner_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  shop_city: string;
  shop_state: string;
  shop_zip: string;
  shop_physical_address: string | null;
  indiana_shop_license_number: string;
  supervisor_name: string;
  supervisor_license_number: string;
  compensation_model: string;
  workers_comp_status: string;
  has_general_liability: boolean;
  apprentices_on_payroll: boolean;
  can_supervise_and_verify: boolean;
  mou_acknowledged: boolean;
  mou_signed_at: string | null;
  mou_signer_name: string | null;
  consent_acknowledged: boolean;
  consent_signed_at: string | null;
  consent_signer_name: string | null;
  employer_acceptance_acknowledged: boolean;
  employer_acceptance_signed_at: string | null;
  employer_acceptance_signer_name: string | null;
  ein: string | null;
  ein_document_path: string | null;
  ein_qa_notes: string | null;
  number_of_employees: number | null;
  notes: string | null;
  status: string | null;
};

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      );
    case 'denied':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" /> Denied
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
}

function ComplianceFlag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${ok ? 'text-green-700' : 'text-red-600 font-semibold'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default async function BarberShopApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');



  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/');

  const { data: applications, error } = await supabase
    .from('barbershop_partner_applications')
    .select(`
      id, created_at, shop_legal_name, shop_dba_name,
      owner_name, contact_name, contact_email, contact_phone,
      shop_city, shop_state, shop_zip, shop_physical_address,
      indiana_shop_license_number,
      supervisor_name, supervisor_license_number,
      compensation_model, workers_comp_status,
      has_general_liability, apprentices_on_payroll,
      can_supervise_and_verify,
      mou_acknowledged, mou_signed_at, mou_signer_name,
      consent_acknowledged, consent_signed_at, consent_signer_name,
      employer_acceptance_acknowledged, employer_acceptance_signed_at, employer_acceptance_signer_name,
      ein, ein_document_path, ein_qa_notes,
      number_of_employees, notes, status
    `)
    .order('created_at', { ascending: false });

  const rows = (applications ?? []) as Application[];

  const pending = rows.filter(r => !r.status || r.status === 'pending');
  const approved = rows.filter(r => r.status === 'approved');
  const denied = rows.filter(r => r.status === 'denied');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Barber Shop Applications' }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-brand-blue-600" />
              Partner Barbershop Applications
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Shops applying to host DOL-registered barber apprentices
            </p>
          </div>
          <Link
            href="/apply/student?program=barber-apprenticeship&type=partner_shop"
            className="text-sm text-brand-blue-600 hover:underline"
            target="_blank"
          >
            View application form →
          </Link>
        </div>

        {/* Summary counts */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending', count: pending.length, color: 'amber' },
            { label: 'Approved', count: approved.length, color: 'green' },
            { label: 'Denied', count: denied.length, color: 'red' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className={`text-3xl font-bold text-${color}-600`}>{count}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            Error loading applications. Please refresh the page.
          </div>
        )}

        {rows.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            No applications yet.
          </div>
        )}

        {/* Application cards */}
        <div className="space-y-4">
          {rows.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {app.shop_legal_name}
                    {app.shop_dba_name && (
                      <span className="text-gray-400 font-normal text-sm ml-2">dba {app.shop_dba_name}</span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Submitted {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}ID: <span className="font-mono text-xs">{app.id.slice(0, 8)}</span>
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                {/* Contact */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
                  <p className="flex items-center gap-1.5 text-gray-700">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {app.contact_name} (Owner: {app.owner_name})
                  </p>
                  <p className="flex items-center gap-1.5 text-gray-700">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`mailto:${app.contact_email}`} className="text-brand-blue-600 hover:underline">
                      {app.contact_email}
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5 text-gray-700">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`tel:${app.contact_phone}`} className="hover:underline">{app.contact_phone}</a>
                  </p>
                </div>

                {/* Location & License */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location & License</p>
                  <p className="flex items-center gap-1.5 text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {app.shop_city}, {app.shop_state} {app.shop_zip}
                  </p>
                  {app.shop_physical_address && (
                    <p className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <MapPin className="w-3 h-3 text-gray-300" />
                      Physical: {app.shop_physical_address}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-gray-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    IN Shop License: <span className="font-mono ml-1">{app.indiana_shop_license_number}</span>
                  </p>
                  <p className="text-gray-700">
                    Supervisor: {app.supervisor_name} — <span className="font-mono text-xs">{app.supervisor_license_number}</span>
                  </p>
                </div>

                {/* Employment & EIN */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Employment & EIN</p>
                  <p className="text-gray-700">Compensation: {app.compensation_model || '—'}</p>
                  <p className="text-gray-700">Employees: {app.number_of_employees ?? '—'}</p>
                  <p className="text-gray-700">Workers Comp: {app.workers_comp_status}</p>
                  <p className="flex items-center gap-1.5 text-gray-700">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    EIN: {app.ein ? <span className="font-mono">{app.ein}</span> : <span className="text-gray-400">Not provided</span>}
                    {app.ein_document_path && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                        <FileText className="w-3 h-3" /> Doc uploaded
                      </span>
                    )}
                  </p>
                  {app.ein_qa_notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                      EIN note: {app.ein_qa_notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Compliance flags */}
              <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                <ComplianceFlag ok={app.apprentices_on_payroll} label="On payroll" />
                <ComplianceFlag ok={app.has_general_liability} label="General liability" />
                <ComplianceFlag ok={app.workers_comp_status === 'verified'} label="Workers comp" />
                <ComplianceFlag ok={app.can_supervise_and_verify} label="Can supervise" />
                <ComplianceFlag ok={!!app.employer_acceptance_acknowledged} label="Employer acceptance" />
                <ComplianceFlag ok={app.mou_acknowledged} label="MOU acknowledged" />
                <ComplianceFlag ok={app.consent_acknowledged} label="Consent" />
              </div>

              {/* Signature timestamps */}
              {(app.mou_signed_at || app.consent_signed_at || app.employer_acceptance_signed_at) && (
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  {app.employer_acceptance_signed_at && (
                    <span className="flex items-center gap-1">
                      <PenLine className="w-3 h-3" />
                      Employer acceptance: {app.employer_acceptance_signer_name || app.contact_name} at {new Date(app.employer_acceptance_signed_at).toLocaleString()}
                    </span>
                  )}
                  {app.mou_signed_at && (
                    <span className="flex items-center gap-1">
                      <PenLine className="w-3 h-3" />
                      MOU: {app.mou_signer_name || app.contact_name} at {new Date(app.mou_signed_at).toLocaleString()}
                    </span>
                  )}
                  {app.consent_signed_at && (
                    <span className="flex items-center gap-1">
                      <PenLine className="w-3 h-3" />
                      Consent: {app.consent_signer_name || app.contact_name} at {new Date(app.consent_signed_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {app.notes && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-3">
                  <span className="font-medium">Notes:</span> {app.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <ApproveButton applicationId={app.id} status={app.status} />
                <a
                  href={`mailto:${app.contact_email}?subject=Your Barbershop Partner Application — Elevate for Humanity`}
                  className="text-sm px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                >
                  Email Applicant
                </a>
                <a
                  href={`tel:${app.contact_phone}`}
                  className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                >
                  Call
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
