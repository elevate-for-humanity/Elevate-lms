
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Compass, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Career Guidance Mentorship | Elevate for Humanity',
  description: 'Get personalized career guidance from experienced mentors. Navigate your career path with expert advice and support.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/career-guidance' },
};

export default function CareerGuidancePage() {

  const benefits = [
    { title: 'Personalized Advice', description: 'One-on-one sessions tailored to your goals' },
    { title: 'Industry Insights', description: 'Learn from professionals in your field' },
    { title: 'Career Planning', description: 'Create a roadmap for your success' },
    { title: 'Decision Support', description: 'Get help making important career choices' },
  ];

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentorship", href: "/mentorship" }, { label: "Career Guidance" }]} />
      </div>
<div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/mentorship" className="hover:text-brand-blue-600">Mentorship</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Career Guidance</span>
          </nav>
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/mentorship-page-1.jpg" alt="Career Guidance" fill className="object-cover" priority sizes="100vw" />
        
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What You Will Get</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            {['Apply for mentorship and share your goals', 'Get matched with an experienced mentor in your field', 'Schedule regular sessions to discuss your career', 'Receive guidance, feedback, and support'].map((step, i) => (
              <div key={i} className="flex items-start bg-white rounded-lg p-6 shadow-sm">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">{i + 1}</div>
                <p className="text-gray-700 pt-2">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-blue-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">Connect with a mentor who can help guide your career.</p>
          <Link href="/apply" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply for Mentorship <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
