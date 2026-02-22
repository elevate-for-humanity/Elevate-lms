import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  AlertTriangle,
  FileText,
  Users,
  GraduationCap,
  TrendingUp,
  Download,
  ExternalLink,
  Shield,
  BookOpen,
  Award,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Accreditation Readiness | Admin',
  description: 'Monitor accreditation compliance and readiness status',
};

export default async function AccreditationPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/accreditation');
  }

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  // Get compliance metrics
  const { data: programs } = await db
    .from('programs')
    .select('*')
    .eq('status', 'active');

  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('*, program:programs(name)')
    .gte(
      'created_at',
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    );

  const { data: completions } = await db
    .from('program_enrollments')
    .select('*')
    .eq('status', 'completed')
    .gte(
      'completed_at',
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    );

  const { data: placements } = await db
    .from('job_placements')
    .select('*')
    .gte(
      'placement_date',
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    );

  const completionRate = enrollments?.length
    ? Math.round(((completions?.length || 0) / enrollments.length) * 100)
    : 0;

  const placementRate = completions?.length
    ? Math.round(((placements?.length || 0) / completions.length) * 100)
    : 0;

  const complianceItems = [
    {
      category: 'Documentation',
      items: [
        { name: 'Mission Statement', status: 'complete', link: '/about' },
        { name: 'Program Descriptions', status: 'complete', link: '/programs' },
        { name: 'Course Syllabi', status: 'complete', link: '/syllabi' },
        {
          name: 'Student Handbook',
          status: 'complete',
          link: '/student-handbook',
        },
        { name: 'Learning Outcomes', status: 'complete', link: '/syllabi' },
        { name: 'Assessment Methods', status: 'complete', link: '/syllabi' },
      ],
    },
    {
      category: 'Systems',
      items: [
        {
          name: 'Student Information System',
          status: 'complete',
          link: '/admin/students',
        },
        {
          name: 'Learning Management System',
          status: 'complete',
          link: '/lms',
        },
        {
          name: 'Financial Aid Management',
          status: 'complete',
          link: '/admin/financial-aid',
        },
        {
          name: 'Attendance Tracking',
          status: 'complete',
          link: '/admin/attendance',
        },
        {
          name: 'Outcome Tracking',
          status: 'complete',
          link: '/admin/outcomes',
        },
        {
          name: 'ECR Integration',
          status: 'warning',
          link: '/admin/integrations',
        },
        {
          name: 'Hour Tracking Dashboard',
          status: 'warning',
          link: '/admin/hours',
        },
      ],
    },
    {
      category: 'Compliance',
      items: [
        { name: 'FERPA Compliance', status: 'complete', link: '/ferpa' },
        { name: 'Title IX Compliance', status: 'complete', link: '/title-ix' },
        { name: 'ADA Compliance', status: 'complete', link: '/accessibility' },
        {
          name: 'State Authorization',
          status: 'complete',
          link: '/admin/licensing',
        },
        { name: 'WIOA Approval', status: 'complete', link: '/admin/wioa' },
        {
          name: 'Safety Procedures',
          status: 'complete',
          link: '/student-handbook',
        },
      ],
    },
    {
      category: 'Student Experience',
      items: [
        { name: 'Application Process', status: 'complete', link: '/apply' },
        {
          name: 'Enrollment Agreements',
          status: 'complete',
          link: '/admin/enrollments',
        },
        {
          name: 'Orientation Program',
          status: 'complete',
          link: '/orientation',
        },
        { name: 'Academic Advising', status: 'complete', link: '/advising' },
        {
          name: 'Career Services',
          status: 'complete',
          link: '/career-services',
        },
        {
          name: 'Welcome Packet',
          status: 'warning',
          link: '/admin/welcome-packets',
        },
        {
          name: 'Milady SSO Access',
          status: 'warning',
          link: '/admin/integrations',
        },
      ],
    },
  ];

  const totalItems = complianceItems.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );
  const completeItems = complianceItems.reduce(
    (sum, cat) =>
      sum + cat.items.filter((item: any) => item.status === 'complete').length,
    0
  );
  const warningItems = complianceItems.reduce(
    (sum, cat) =>
      sum + cat.items.filter((item: any) => item.status === 'warning').length,
    0
  );

  const readinessScore = Math.round((completeItems / totalItems) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Accreditation' }]} />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Accreditation Readiness
              </h1>
              <p className="text-black mt-1">
                Monitor compliance and prepare for accreditation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/accreditation/report"
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Readiness Score */}
        <div className="bg-slate-900 rounded-lg p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Overall Readiness Score
              </h2>
              <p className="text-brand-blue-100">
                {completeItems} of {totalItems} items complete
                {warningItems > 0 && ` • ${warningItems} items need attention`}
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-4xl md:text-5xl lg:text-6xl">
                {readinessScore}%
              </div>
              <div className="text-brand-blue-100 mt-2">
                {readinessScore >= 95
                  ? '<span className="text-slate-400 flex-shrink-0">•</span> Ready'
                  : readinessScore >= 85
                    ? '<AlertTriangle className="w-5 h-5 inline-block" /> Nearly Ready'
                    : '🔄 In Progress'}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <GraduationCap className="w-8 h-8 text-brand-blue-600" />
              <span className="text-2xl font-bold text-black">
                {programs?.length || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-black">
              Active Programs
            </h3>
            <p className="text-xs text-black mt-1">
              All with documented outcomes
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-brand-green-600" />
              <span className="text-2xl font-bold text-black">
                {enrollments?.length || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-black">
              Annual Enrollments
            </h3>
            <p className="text-xs text-black mt-1">Last 12 months</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-brand-blue-600" />
              <span className="text-2xl font-bold text-black">
                {completionRate}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-black">
              Completion Rate
            </h3>
            <p className="text-xs text-black mt-1">Target: 75%+</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-brand-orange-600" />
              <span className="text-2xl font-bold text-black">
                {placementRate}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-black">
              Placement Rate
            </h3>
            <p className="text-xs text-black mt-1">Target: 80%+</p>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="space-y-6">
          {complianceItems.map((category, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-black">
                  {category.category}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {item.status === 'complete' ? (
                          <span className="text-slate-400 flex-shrink-0">•</span>
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-brand-orange-600" />
                        )}
                        <span className="font-medium text-black">
                          {item.name}
                        </span>
                      </div>
                      <Link
                        href={item.link}
                        className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
                      >
                        <span>View</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Items */}
        {warningItems > 0 && (
          <div className="mt-8 bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-brand-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-brand-orange-900 mb-2">
                  Action Required: {warningItems} Items Need Attention
                </h3>
                <ul className="space-y-2 text-brand-orange-800">
                  <li>
                    • Complete ECR integration with Milady for automated
                    reporting
                  </li>
                  <li>
                    • Build unified hour tracking dashboard (Milady + Internal)
                  </li>
                  <li>• Automate welcome packet delivery system</li>
                  <li>• Implement Milady SSO access for students</li>
                </ul>
                <div className="mt-4">
                  <Link
                    href="/admin/accreditation/report"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Full Audit Report</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link
            href="/compliance"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <Shield className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Compliance Documentation
            </h3>
            <p className="text-sm text-black">
              Complete COE standards compliance framework
            </p>
          </Link>

          <Link
            href="/syllabi"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <BookOpen className="w-8 h-8 text-brand-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Course Syllabi
            </h3>
            <p className="text-sm text-black">
              Learning outcomes and assessment methods
            </p>
          </Link>

          <Link
            href="/student-handbook"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <FileText className="w-8 h-8 text-brand-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Student Handbook
            </h3>
            <p className="text-sm text-black">
              Policies, procedures, and student rights
            </p>
          </Link>
        </div>

        {/* COE Contact */}
        <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-3">
            Council on Occupational Education (COE)
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-brand-blue-800">
            <div>
              <p className="font-medium mb-1">Address:</p>
              <p>7840 Roswell Road, Building 300, Suite 325</p>
              <p>Atlanta, GA 30350</p>
            </div>
            <div>
              <p className="font-medium mb-1">Contact:</p>
              <p>Phone: (770) 396-3898</p>
              <p>Email: info@council.org</p>
              <p>Website: www.council.org</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
