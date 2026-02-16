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

      <section className="relative min-h-[400px] flex items-center overflow-hidden">
        <Image src="/hero-images/how-it-works-hero.jpg" alt="Educator Hub" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-teal-900/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Educator Hub</h1>
          <p className="text-xl text-teal-100 mb-8">Everything you need to create impactful learning experiences</p>
          <Link href="/instructor/dashboard" className="inline-flex items-center gap-2 bg-white text-teal-600 px-8 py-4 rounded-full font-bold hover:bg-teal-50">
            Go to Instructor Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
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
          <Link href="/apply/instructor" className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-teal-700">
            Apply to Teach
          </Link>
        </div>
      </section>
    </div>
  );
}
