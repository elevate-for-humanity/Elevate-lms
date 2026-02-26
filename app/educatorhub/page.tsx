import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Award, BarChart, FileText, Video, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Educator Hub | Elevate For Humanity',
  description: 'Resources and tools for instructors and educators to create engaging learning experiences.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/educatorhub',
  },
};

const resources = [
  { icon: FileText, title: 'Course Templates', description: 'Ready-to-use templates for building courses', href: '/educatorhub/templates' },
  { icon: Video, title: 'Video Tutorials', description: 'Learn how to use the LMS effectively', href: '/educatorhub/tutorials' },
  { icon: BarChart, title: 'Analytics Guide', description: 'Track and improve student outcomes', href: '/educatorhub/analytics' },
  { icon: Award, title: 'Best Practices', description: 'Tips from successful instructors', href: '/educatorhub/best-practices' },
];

export default function EducatorHubPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Educator Hub' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/hero-images/how-it-works-hero.jpg" alt="Educator Hub" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Educator Hub</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Everything you need to create impactful learning experiences</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Resources for Educators</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {resources.map((r, i) => (
              <Link key={i} href={r.href} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all flex items-start gap-4">
                <r.icon className="w-10 h-10 text-teal-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{r.title}</h3>
                  <p className="text-gray-600">{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Become an Instructor</h2>
          <p className="text-gray-600 mb-8">Share your expertise and help others achieve their career goals.</p>
          <Link href="/apply" className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-teal-700">
            Apply to Teach
          </Link>
        </div>
      </section>
    </div>
  );
}
