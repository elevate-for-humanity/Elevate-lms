import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Target, TrendingUp, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Selfish Inc | Elevate for Humanity',
  description: 'Personal development and entrepreneurship program. Invest in yourself to create the life you deserve.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/selfish-inc',
  },
};

export default function SelfishIncPage() {
  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Selfish Inc" }]} />
      </div>
<section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image src="/images/programs-hq/business-office.jpg" alt="Selfish Inc" fill className="object-cover" priority quality={90} sizes="100vw" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-white/80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Selfish Inc</h1>
          <p className="text-xl text-pink-100">Invest in yourself. Create the life you deserve.</p>
        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">It is Not Selfish to Invest in Yourself</h2>
          <p className="text-gray-600 text-lg mb-8">
            When you grow, everyone around you benefits. Our personal development program helps you build the mindset, 
            skills, and habits needed to achieve your goals and live your best life.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Target className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Goal Setting</h3>
              <p className="text-gray-600">Define and achieve meaningful personal and professional goals.</p>
            </div>
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mindset Mastery</h3>
              <p className="text-gray-600">Develop the mental resilience and positive thinking patterns for success.</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Financial Freedom</h3>
              <p className="text-gray-600">Learn to manage money, build wealth, and create financial security.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Start Your Transformation</h2>
          <Link href="/apply" className="bg-white hover:bg-gray-100 text-pink-600 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
