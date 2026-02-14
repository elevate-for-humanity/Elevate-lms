import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Clock, DollarSign, Award } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Career Pathways | Elevate for Humanity',
  description: 'Explore career pathways in healthcare, skilled trades, technology, and business. Find the right training program for your goals.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pathways' },
};

export default function PathwaysPage() {
  const pathways = [
    { name: 'Healthcare', description: 'Medical assistant, phlebotomy, CNA, and more', image: '/images/healthcare/cpr-certification-group.jpg', programs: 8, href: '/programs/healthcare', color: 'blue' },
    { name: 'Skilled Trades', description: 'HVAC, electrical, plumbing, and construction', image: '/images/trades/program-building-construction.jpg', programs: 6, href: '/programs/skilled-trades', color: 'orange' },
    { name: 'Technology', description: 'IT support, cybersecurity, and software development', image: '/images/technology/hero-program-it-support.jpg', programs: 5, href: '/programs/technology', color: 'blue' },
    { name: 'Business', description: 'Entrepreneurship, marketing, and management', image: '/images/heroes/hero-federal-funding.jpg', programs: 4, href: '/programs/business', color: 'green' },
    { name: 'Beauty & Cosmetology', description: 'Barber, cosmetology, and esthetics', image: '/images/barber-hero.jpg', programs: 5, href: '/barber-apprenticeship', color: 'pink' },
  ];

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Pathways' }]} />
        </div>
      </div>

      <section className="py-16 bg-brand-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Career Pathway</h1>
          <p className="text-xl text-brand-blue-100 mb-8">Explore training programs designed to launch your career in high-demand industries</p>
          <Link href="/apply" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Explore Career Pathways</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pathways.map((pathway, i) => (
              <Link key={i} href={pathway.href} className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="relative h-48">
                  <Image src={pathway.image} alt={pathway.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
                  
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-bold text-white">{pathway.name}</h3>
                    <p className="text-white/80 text-sm">{pathway.programs} programs available</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{pathway.description}</p>
                  <span className="text-brand-blue-600 font-medium group-hover:text-brand-blue-700 inline-flex items-center">
                    Explore Programs <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How Our Programs Work</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Clock, title: 'Fast-Track Training', desc: 'Complete programs in weeks, not years' },
              { icon: DollarSign, title: 'Funding Available', desc: 'WIOA and other funding options' },
              { icon: Award, title: 'Industry Certifications', desc: 'Earn credentials employers want' },
              { icon: CheckCircle, title: 'Job Placement', desc: 'Career services and employer connections' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Have Questions?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">Use our live chat or apply online - we respond within 24 hours.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition">Apply Now</Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-bold transition border-2 border-white/30">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
