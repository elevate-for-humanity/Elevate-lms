import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CheckCircle, XCircle, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Verify Certificate',
  description: 'Verify the authenticity of an Elevate For Humanity certificate',
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: { certificateId: string };
}) {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Search in both certificate tables
  const { data: programCert } = await supabase
    .from('program_completion_certificates')
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        email
      ),
      programs:program_id (
        title,
        duration_hours
      )
    `,
    )
    .eq('certificate_number', params.certificateId)
    .single();

  const { data: moduleCert } = await supabase
    .from('module_certificates')
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        email
      )
    `,
    )
    .eq('certificate_number', params.certificateId)
    .single();

  const certificate = programCert || moduleCert;

  if (!certificate) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <section className="relative h-[38vh] min-h-[220px] max-h-[420px] w-full flex items-center justify-center text-white overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
          <Image
            src="/images/artlist/hero-training-3.webp"
            alt="[certificateId]"
            fill
            className="object-cover"
            quality={90}
            priority
            sizes="100vw" placeholder="empty"
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
              [certificateId]
            </h1>
            <p className="text-base md:text-lg md:text-xl mb-8 text-slate-100 drop-shadow-lg">
              Transform your career with funded training and industry certifications
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
              >
                Get Started Free
              </Link>
              <Link
                href="/programs"
                className="bg-white hover:bg-slate-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
              >
                View Programs
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-black mb-4">Certificate Not Found</h1>
          <p className="text-lg text-black mb-8">
            Certificate number{' '}
            <span className="font-mono font-semibold">{params.certificateId}</span> will not be
            found in our repository.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <p className="text-sm text-black">
              <strong>Please verify:</strong>
            </p>
            <ul className="text-sm text-black mt-2 space-y-1 text-left">
              <li>• Certificate number is entered correctly</li>
              <li>• Certificate has been issued (may take 24-48 hours)</li>
              <li>• Certificate has not been revoked</li>
            </ul>
          </div>
          <Link
            href="/certificates/verify"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
          >
            Start Another Certificate
          </Link>

          {/* Storytelling Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-2xl md:text-3xl md:text-2xl md:text-3xl font-bold mb-6 text-black">
                      Your Journey Starts Here
                    </h2>
                    <p className="text-lg text-black mb-6 leading-relaxed">
                      Every great career begins with a single step. Whether you're looking to change
                      careers, upgrade your skills, or enter the workforce for the first time, we're
                      here to help you succeed. Our programs are government-funded for eligible participants, and
                      designed to get you hired fast.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <svg
                          className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-black">
                          Funded training for eligible participants — no tuition required
                        </span>
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-black">
                          Industry-recognized certifications that employers value
                        </span>
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-black">
                          Job placement assistance and career support
                        </span>
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-black">Flexible scheduling for working adults</span>
                      </li>
                    </ul>
                  </div>
                  <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/images/artlist/hero-training-3.webp"
                      alt="Students learning"
                      fill
                      className="object-cover"
                      quality={90}
                      sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16    text-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl md:text-2xl md:text-3xl font-bold mb-6">
                  Ready to Transform Your Career?
                </h2>
                <p className="text-base md:text-lg mb-8 text-blue-100">
                  Advance your career through our workforce training programs
                  programs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contact"
                    className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-slate-50 text-lg shadow-2xl transition-all"
                  >
                    Apply Now - It's Free
                  </Link>
                  <Link
                    href="/programs"
                    className="bg-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                  >
                    Browse All Programs
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const isValid = certificate.status !== 'revoked';
  const studentName = certificate.profiles?.full_name || 'Student Name';
  const programTitle = programCert?.programs?.title || certificate.certificate_name;
  const completionDate = new Date(
    certificate.completion_date || certificate.issued_date,
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const totalHours = programCert?.programs?.duration_hours || certificate.total_hours || 0;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Verification Status */}
        <div
          className={`rounded-2xl shadow-xl p-8 mb-8 ${
            isValid ? 'bg-brand-green-50 border-2 border-brand-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}
        >
          <div className="flex items-center gap-4 mb-4">
            {isValid ? (
              <CheckCircle className="w-12 h-12 text-brand-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-brand-orange-600" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-black">
                {isValid ? 'Certificate Verified ✓' : 'Certificate Invalid'}
              </h1>
              <p className="text-black">
                {isValid
                  ? 'This certificate is authentic and stored in our official repository'
                  : 'This certificate has been revoked or is no longer valid'}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">Certificate Details</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-black uppercase tracking-wide">
                Certificate Number
              </label>
              <p className="text-lg font-mono font-bold text-black mt-1">
                {certificate.certificate_number}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-black uppercase tracking-wide">
                Issue Date
              </label>
              <p className="text-lg font-semibold text-black mt-1">{completionDate}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-black uppercase tracking-wide">
                Recipient
              </label>
              <p className="text-lg font-semibold text-black mt-1">{studentName}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-black uppercase tracking-wide">
                Program
              </label>
              <p className="text-lg font-semibold text-black mt-1">{programTitle}</p>
            </div>

            {totalHours > 0 && (
              <div>
                <label className="text-sm font-semibold text-black uppercase tracking-wide">
                  Training Hours
                </label>
                <p className="text-lg font-semibold text-black mt-1">{totalHours} hours</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-black uppercase tracking-wide">
                Issued By
              </label>
              <p className="text-lg font-semibold text-black mt-1">Elevate For Humanity</p>
            </div>
          </div>

          {/* Repository Information */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-bold text-black mb-4">Repository Information</h3>
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-sm text-black mb-2">
                <strong>Official Record:</strong> This certificate is permanently stored in the
                Elevate For Humanity certificate repository.
              </p>
              <p className="text-sm text-black mb-2">
                <strong>Verification Method:</strong> Each certificate contains a unique number and
                QR code linked to this verification page.
              </p>
              <p className="text-sm text-black">
                <strong>Authenticity:</strong> Only certificates issued by Elevate For Humanity and
                stored in our repository are considered valid.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isValid && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-black mb-6">Actions</h2>
            <div className="flex flex-wrap gap-4">
              {certificate.certificate_url && (
                <a
                  href={certificate.certificate_url}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
                >
                  <Download className="w-5 h-5" />
                  Download Certificate
                </a>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Verification link copied to clipboard!');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700"
              >
                <Share2 className="w-5 h-5" />
                Share Verification Link
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-black">
            Questions about this certificate? Contact us at{' '}
            <a
              href="mailto:Elevate4humanityedu@gmail.com"
              className="text-brand-blue-600 hover:underline"
            >
              Elevate4humanityedu@gmail.com
            </a>{' '}
            or call{' '}
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-brand-blue-600 hover:underline">
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
