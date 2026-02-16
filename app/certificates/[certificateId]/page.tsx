import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Download,
  Share2,
  Calendar,
  User,
  BookOpen,
  ExternalLink,
CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certificateId } = await params;
  const supabase = await createClient();
  
  if (!supabase) return { title: 'Certificate | Elevate for Humanity' };
  
  const { data: certificate } = await supabase
    .from('certificates')
    .select('title')
    .eq('id', certificateId)
    .single();

  return {
    title: certificate ? `${certificate.title} | Certificate` : 'Certificate | Elevate for Humanity',
    description: 'View and verify this certificate of completion.',
  };
}

export default async function CertificateViewPage({ params }: Props) {
  const { certificateId } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
        </div>
      </div>
    );
  }

  // Fetch certificate with user and course info
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles (first_name, last_name),
      courses (title)
    `)
    .eq('id', certificateId)
    .single();

  if (error || !certificate) {
    notFound();
  }

  const recipient = certificate.profiles as { first_name: string; last_name: string } | null;
  const course = certificate.courses as { title: string } | null;
  const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : certificate.recipient_name || 'Student';

  return (
    <div className="min-h-screen bg-brand-blue-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Certificates", href: "/certificates" }, { label: "[Certificateid]" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        {/* Verification Badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="font-semibold">Verified Certificate</span>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="bg-white rounded-3xl shadow-xl border-4 border-brand-blue-100 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-700 text-white p-8 text-center">
            <Award className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h1 className="text-3xl font-bold mb-2">Certificate of Completion</h1>
            <p className="text-brand-blue-200">Elevate for Humanity</p>
          </div>

          {/* Body */}
          <div className="p-12 text-center">
            <p className="text-slate-600 text-lg mb-4">This is to certify that</p>
            
            <h2 className="text-4xl font-bold text-slate-900 mb-4 font-serif">
              {recipientName}
            </h2>
            
            <p className="text-slate-600 text-lg mb-4">has successfully completed</p>
            
            <h3 className="text-2xl font-bold text-brand-blue-900 mb-8">
              {certificate.title || course?.title || 'Course'}
            </h3>

            {/* Details */}
            <div className="flex items-center justify-center gap-8 text-slate-600 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>
                  Issued: {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {certificate.credential_id && (
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>ID: {certificate.credential_id}</span>
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="border-t border-slate-200 pt-8 mt-8">
              <div className="inline-block">
                <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                <p className="text-slate-600">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <p>Certificate ID: {certificate.id.slice(0, 8).toUpperCase()}</p>
                <p>Verify at: elevateforhumanity.org/verify/{certificate.id}</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
              About This Certificate
            </h3>
            <p className="text-slate-600 text-sm">
              This certificate verifies that the recipient has successfully completed all requirements
              for the course or program listed above. The certificate is issued by Elevate for Humanity
              and can be verified using the certificate ID.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              Verification
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              This certificate has been verified as authentic. Employers and institutions can verify
              this certificate at any time.
            </p>
            <Link
              href={`/verify/${certificateId}`}
              className="text-brand-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              Verify this certificate
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
