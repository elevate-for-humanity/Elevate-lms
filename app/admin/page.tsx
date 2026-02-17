import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import {
  BookOpen,
  FileText,
  ClipboardList,
  Award,
  Users,
  BarChart3,
  Download,
  Settings,
  GraduationCap,
  Briefcase,
  DollarSign,
  Shield,
  FolderOpen,
  Layers,
  Monitor,
  Wrench,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Hub | Elevate LMS',
  description: 'Administration hub for Elevate LMS.',
};

const sections = [
  {
    title: 'Content Management',
    items: [
      { href: '/admin/courses', label: 'Courses', icon: BookOpen, desc: 'Manage courses' },
      { href: '/admin/courses/create', label: 'Create Course', icon: BookOpen, desc: 'New course' },
      { href: '/admin/course-builder', label: 'Course Builder', icon: Layers, desc: 'Build + publish' },
      { href: '/admin/lessons', label: 'Lessons', icon: FileText, desc: 'All lessons' },
      { href: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList, desc: 'Quiz management' },
      { href: '/admin/quiz-builder', label: 'Quiz Builder', icon: ClipboardList, desc: 'Create quizzes' },
      { href: '/admin/modules', label: 'Modules', icon: FolderOpen, desc: 'Course modules' },
      { href: '/admin/curriculum', label: 'Curriculum', icon: Layers, desc: 'Curriculum design' },
    ],
  },
  {
    title: 'Students & Enrollment',
    items: [
      { href: '/admin/students', label: 'Students', icon: Users, desc: 'Student records' },
      { href: '/admin/enrollments', label: 'Enrollments', icon: GraduationCap, desc: 'Enrollment management' },
      { href: '/admin/progress', label: 'Progress', icon: BarChart3, desc: 'Student progress' },
      { href: '/admin/completions', label: 'Completions', icon: Award, desc: 'Course completions' },
      { href: '/admin/applicants', label: 'Applicants', icon: Users, desc: 'Applications' },
    ],
  },
  {
    title: 'Grading & Certificates',
    items: [
      { href: '/admin/gradebook', label: 'Gradebook', icon: ClipboardList, desc: 'Grades + SpeedGrader' },
      { href: '/admin/certificates', label: 'Certificates', icon: Award, desc: 'Issue + manage' },
      { href: '/admin/certifications', label: 'Certifications', icon: Award, desc: 'Certification programs' },
    ],
  },
  {
    title: 'Programs & Partners',
    items: [
      { href: '/admin/programs', label: 'Programs', icon: Layers, desc: 'Training programs' },
      { href: '/admin/apprenticeships', label: 'Apprenticeships', icon: Briefcase, desc: 'Apprenticeship management' },
      { href: '/admin/partners', label: 'Partners', icon: Briefcase, desc: 'Partner organizations' },
      { href: '/admin/employers', label: 'Employers', icon: Briefcase, desc: 'Employer partners' },
    ],
  },
  {
    title: 'Funding & Finance',
    items: [
      { href: '/admin/funding', label: 'Funding', icon: DollarSign, desc: 'Funding sources' },
      { href: '/admin/grants', label: 'Grants', icon: DollarSign, desc: 'Grant management' },
      { href: '/admin/payroll', label: 'Payroll', icon: DollarSign, desc: 'Payroll processing' },
      { href: '/admin/incentives', label: 'Incentives', icon: DollarSign, desc: 'Student incentives' },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      { href: '/admin/reporting', label: 'Reports', icon: BarChart3, desc: 'All reports' },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, desc: 'Platform analytics' },
      { href: '/admin/outcomes', label: 'Outcomes', icon: BarChart3, desc: 'Outcome tracking' },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: Shield, desc: 'Activity logs' },
    ],
  },
  {
    title: 'Content & Media',
    items: [
      { href: '/admin/media-studio', label: 'Media Studio', icon: Monitor, desc: 'Media management' },
      { href: '/admin/videos', label: 'Videos', icon: Monitor, desc: 'Video library' },
      { href: '/admin/documents', label: 'Documents', icon: FileText, desc: 'Document management' },
      { href: '/admin/files', label: 'Files', icon: FolderOpen, desc: 'File storage' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings, desc: 'Platform settings' },
      { href: '/admin/integrations', label: 'Integrations', icon: Wrench, desc: 'Third-party integrations' },
      { href: '/admin/compliance', label: 'Compliance', icon: Shield, desc: 'FERPA, WIOA, SAP' },
      { href: '/admin/advanced-tools', label: 'Advanced Tools', icon: Wrench, desc: 'Developer tools' },
    ],
  },
];

export default async function AdminHubPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Service Unavailable</h1>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  // Quick stats
  const [
    { count: studentCount },
    { count: courseCount },
    { count: enrollmentCount },
    { count: certCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Hub</h1>
          <p className="text-gray-600 mt-1">
            Welcome, {profile?.full_name || 'Admin'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Users', value: studentCount || 0, icon: Users, color: 'blue' },
            { label: 'Courses', value: courseCount || 0, icon: BookOpen, color: 'green' },
            { label: 'Enrollments', value: enrollmentCount || 0, icon: GraduationCap, color: 'purple' },
            { label: 'Certificates', value: certCount || 0, icon: Award, color: 'orange' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Overview */}
        <div className="mb-10">
          <AnalyticsDashboard />
        </div>

        {/* Section Grid */}
        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-lg border p-4 hover:shadow-sm hover:border-blue-200 transition group"
                >
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 mb-2" />
                  <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
