import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Shield, DollarSign, FileText, ArrowRight,
  Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Consumer Education | Elevate For Humanity',
  description: 'Free educational resources on financial literacy, consumer rights, and career development.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/consumer-education',
  },
};

const topics = [
  { icon: DollarSign, title: 'Financial Literacy', description: 'Budgeting, saving, credit management, and tax basics', href: '/consumer-education/financial' },
  { icon: Shield, title: 'Consumer Rights', description: 'Know your rights as a consumer and how to protect yourself', href: '/consumer-education/rights' },
  { icon: FileText, title: 'Career Development', description: 'Resume writing, interview skills, and job search strategies', href: '/career-services' },
  { icon: BookOpen, title: 'Education Planning', description: 'Choosing programs, understanding credentials, and funding options', href: '/programs' },
];

export default function ConsumerEducationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Consumer Education' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/hero-images/how-it-works-hero.jpg" alt="Consumer Education" fill className="object-cover" priority quality={90} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Consumer Education</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Free resources to help you make informed decisions about education, finances, and career</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {topics.map((topic, i) => (
              <Link key={i} href={topic.href} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all">
                <topic.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h3>
                <p className="text-gray-600 mb-4">{topic.description}</p>
                <span className="text-brand-blue-600 font-medium flex items-center gap-1">Learn More <ArrowRight className="w-4 h-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Our Commitment</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {['Transparent Information', 'No Hidden Fees', 'Student-First Approach'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
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
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
