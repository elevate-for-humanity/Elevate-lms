import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BookOpen, FileText, NotebookPen, Compass, BookMarked, GraduationCap, ArrowRight,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Learning Hub - Resources & Tools | Elevate Hub',
  description: 'Access lessons, syllabi, workbooks, orientation, and student resources',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/learning',
  },
};

export default async function LearningHubPage() {
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
  
  // Fetch learning resources
  const { data: resources } = await db
    .from('learning_resources')
    .select('*')
    .eq('published', true)
    .order('category');
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Learning Hub' },
        ]}
      />
      {/* Hero */}
      <section className="bg-brand-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <GraduationCap className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Learning Hub</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Everything you need to succeed in your learning journey. Access lessons, resources, and tools.
          </p>
          <Link
            href="/lms/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-green-600 rounded-lg font-bold hover:bg-gray-100"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Learning Resources */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Learning Resources</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ResourceCard
              icon={<BookOpen className="w-12 h-12 text-brand-green-600" />}
              title="Lessons"
              description="Browse and access all course lessons"
              href="/lessons"
              count="500+ lessons"
            />
            <ResourceCard
              icon={<FileText className="w-12 h-12 text-brand-blue-600" />}
              title="Syllabi"
              description="View course syllabi and requirements"
              href="/syllabi"
              count="100+ courses"
            />
            <ResourceCard
              icon={<NotebookPen className="w-12 h-12 text-brand-blue-600" />}
              title="Workbooks"
              description="Interactive digital workbooks"
              href="/workbooks"
              count="200+ workbooks"
            />
            <ResourceCard
              icon={<Compass className="w-12 h-12 text-brand-orange-600" />}
              title="Orientation"
              description="New student orientation and onboarding"
              href="/orientation"
              count="Get started"
            />
            <ResourceCard
              icon={<BookMarked className="w-12 h-12 text-brand-red-600" />}
              title="Student Handbook"
              description="Policies, procedures, and resources"
              href="/student-handbook"
              count="Essential guide"
            />
            <ResourceCard
              icon={<GraduationCap className="w-12 h-12 text-indigo-600" />}
              title="Courses"
              description="Browse all available courses"
              href="/courses"
              count="100+ courses"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Quick Access</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickLink title="My Courses" href="/lms/courses" />
            <QuickLink title="Assignments" href="/lms/assignments" />
            <QuickLink title="Grades" href="/lms/grades" />
            <QuickLink title="Calendar" href="/lms/calendar" />
            <QuickLink title="Messages" href="/lms/messages" />
            <QuickLink title="Resources" href="/lms/resources" />
            <QuickLink title="Support" href="/support" />
            <QuickLink title="Help Center" href="/help" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-green-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8">Access all your courses and resources in one place</p>
          <Link
            href="/lms/dashboard"
            className="inline-block px-8 py-4 bg-white text-brand-green-600 rounded-lg font-bold hover:bg-gray-100"
          >
            Go to My Dashboard
          </Link>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/inquiry"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              Ask a Question
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResourceCard({ icon, title, description, href, count }: any) {
  return (
    <Link href={href} className="p-6 border rounded-lg hover:shadow-xl transition-shadow bg-white group">
      <div className="mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-black mb-3">{description}</p>
      <p className="text-sm font-semibold text-brand-blue-600">{count}</p>
    </Link>
  );
}

function QuickLink({ title, href }: any) {
  return (
    <Link
      href={href}
      className="p-4 border rounded-lg hover:shadow-lg transition-shadow bg-white text-center font-semibold hover:bg-gray-50"
    >
      {title}
    </Link>
  );
}
