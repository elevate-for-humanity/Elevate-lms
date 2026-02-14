export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResourceLibrary } from '@/components/ResourceLibrary';
import {
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Heart,
  DollarSign,
  Phone,
  Clock,
  CheckCircle,
  Video,
  Users,
  HelpCircle,
} from 'lucide-react';
import ContentLibrary from '@/components/ContentLibrary';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/resources',
  },
  title: 'Student Resources | Elevate For Humanity',
  description:
    'Access career resources, study materials, job search tools, and support services.',
};

const resourceCategories = [
  {
    id: 'career',
    title: 'Career Services',
    icon: Briefcase,
    color: 'blue',
    resources: [
      {
        title: 'Resume Builder',
        description: 'Create a professional resume with our guided template',
        href: '/career-services',
        type: 'tool',
      },
      {
        title: 'Interview Preparation',
        description: 'Common questions and how to answer them',
        href: '/career-services',
        type: 'guide',
      },
      {
        title: 'Job Search Strategies',
        description: 'Tips for finding jobs in your field',
        href: '/career-services',
        type: 'guide',
      },
      {
        title: 'Employer Partners',
        description: 'Companies hiring our graduates',
        href: '/employers',
        type: 'directory',
      },
    ],
  },
  {
    id: 'academic',
    title: 'Academic Support',
    icon: GraduationCap,
    color: 'blue',
    resources: [
      {
        title: 'Study Skills Guide',
        description: 'Effective techniques for learning',
        href: '/lms/help',
        type: 'guide',
      },
      {
        title: 'Test Preparation',
        description: 'Prepare for certification exams',
        href: '/lms/help',
        type: 'guide',
      },
      {
        title: 'Request Tutoring',
        description: 'Schedule help with instructors',
        href: '/lms/support',
        type: 'form',
      },
      {
        title: 'Academic Calendar',
        description: 'Important dates and deadlines',
        href: '/lms/calendar',
        type: 'calendar',
      },
    ],
  },
  {
    id: 'financial',
    title: 'Financial Resources',
    icon: DollarSign,
    color: 'green',
    resources: [
      {
        title: 'Funding Options',
        description: 'WIOA, employer sponsorship, and more',
        href: '/tuition',
        type: 'guide',
      },
      {
        title: 'Financial Aid FAQ',
        description: 'Common funding questions',
        href: '/faq',
        type: 'faq',
      },
      {
        title: 'Emergency Assistance',
        description: 'Support for transportation and supplies',
        href: '/lms/support',
        type: 'form',
      },
      {
        title: 'Tax Preparation',
        description: 'Free tax filing for students',
        href: '/tax',
        type: 'service',
      },
    ],
  },
  {
    id: 'support',
    title: 'Student Support',
    icon: Heart,
    color: 'red',
    resources: [
      {
        title: 'Student Handbook',
        description: 'Policies and procedures',
        href: '/student-handbook',
        type: 'document',
      },
      {
        title: 'Accessibility Services',
        description: 'Accommodations for all learners',
        href: '/accessibility',
        type: 'info',
      },
      {
        title: 'Community Resources',
        description: 'Local support services',
        href: '/contact',
        type: 'directory',
      },
      {
        title: 'Contact Support',
        description: 'Reach our student success team',
        href: '/lms/support',
        type: 'contact',
      },
    ],
  },
];

const quickLinks = [
  { title: 'My Courses', href: '/lms/courses', icon: BookOpen },
  { title: 'My Progress', href: '/lms/progress', icon: CheckCircle },
  { title: 'Certificates', href: '/lms/certificates', icon: GraduationCap },
  { title: 'Messages', href: '/lms/messages', icon: Users },
  { title: 'Schedule', href: '/lms/schedule', icon: Clock },
  { title: 'Help Center', href: '/lms/help', icon: HelpCircle },
];

const downloadableResources = [
  {
    title: 'Student Success Guide',
    description: 'Tips for completing your program',
    fileType: 'PDF',
  },
  {
    title: 'Career Planning Workbook',
    description: 'Identify your career goals',
    fileType: 'PDF',
  },
  {
    title: 'Professional Communication Guide',
    description: 'Workplace communication tips',
    fileType: 'PDF',
  },
];

export default async function ResourcesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Resources" }]} />
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

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Resources" }]} />
        </div>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Resources</h1>
          <p className="text-gray-600 mt-2">
            Everything you need to succeed in your program and career
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Links */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-blue-500 hover:shadow-md transition-all"
              >
                <link.icon className="w-6 h-6 text-brand-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900 text-center">
                  {link.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Resource Categories */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Resource Categories
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {resourceCategories.map((category) => {
              const colorClasses: Record<string, string> = {
                blue: 'bg-brand-blue-50 border-brand-blue-200',
                blue: 'bg-brand-blue-50 border-brand-blue-200',
                green: 'bg-green-50 border-green-200',
                red: 'bg-red-50 border-red-200',
              };
              const iconColors: Record<string, string> = {
                blue: 'text-brand-blue-600',
                blue: 'text-brand-blue-600',
                green: 'text-green-600',
                red: 'text-red-600',
              };

              return (
                <div
                  key={category.id}
                  className={`rounded-xl border-2 ${colorClasses[category.color]} p-6`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <category.icon
                      className={`w-6 h-6 ${iconColors[category.color]}`}
                    />
                    <h3 className="text-xl font-bold text-gray-900">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {category.resources.map((resource) => (
                      <li key={resource.title}>
                        <Link
                          href={resource.href}
                          className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {resource.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {resource.description}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Downloadable Resources */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Downloadable Guides
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {downloadableResources.map((resource) => (
              <div
                key={resource.title}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{resource.title}</p>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">{resource.fileType}</span>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section>
          <div className="bg-brand-blue-600 rounded-xl p-8 text-white">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
              <p className="text-brand-blue-100 mb-6">
                Our student success team is here to support you with any questions
                about your program, career goals, or support services.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/lms/support"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-600 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Contact Support
                </Link>
                <Link
                  href="/lms/help"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-400 transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  Help Center
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
