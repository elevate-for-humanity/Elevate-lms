import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  FileText,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance | Program Holder Portal',
  description: 'Monitor your compliance status',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/compliance',
  },
};

export default async function CompliancePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Compliance" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') redirect('/');

  // Get program holder record
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!programHolder) {
    redirect('/program-holder/apply');
  }

  // Calculate compliance score based on various factors
  const { data: documents } = await supabase
    .from('program_holder_documents')
    .select('*')
    .eq('user_id', user.id);

  const { data: reports } = await supabase
    .from('apprentice_weekly_reports')
    .select('*')
    .eq('program_holder_id', programHolder.id);

  const { data: students } = await supabase
    .from('program_holder_students')
    .select('*')
    .eq('program_holder_id', programHolder.id);

  // Calculate compliance factors
  const requiredDocs = ['license', 'insurance', 'background_check'];
  const approvedDocs =
    documents?.filter(
      (d) => d.status === 'approved' && requiredDocs.includes(d.document_type)
    ) || [];
  const documentScore = (approvedDocs.length / requiredDocs.length) * 100;

  const recentReports =
    reports?.filter((r) => {
      const reportDate = new Date(r.week_ending);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return reportDate >= thirtyDaysAgo;
    }) || [];
  const reportingScore =
    students && students.length > 0
      ? Math.min((recentReports.length / 4) * 100, 100)
      : 100;

  const activeStudents = students?.filter((s) => s.status === 'active') || [];
  const studentScore = activeStudents.length > 0 ? 100 : 80;

  const overallScore = Math.round(
    (documentScore + reportingScore + studentScore) / 3
  );
  const complianceStatus = overallScore >= 70 ? 'compliant' : 'non_compliant';

  // Identify issues
  const issues = [];
  if (documentScore < 100) {
    issues.push({
      severity: 'high',
      title: 'Missing Required Documents',
      description: `${requiredDocs.length - approvedDocs.length} required document(s) not approved`,
      action: 'Upload missing documents',
      href: '/program-holder/documents',
    });
  }
  if (reportingScore < 70) {
    issues.push({
      severity: 'medium',
      title: 'Insufficient Reporting',
      description: 'Submit weekly reports regularly',
      action: 'Submit reports',
      href: '/program-holder/reports',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Compliance" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/certifications/osha.jpg"
          alt="Compliance"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Compliance Dashboard
          </h1>
          <p className="text-lg text-gray-100">
            Monitor your compliance status and resolve issues
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Compliance Score */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-black mb-2">
                    Overall Compliance Score
                  </h2>
                  <p className="text-black">
                    {complianceStatus === 'compliant'
                      ? 'Your program is in good standing'
                      : 'Action required to maintain compliance'}
                  </p>
                </div>
                <div className="text-center">
                  <div
                    className={`text-6xl font-bold ${
                      overallScore >= 90
                        ? 'text-brand-green-600'
                        : overallScore >= 70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {overallScore}%
                  </div>
                  <div
                    className={`text-sm font-medium mt-2 ${
                      complianceStatus === 'compliant'
                        ? 'text-brand-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {complianceStatus === 'compliant'
                      ? 'COMPLIANT'
                      : 'NON-COMPLIANT'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    overallScore >= 90
                      ? 'bg-brand-green-600'
                      : overallScore >= 70
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>

            {/* Compliance Factors */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="font-semibold text-black">
                    Documentation
                  </h3>
                </div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">
                  {Math.round(documentScore)}%
                </div>
                <p className="text-sm text-black">
                  {approvedDocs.length} of {requiredDocs.length} required
                  documents approved
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-11 w-11 text-brand-green-600" />
                  <h3 className="font-semibold text-black">Reporting</h3>
                </div>
                <div className="text-3xl font-bold text-brand-green-600 mb-2">
                  {Math.round(reportingScore)}%
                </div>
                <p className="text-sm text-black">
                  {recentReports.length} reports submitted in last 30 days
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="font-semibold text-black">
                    Student Management
                  </h3>
                </div>
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">
                  {Math.round(studentScore)}%
                </div>
                <p className="text-sm text-black">
                  {activeStudents.length} active student(s)
                </p>
              </div>
            </div>

            {/* Issues */}
            {issues.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <h2 className="text-2xl font-bold text-black mb-6">
                  Action Items
                </h2>
                <div className="space-y-4">
                  {issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`flex items-start p-4 rounded-lg border-2 ${
                        issue.severity === 'high'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <AlertTriangle
                        className={`h-10 w-10 mr-3 flex-shrink-0 mt-0.5 ${
                          issue.severity === 'high'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-1">
                          {issue.title}
                        </h3>
                        <p className="text-sm text-black mb-3">
                          {issue.description}
                        </p>
                        <Link
                          href={issue.href}
                          className="inline-flex items-center text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700"
                        >
                          {issue.action} →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Issues */}
            {issues.length === 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 mb-8 text-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  All Clear!
                </h3>
                <p className="text-green-800">
                  Your program is fully compliant. Keep up the great work!
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/program-holder/documents"
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Manage Documents
              </Link>
              <Link
                href="/program-holder/reports"
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-semibold rounded-lg transition-colors"
              >
                Submit Reports
              </Link>
              <Link
                href="/program-holder/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-black font-semibold rounded-lg border-2 border-slate-300 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
