export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Resources | Student Portal',
  description: 'Access academic resources, library, and study materials.',
  robots: { index: false, follow: false },
};

export default async function StudentPortalResourcesPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('enrollments').select('*').limit(50);

  return (
    <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Student Portal", href: "/student-portal" }, { label: "Resources" }]} />
      </div>
<h1 className="text-3xl font-bold mb-6">Student Resources</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Library */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Digital Library</h2>
          <p className="text-gray-600 mb-4">Access e-books, journals, and research databases.</p>
          <a href="/lms/library" className="text-brand-blue-600 hover:underline">Browse Library →</a>
        </div>

        {/* Tutoring */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Tutoring Center</h2>
          <p className="text-gray-600 mb-4">Schedule one-on-one tutoring sessions.</p>
          <a href="/tutoring" className="text-brand-blue-600 hover:underline">Book Session →</a>
        </div>

        {/* Writing Center */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Writing Center</h2>
          <p className="text-gray-600 mb-4">Get help with essays, papers, and citations.</p>
          <a href="/writing-center" className="text-brand-blue-600 hover:underline">Get Help →</a>
        </div>

        {/* Career Services */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Career Services</h2>
          <p className="text-gray-600 mb-4">Resume help, job search, and career counseling.</p>
          <a href="/career-services" className="text-brand-blue-600 hover:underline">Explore Careers →</a>
        </div>

        {/* IT Help Desk */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="w-12 h-12 bg-brand-red-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">IT Help Desk</h2>
          <p className="text-gray-600 mb-4">Technical support for software and accounts.</p>
          <a href="/support" className="text-brand-blue-600 hover:underline">Get Support →</a>
        </div>

        {/* Study Materials */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Study Materials</h2>
          <p className="text-gray-600 mb-4">Course materials, past exams, and study guides.</p>
          <a href="/lms/resources" className="text-brand-blue-600 hover:underline">View Materials →</a>
        </div>
      </div>

      {/* Quick Links */}
      <section className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <a href="/lms/calendar" className="p-3 border rounded-lg hover:bg-gray-50 text-center">
            Academic Calendar
          </a>
          <a href="/student-handbook" className="p-3 border rounded-lg hover:bg-gray-50 text-center">
            Student Handbook
          </a>
          <a href="/financial-aid" className="p-3 border rounded-lg hover:bg-gray-50 text-center">
            Financial Aid
          </a>
          <a href="/support" className="p-3 border rounded-lg hover:bg-gray-50 text-center">
            Health Services
          </a>
        </div>
      </section>
    </div>
  );
}
