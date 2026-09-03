'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type Certificate = {
  id: string;
  certificate_number: string | null;
  course_name: string | null;
  course_title: string | null;
  program_name: string | null;
  issued_at: string | null;
  expires_at: string | null;
  status: string | null;
  verification_url: string | null;
  metadata: Record<string, unknown> | null;
};

export default function MicroCredentialsBadges() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Sign in to view issued credentials.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('certificates')
        .select('id, certificate_number, course_name, course_title, program_name, issued_at, expires_at, status, verification_url, metadata')
        .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
        .order('issued_at', { ascending: false });

      if (error) {
        setMessage('Credential records are temporarily unavailable.');
      } else {
        setCertificates((data ?? []) as Certificate[]);
      }
      setLoading(false);
    };

    void load();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-3xl font-bold md:text-4xl">Digital Credentials</h1>
          <p className="mt-2 text-slate-200">Credentials issued from the canonical production certificate registry.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Card className="mb-8 p-6">
          <p className="text-sm font-semibold text-slate-600">Issued credentials</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{loading ? '—' : certificates.length}</p>
          <p className="mt-2 text-sm text-slate-500">Counts are derived from the signed-in learner’s live certificate records; no sample badge totals are displayed.</p>
        </Card>

        {message && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</p>}
        {loading && <p className="text-slate-600">Loading credentials…</p>}

        {!loading && !message && certificates.length === 0 && (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-950">No issued credentials yet</h2>
            <p className="mt-2 text-slate-600">Eligible credentials will appear here after the applicable completion and issuance workflow finishes.</p>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => {
            const title = certificate.course_name || certificate.course_title || certificate.program_name || 'Program Credential';
            const status = certificate.status || 'issued';
            const verificationUrl = certificate.verification_url || (certificate.certificate_number
              ? `https://${PLATFORM_DEFAULTS.canonicalDomain}/verify/${certificate.certificate_number}`
              : null);

            return (
              <Card key={certificate.id} className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Digital credential</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{status}</span>
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <div><dt className="font-semibold text-slate-600">Certificate number</dt><dd className="break-all text-slate-950">{certificate.certificate_number || 'Not recorded'}</dd></div>
                  <div><dt className="font-semibold text-slate-600">Issued</dt><dd className="text-slate-950">{certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : 'Not recorded'}</dd></div>
                  {certificate.expires_at && <div><dt className="font-semibold text-slate-600">Expires</dt><dd className="text-slate-950">{new Date(certificate.expires_at).toLocaleDateString()}</dd></div>}
                </dl>

                {verificationUrl && (
                  <a href={verificationUrl} className="mt-5 inline-block text-sm font-bold text-brand-blue-700 hover:underline">Verify credential</a>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-xl font-bold text-slate-950">Verification model</h2>
          <p className="mt-2 text-sm text-slate-600">Issued credentials are checked against the live certificate registry and SHA-256 issuance-integrity evidence. The platform does not represent these records as blockchain-anchored unless a separately evidenced chain anchor is implemented.</p>
        </Card>
      </div>
    </div>
  );
}
