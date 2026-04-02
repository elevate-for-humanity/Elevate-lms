import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CertificateDownload from '@/components/CertificateDownload';
import CertificateGenerator from '@/components/CertificateGenerator';
import { CertificateTemplate } from '@/components/lms/CertificateTemplate';
import { GenerateCertificateButton } from '@/components/lms/GenerateCertificateButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/certificates',
  },
  title: 'Certificates | Elevate For Humanity',
  description:
    'View and download your earned certificates.',
};

export default async function CertificatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch certificates (no FK to courses table, use stored course_title/program_name)
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  // Fetch transcripts (program completions)
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Certificates" }]} />
        </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
          <p className="text-black">
            View and download your earned certificates
          </p>
        </div>

        {certificates && certificates.length > 0 ? (
          <div className="space-y-8">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <CertificateTemplate
                  studentName={profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user.email || 'Student'}
                  courseName={cert.course_title || cert.program_name || cert.metadata?.course_name || 'Course'}
                  completionDate={cert.issued_at}
                  certificateId={cert.id}
                />
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                  <GenerateCertificateButton certificateId={cert.id} />
                  <CertificateDownload certificateId={cert.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg">
            <div className="w-24 h-24 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-brand-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h3 className="text-lg md:text-lg font-bold mb-2">
              No Certificates Yet
            </h3>
            <p className="text-black mb-6 max-w-md mx-auto">
              Complete a course to earn your first certificate. Certificates are
              automatically generated when you finish all course requirements.
            </p>
            <Link
              href="/lms/courses"
              className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              View My Courses
            </Link>
          </div>
        )}

        {/* Transcripts */}
        {transcripts && transcripts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Program Transcripts</h2>
            <div className="space-y-3">
              {transcripts.map((t: any) => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{t.program_name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Completed {new Date(t.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {t.courses_completed > 0 && ` · ${t.courses_completed} course${t.courses_completed !== 1 ? 's' : ''}`}
                      {t.total_hours && ` · ${t.total_hours} hours`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {t.pdf_url && (
                      <a
                        href={t.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                      >
                        Download Certificate
                      </a>
                    )}
                    {!t.pdf_url && t.certificate_id && (
                      <Link
                        href={`/certificates/${t.certificate_id}`}
                        className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition"
                      >
                        View Certificate
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Generator */}
        <div className="mt-8">
          <CertificateGenerator courseName="Course" studentName={user?.email || 'Student'} completionDate={new Date().toISOString()} />
        </div>
      </div>
    </div>
  );
}
