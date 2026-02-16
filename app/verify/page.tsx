import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { XCircle, Search, Award, Calendar, User, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Certificate | Elevate for Humanity',
  description: 'Verify the authenticity of certificates issued by Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/verify',
  },
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  id?: string;
  code?: string;
}

async function verifyCertificate(certificateId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      id,
      certificate_number,
      issued_at,
      expires_at,
      status,
      credential_name,
      profiles (
        full_name
      ),
      programs (
        name
      )
    `)
    .or(`id.eq.${certificateId},certificate_number.eq.${certificateId}`)
    .single();

  if (error || !certificate) {
    return null;
  }

  return certificate;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const certificateId = params.id || params.code;
  
  let certificate = null;
  let searched = false;

  if (certificateId) {
    searched = true;
    certificate = await verifyCertificate(certificateId);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Elevate for Humanity
            </Link>
            <Link href="/certificates" className="text-sm text-orange-600 hover:text-orange-700">
              View All Certificates
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
          <p className="text-gray-600">
            Enter a certificate ID or verification code to verify its authenticity.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form method="GET" className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="id" className="sr-only">Certificate ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="id"
                  name="id"
                  defaultValue={certificateId || ''}
                  placeholder="Enter certificate ID or verification code"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
            >
              Verify
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {certificate ? (
              <>
                {/* Valid Certificate */}
                <div className="bg-green-50 border-b border-green-200 p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <h2 className="text-xl font-bold text-green-800">Certificate Verified</h2>
                      <p className="text-green-700">This certificate is authentic and valid.</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <User className="w-4 h-4" />
                        <span>Recipient</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {(certificate.profiles as any)?.full_name || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Award className="w-4 h-4" />
                        <span>Credential</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {certificate.credential_name || (certificate.programs as any)?.name || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>Issue Date</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {certificate.issued_at 
                          ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Building2 className="w-4 h-4" />
                        <span>Certificate Number</span>
                      </div>
                      <p className="font-semibold text-gray-900 font-mono">
                        {certificate.certificate_number || certificate.id}
                      </p>
                    </div>
                  </div>

                  {certificate.expires_at && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Expires:</span>{' '}
                        {new Date(certificate.expires_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Invalid Certificate */}
                <div className="bg-red-50 border-b border-red-200 p-6">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <h2 className="text-xl font-bold text-red-800">Certificate Not Found</h2>
                      <p className="text-red-700">
                        We could not find a certificate with the provided ID or code.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    Please check the certificate ID and try again. If you believe this is an error,
                    please contact our support team.
                  </p>
                  <Link
                    href="/contact"
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Contact Support →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info Section */}
        {!searched && (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-brand-blue-900 mb-2">How to Verify</h3>
            <ul className="text-brand-blue-800 space-y-2 text-sm">
              <li>• Enter the certificate ID found on the bottom of the certificate</li>
              <li>• Or scan the QR code on the certificate to auto-fill the verification code</li>
              <li>• Click "Verify" to check the certificate's authenticity</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
