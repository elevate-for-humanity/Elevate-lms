
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { BookOpen, Users, GraduationCap, Building, Code, FileText, ArrowRight,
  Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | Elevate For Humanity',
  description: 'Guides and documentation for students, instructors, partners, and administrators.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/docs',
  },
};

const docCategories = [
  { icon: GraduationCap, title: 'Student Guide', description: 'How to use the LMS, enroll in courses, and track progress', href: '/docs/students' },
  { icon: Users, title: 'Instructor Guide', description: 'Creating courses, managing students, and grading', href: '/docs/instructors' },
  { icon: Building, title: 'Partner Guide', description: 'Partner portal, reporting, and student management', href: '/docs/partners' },
  { icon: FileText, title: 'Admin Guide', description: 'System administration and configuration', href: '/docs/admins' },
  { icon: Code, title: 'API Documentation', description: 'Integration guides and API reference', href: '/docs/api' },
  { icon: BookOpen, title: 'LMS Features', description: 'Complete guide to platform features', href: '/docs/lms' },
];

export default function DocsPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documentation' }]} />
        </div>
      </div>

      <section className="bg-slate-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Documentation</h1>
          <p className="text-xl text-slate-300">Guides and resources to help you get the most out of Elevate</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docCategories.map((cat, i) => (
              <Link key={i} href={cat.href} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all">
                <cat.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{cat.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{cat.description}</p>
                <span className="text-brand-blue-600 font-medium flex items-center gap-1 text-sm">
                  Read Guide <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
