import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  BookOpen,
  FileText,
  Download,
  Search,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Student Handbook | Student Portal',
  description: 'Access the student handbook and policies.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StudentHandbookPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/student/handbook');

  const sections = [
    {
      title: 'Welcome & Introduction',
      items: [
        { title: 'Welcome Message', anchor: 'welcome' },
        { title: 'Mission & Values', anchor: 'mission' },
        { title: 'Program Overview', anchor: 'overview' },
      ],
    },
    {
      title: 'Academic Policies',
      items: [
        { title: 'Attendance Requirements', anchor: 'attendance' },
        { title: 'Grading System', anchor: 'grading' },
        { title: 'Academic Integrity', anchor: 'integrity' },
        { title: 'Progress Requirements', anchor: 'progress' },
      ],
    },
    {
      title: 'Student Conduct',
      items: [
        { title: 'Code of Conduct', anchor: 'conduct' },
        { title: 'Dress Code', anchor: 'dress' },
        { title: 'Professional Standards', anchor: 'professional' },
        { title: 'Disciplinary Procedures', anchor: 'disciplinary' },
      ],
    },
    {
      title: 'Student Services',
      items: [
        { title: 'Career Services', anchor: 'career' },
        { title: 'Tutoring & Support', anchor: 'tutoring' },
        { title: 'Accommodations', anchor: 'accommodations' },
        { title: 'Financial Aid', anchor: 'financial' },
      ],
    },
    {
      title: 'Safety & Compliance',
      items: [
        { title: 'Safety Procedures', anchor: 'safety' },
        { title: 'Emergency Protocols', anchor: 'emergency' },
        { title: 'FERPA Rights', anchor: 'ferpa' },
        { title: 'Title IX', anchor: 'titleix' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Student Portal', href: '/student' },
          { label: 'Handbook' },
        ]}
      />
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Handbook</h1>
              <p className="text-gray-600 mt-1">Policies, procedures, and resources</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search handbook..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Table of Contents</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sections.map((section, index) => (
              <details key={index} className="group">
                <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{section.title}</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-4 pl-20">
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i}>
                        <a
                          href={`#${item.anchor}`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Content Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div id="welcome" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Elevate for Humanity</h2>
            <p className="text-gray-600 mb-4">
              Welcome to our learning community! We are committed to providing you with the skills, 
              knowledge, and support you need to succeed in your chosen career path.
            </p>
            <p className="text-gray-600">
              This handbook contains important information about our policies, procedures, and 
              resources available to you as a student. Please read it carefully and keep it as 
              a reference throughout your program.
            </p>
          </div>

          <div id="mission" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              Elevate for Humanity is dedicated to transforming lives through accessible, 
              high-quality career training programs. We believe everyone deserves the opportunity 
              to build a successful career and achieve financial independence.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">
                &quot;Empowering individuals through education to elevate their lives and communities.&quot;
              </p>
            </div>
          </div>

          <div id="attendance" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance Requirements</h2>
            <p className="text-gray-600 mb-4">
              Regular attendance is essential for your success. Students are expected to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Maintain at least 80% attendance in all courses</li>
              <li>Notify instructors in advance of any planned absences</li>
              <li>Complete makeup work for any missed sessions</li>
              <li>Arrive on time for all scheduled classes and activities</li>
            </ul>
            <p className="text-gray-600">
              Excessive absences may result in academic probation or dismissal from the program.
            </p>
          </div>

          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-500 mb-4">Continue reading the full handbook</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-5 h-5" />
              Download Complete Handbook (PDF)
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Link href="/policies/ferpa" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">FERPA Rights</h3>
            <p className="text-sm text-gray-500">Your privacy rights</p>
          </Link>
          <Link href="/academic-integrity" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <BookOpen className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Academic Integrity</h3>
            <p className="text-sm text-gray-500">Honor code policies</p>
          </Link>
          <Link href="/support" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <ExternalLink className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Get Support</h3>
            <p className="text-sm text-gray-500">Contact student services</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
