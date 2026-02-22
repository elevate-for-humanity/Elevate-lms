import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Award,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Certifications | LMS',
  description: 'View and manage your certifications and credentials.',
};

export const dynamic = 'force-dynamic';

export default async function CertificationPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Certification" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view certifications</h2>
          <p className="text-gray-600 mb-6">Access your earned certificates and credentials.</p>
          <Link href="/login?redirect=/lms/certification" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Get user's certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id,
      title,
      description,
      issued_at,
      expires_at,
      certificate_url,
      credential_id,
      course:courses(id, title)
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  // Get certifications in progress
  const { data: inProgress } = await supabase
    .from('enrollments')
    .select(`
      id,
      progress,
      course:courses(id, title, certification_name)
    `)
    .eq('user_id', user.id)
    .lt('progress', 100)
    .not('course.certification_name', 'is', null);

  // Get available certifications
  const { data: availableCerts } = await supabase
    .from('training_courses')
    .select('id, title, certification_name, certification_body')
    .not('certification_name', 'is', null)
    .eq('is_active', true)
    .limit(6);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Certifications</h1>
          <p className="text-gray-600">Manage your credentials and certificates</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{certificates?.length || 0}</div>
          <div className="text-gray-600 text-sm">Earned</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <Clock className="w-8 h-8 text-brand-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{inProgress?.length || 0}</div>
          <div className="text-gray-600 text-sm">In Progress</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <FileText className="w-8 h-8 text-brand-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{availableCerts?.length || 0}</div>
          <div className="text-gray-600 text-sm">Available</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Earned Certificates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Earned Certificates</h2>
            {certificates && certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{cert.title}</h3>
                          {cert.course && (
                            <p className="text-sm text-gray-500">{cert.course.course_name}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Issued: {new Date(cert.issued_at).toLocaleDateString()}
                            </span>
                            {cert.expires_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Expires: {new Date(cert.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {cert.credential_id && (
                            <p className="text-xs text-gray-400 mt-1">
                              Credential ID: {cert.credential_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {cert.certificate_url && (
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-3">No certificates earned yet</p>
                <Link href="/lms/courses" className="text-indigo-600 font-medium hover:underline">
                  Browse courses to earn certificates
                </Link>
              </div>
            )}
          </div>

          {/* In Progress */}
          {inProgress && inProgress.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">In Progress</h2>
              <div className="space-y-3">
                {inProgress.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-brand-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-brand-blue-600" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.course?.certification_name}</h3>
                      <p className="text-sm text-gray-500">{item.course?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-blue-600 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{item.progress}%</span>
                    </div>
                    <Link href={`/lms/courses/${item.course?.id}`} className="text-brand-blue-600 text-sm font-medium">
                      Continue
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Available Certifications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Available Certifications</h2>
            {availableCerts && availableCerts.length > 0 ? (
              <div className="space-y-3">
                {availableCerts.map((cert: any) => (
                  <Link
                    key={cert.id}
                    href={`/lms/courses/${cert.id}`}
                    className="block p-3 border rounded-lg hover:border-indigo-300 transition"
                  >
                    <h3 className="font-medium text-sm">{cert.certification_name}</h3>
                    <p className="text-xs text-gray-500">{cert.certification_body}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No certifications available</p>
            )}
            <Link
              href="/programs"
              className="block text-center text-indigo-600 text-sm font-medium mt-4 hover:underline"
            >
              View All Programs
            </Link>
          </div>

          {/* Verification */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <h3 className="font-semibold mb-2">Verify a Certificate</h3>
            <p className="text-sm text-gray-600 mb-4">
              Employers can verify certificates using the credential ID.
            </p>
            <Link
              href="/verify"
              className="flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline"
            >
              Verification Portal <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
