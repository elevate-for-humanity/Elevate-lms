import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Award, ArrowRight, Shield, Clock, Users, Circle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PageVideoHero from '@/components/ui/PageVideoHero';

export const metadata: Metadata = {
  title: 'Industry Certifications | Elevate for Humanity',
  description: 'Earn industry-recognized certifications that employers value. Healthcare, skilled trades, technology, and more.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/certifications' },
};

export default function CertificationsPage() {
  const certifications = [
    { name: 'Certified Medical Assistant (CMA)', industry: 'Healthcare', duration: '12 weeks', demand: 'High', image: '/images/pages/programs-medical-apply-hero.jpg' },
    { name: 'Certified Phlebotomy Technician (CPT)', industry: 'Healthcare', duration: '6 weeks', demand: 'High', image: '/images/pages/comp-pathway-healthcare.jpg' },
    { name: 'EPA 608 Certification', industry: 'HVAC', duration: '2 weeks', demand: 'High', image: '/images/pages/hvac-technician.jpg' },
    { name: 'OSHA 10/30 Safety', industry: 'Construction', duration: '1-3 days', demand: 'Required', image: '/images/pages/hvac-technician.jpg' },
    { name: 'Certiport IT Specialist', industry: 'Technology', duration: '8 weeks', demand: 'High', image: '/images/pages/it-help-desk.jpg' },
    { name: 'Barber License', industry: 'Beauty', duration: '2000 hours', demand: 'Required', image: '/images/pages/barber-gallery-1.jpg' },
  ];

  return (
    <div className="bg-white">

      <PageVideoHero
        videoSrc="/videos/programs-overview-video-with-narration.mp4"
        posterSrc="/images/pages/certifications-page-1.jpg"
        posterAlt="Certifications — Elevate for Humanity"
        size="marketing"
      />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Certifications' }]} />
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/certifications-page-1.jpg" alt="Certifications" fill className="object-cover" priority sizes="100vw" />
        
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Available Certifications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition">
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={cert.image}
                    alt={cert.name}
                    fill
                    className="object-cover"
                  />
                  <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded ${cert.demand === 'Required' ? 'bg-brand-red-500 text-white' : 'bg-brand-green-500 text-white'}`}>
                    {cert.demand} Demand
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{cert.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p className="flex items-center"><Shield className="w-4 h-4 mr-2" />{cert.industry}</p>
                    <p className="flex items-center"><Clock className="w-4 h-4 mr-2" />{cert.duration}</p>
                  </div>
                  <Link href="/programs" className="text-brand-green-600 font-medium hover:text-brand-green-700 inline-flex items-center">
                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Certifications Matter</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Circle, title: 'Employer Recognition', desc: 'Certifications prove your skills to employers' },
              { icon: Users, title: 'Higher Earnings', desc: 'Certified professionals earn 15-20% more' },
              { icon: Shield, title: 'Career Advancement', desc: 'Required for many positions and promotions' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Certification FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Are certification exams included in the training?', a: 'Yes, for most programs. WIOA funding covers certification exam fees for eligible participants. Self-pay students may have exam fees included or pay separately depending on the program.' },
              { q: 'What if I fail the certification exam?', a: 'Most programs include exam prep and practice tests. If you don\'t pass on the first attempt, we provide additional study support. Some funding covers retake fees.' },
              { q: 'How long are certifications valid?', a: 'It varies by certification. Some like OSHA 10 don\'t expire. Others like CNA require renewal every 2 years. We\'ll explain the requirements for your specific certification.' },
              { q: 'Will employers recognize these certifications?', a: 'Yes. All certifications we offer are industry-recognized and valued by employers. Many are required for employment in the field.' },
              { q: 'Can I get certified without taking a full program?', a: 'Some certifications like OSHA 10/30 are standalone courses. Others require completing a full training program first. Contact us to discuss your goals.' },
              { q: 'Do I need prior experience to get certified?', a: 'No prior experience needed for most certifications. Our training programs prepare you from the basics through certification.' },
            ].map((faq, i) => (
              <details key={i} className="bg-slate-50 rounded-xl overflow-hidden group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-green-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Get Certified Today</h2>
          <p className="text-xl text-brand-green-100 mb-8">Start your journey toward industry-recognized credentials.</p>
          <Link href="/start" className="bg-white hover:bg-gray-100 text-brand-green-700 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
