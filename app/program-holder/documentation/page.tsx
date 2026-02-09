import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Download, BookOpen, FileCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | Program Holder Portal',
  description: 'Access forms, templates, and resources',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/documentation',
  },
};

export default async function DocumentationPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Documentation" }]} />
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

  const resources = [
    {
      category: 'Forms',
      items: [
        {
          name: 'Student Enrollment Form',
          url: '/docs/enrollment-form.pdf',
          type: 'PDF',
        },
        {
          name: 'Progress Report Template',
          url: '/docs/progress-report.pdf',
          type: 'PDF',
        },
        {
          name: 'Attendance Sheet',
          url: '/docs/attendance-sheet.pdf',
          type: 'PDF',
        },
      ],
    },
    {
      category: 'Guides',
      items: [
        {
          name: 'Program Holder Handbook',
          url: '/program-holder/handbook',
          type: 'Web',
        },
        {
          name: 'Compliance Guide',
          url: '/docs/compliance-guide.pdf',
          type: 'PDF',
        },
        {
          name: 'Reporting Requirements',
          url: '/docs/reporting-requirements.pdf',
          type: 'PDF',
        },
      ],
    },
    {
      category: 'Policies',
      items: [
        {
          name: 'Rights & Responsibilities',
          url: '/program-holder/rights-responsibilities',
          type: 'Web',
        },
        { name: 'MOU Template', url: '/program-holder/mou', type: 'Web' },
        { name: 'Privacy Policy', url: '/privacy', type: 'Web' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Documentation" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/lms-hero-banner.jpg"
          alt="Documentation"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Documentation & Resources
          </h1>
          <p className="text-lg text-gray-100">
            Access forms, templates, and program guides
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Resources by Category */}
            {resources.map((category) => (
              <div
                key={category.category}
                className="bg-white rounded-lg shadow-sm border p-8 mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  {category.category === 'Forms' && (
                    <FileText className="h-11 w-11 text-brand-blue-600" />
                  )}
                  {category.category === 'Guides' && (
                    <BookOpen className="h-11 w-11 text-brand-green-600" />
                  )}
                  {category.category === 'Policies' && (
                    <FileCheck className="h-11 w-11 text-blue-600" />
                  )}
                  <h2 className="text-2xl font-bold text-black">
                    {category.category}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {category.items.map((item: any) => (
                    <Link
                      key={item.name}
                      href={item.url}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-slate-400 group-hover:text-brand-blue-600 transition-colors" />
                        <div>
                          <h3 className="font-medium text-black group-hover:text-brand-blue-600 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-sm text-slate-500">{item.type}</p>
                        </div>
                      </div>
                      <span className="text-brand-blue-600 group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick Links */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Quick Links
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href="/program-holder/documents"
                  className="text-blue-900 hover:text-blue-700 font-medium"
                >
                  Upload Documents →
                </Link>
                <Link
                  href="/program-holder/reports"
                  className="text-blue-900 hover:text-blue-700 font-medium"
                >
                  Submit Reports →
                </Link>
                <Link
                  href="/program-holder/support"
                  className="text-blue-900 hover:text-blue-700 font-medium"
                >
                  Get Support →
                </Link>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/program-holder/dashboard"
                className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
