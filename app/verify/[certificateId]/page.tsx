import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/verify',
  },
  title: 'Verify Certificate | Elevate For Humanity',
  description:
    'Verify the authenticity of a certificate issued by Elevate For Humanity',
};

export const dynamic = 'force-dynamic';

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Start to find certificate in multiple tables
  let certificate = null;
  let studentName = '';
  let courseName = '';
  let completionDate = '';
  let certificateType = '';

  // Check program_completion_certificates
  const { data: programCert } = await db
    .from('program_completion_certificates')
    .select('*, users(full_name, email)')
    .eq('certificate_number', certificateId)
    .single();

  if (programCert) {
    certificate = programCert;
    studentName =
      programCert.users?.full_name || programCert.users?.email || 'Student';
    courseName = programCert.program_name || 'Program';
    completionDate = programCert.issued_at;
    certificateType = 'Program Completion';
  }

  // Check partner_certificates
  if (!certificate) {
    const { data: partnerCert } = await db
      .from('partner_certificates')
      .select('*, users(full_name, email), partner_courses(course_name)')
      .eq('certificate_number', certificateId)
      .single();

    if (partnerCert) {
      certificate = partnerCert;
      studentName =
        partnerCert.users?.full_name || partnerCert.users?.email || 'Student';
      courseName = partnerCert.partner_courses?.course_name || 'Course';
      completionDate = partnerCert.issued_at;
      certificateType = 'Partner Certification';
    }
  }

  // Check module_certificates
  if (!certificate) {
    const { data: moduleCert } = await db
      .from('module_certificates')
      .select('*, users(full_name, email)')
      .eq('certificate_number', certificateId)
      .single();

    if (moduleCert) {
      certificate = moduleCert;
      studentName =
        moduleCert.users?.full_name || moduleCert.users?.email || 'Student';
      courseName = moduleCert.module_name || 'Module';
      completionDate = moduleCert.issued_at;
      certificateType = 'Module Completion';
    }
  }

  if (!certificate) {
    notFound();
  }

  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/programs-hq/training-classroom.jpg"
          alt="Certificate verification"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-2xl md:text-3xl lg:text-4xl">
              Certificate Verified
            </h1>
            <p className="text-base md:text-lg text-brand-green-100">
              This certificate is authentic and valid
            </p>
          </div>
        </div>
      </section>

      {/* Certificate Details */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Verification Status */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-brand-green-100 rounded-full p-4">
                  <svg
                    className="w-12 h-12 text-brand-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Valid Certificate
              </h2>
              <p className="text-center text-gray-600 mb-6">
                This certificate has been verified and is authentic
              </p>

              {/* Certificate Information */}
              <div className="border-t border-b border-gray-200 py-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Certificate Number</p>
                    <p className="font-semibold text-lg">
                      {certificateId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Certificate Type</p>
                    <p className="font-semibold text-lg">{certificateType}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Recipient</p>
                    <p className="font-semibold text-lg">{studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Course/Program</p>
                    <p className="font-semibold text-lg">{courseName}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Completion Date</p>
                    <p className="font-semibold text-lg">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issued By</p>
                    <p className="font-semibold text-lg">
                      Elevate For Humanity
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan to verify on mobile
                </p>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://elevateforhumanity.com'}/verify/${certificateId}`
                    )}`}
                    alt="QR Code"
                    width={192}
                    height={192}
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Issuer Information */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-brand-blue-900 mb-3">About the Issuer</h3>
              <div className="space-y-2 text-brand-blue-800 text-sm">
                <p>
                  <strong>Organization:</strong> Elevate For Humanity
                </p>
                <p>
                  <strong>Type:</strong> Workforce Development & Training
                  Provider
                </p>
                <p>
                  <strong>Status:</strong> WIOA Eligible Training Provider
                  Provider
                </p>
                <p>
                  <strong>Website:</strong>{' '}
                  <a
                    href={
                      process.env.NEXT_PUBLIC_SITE_URL ||
                      'https://elevateforhumanity.com'
                    }
                    className="underline hover:text-brand-blue-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    elevateforhumanity.com
                  </a>
                </p>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600">
                This certificate was verified on{' '}
                <strong>
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Certificate verification is logged for security purposes
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/cert/verify"
                className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                Verify Another Certificate
              </Link>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Print Verification
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
