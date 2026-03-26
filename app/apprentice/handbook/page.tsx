import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookOpen, ChevronRight, Download, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Apprentice Handbook | Elevate For Humanity',
  description: 'Complete guide for apprentices including policies, procedures, and resources.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeHandbookPage() {
  const supabase = await createClient();
  if (!supabase) { redirect('/login'); }

  // Get handbook sections
  const { data: sections } = await supabase
    .from('handbook_sections')
    .select('*')
    .eq('handbook_type', 'apprentice')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get handbook PDF
  const { data: handbookPdf } = await supabase
    .from('documents')
    .select('url')
    .eq('document_type', 'apprentice-handbook')
    .single();

  const defaultSections = [
    {
      id: 1,
      title: 'Welcome & Introduction',
      description: 'Overview of the apprenticeship program and what to expect',
      slug: 'introduction',
    },
    {
      id: 2,
      title: 'Program Requirements',
      description: 'Hours, skills, and completion requirements',
      slug: 'requirements',
    },
    {
      id: 3,
      title: 'Policies & Procedures',
      description: 'Attendance, conduct, and workplace policies',
      slug: 'policies',
    },
    {
      id: 4,
      title: 'Safety Guidelines',
      description: 'Workplace safety requirements and procedures',
      slug: 'safety',
    },
    {
      id: 5,
      title: 'Logging Hours',
      description: 'How to track and submit your training hours',
      slug: 'logging-hours',
    },
    {
      id: 6,
      title: 'Skills Assessment',
      description: 'Understanding the skills checklist and evaluations',
      slug: 'skills-assessment',
    },
    {
      id: 7,
      title: 'Support Resources',
      description: 'Where to get help and additional resources',
      slug: 'resources',
    },
    {
      id: 8,
      title: 'Completion & Certification',
      description: 'Requirements for program completion',
      slug: 'completion',
    },
  ];

  const displaySections = sections && sections.length > 0 ? sections : defaultSections;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apprentice', href: '/apprentice' }, { label: 'Handbook' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Apprentice Handbook</h1>
          <p className="text-xl text-brand-blue-100">
            Your complete guide to the apprenticeship program
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Download & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search handbook..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
          </div>
          <a
            href={handbookPdf?.url || '/downloads/apprentice-handbook.pdf'}
            download
            className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-700 transition"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </a>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Table of Contents</h2>
          </div>
          <div className="divide-y">
            {displaySections.map((section: any, index: number) => (
              <Link
                key={section.id || index}
                href={`/apprentice/handbook/${section.slug}`}
                className="flex items-center justify-between p-6 hover:bg-white transition group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold group-hover:text-brand-blue-600 transition">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue-600 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-brand-blue-50 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Quick Links</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/apprentice/hours"
              className="bg-white rounded-lg p-4 hover:shadow-md transition"
            >
              <h4 className="font-medium">Log Hours</h4>
              <p className="text-sm text-gray-600">Track your training hours</p>
            </Link>
            <Link
              href="/apprentice/skills"
              className="bg-white rounded-lg p-4 hover:shadow-md transition"
            >
              <h4 className="font-medium">Skills Checklist</h4>
              <p className="text-sm text-gray-600">View your progress</p>
            </Link>
            <Link
              href="/apprentice/documents"
              className="bg-white rounded-lg p-4 hover:shadow-md transition"
            >
              <h4 className="font-medium">Documents</h4>
              <p className="text-sm text-gray-600">Access forms and files</p>
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Have questions? Contact your program coordinator or{' '}
            <Link href="/contact" className="text-brand-blue-600 hover:underline">
              reach out to us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
