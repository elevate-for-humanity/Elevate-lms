import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/jri' },
  title: 'Justice Reinvestment Initiative (JRI) | Elevate For Humanity',
  description: 'Free career training and support for justice-involved individuals in Indiana through the JRI program.',
};

export default function JRIPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'JRI' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/heroes/workforce-partner-3.jpg" alt="JRI career training" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Justice Reinvestment Initiative (JRI)</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Career training and wraparound support for justice-involved individuals. A second chance starts here.
            </p>
          </div>
        </div>
      </section>

      {/* What is JRI */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[240px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/homepage/funding-navigation.png" alt="JRI funding" fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What is JRI?</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                The Justice Reinvestment Initiative is an Indiana state program that funds career training, support services, and job placement for individuals who have been involved in the justice system. The goal is to reduce recidivism by providing real career pathways.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                JRI funding is administered through WorkOne and the Indiana Department of Workforce Development. Eligibility is determined by your WorkOne case manager based on your background and circumstances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What JRI Covers */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">What JRI Covers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
            {[
              { title: 'Tuition', desc: 'Full training program costs', icon: '📋' },
              { title: 'Certifications', desc: 'Exam fees and credentials', icon: '🎓' },
              { title: 'Transportation', desc: 'Help getting to class', icon: '🚗' },
              { title: 'Support Services', desc: 'Case management and more', icon: '🤝' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                <p className="text-slate-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Available */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">Programs Available Through JRI</h2>
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            {[
              { title: 'CDL Training', desc: 'Commercial driving license — 4 weeks', href: '/programs/cdl-training', image: '/images/cdl/hero.jpg' },
              { title: 'CNA Certification', desc: 'Certified Nursing Assistant — 6 weeks', href: '/programs/cna-certification', image: '/images/cna/hero.jpg' },
              { title: 'HVAC Technician', desc: 'Heating, ventilation, and AC — 12 weeks', href: '/programs/hvac-technician', image: '/images/hvac/hero.jpg' },
              { title: 'IT Support', desc: 'CompTIA A+ certification — 10 weeks', href: '/programs/technology/it-support', image: '/images/it/hero.jpg' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="flex gap-4 items-center bg-white rounded-lg border border-slate-200 p-3 hover:border-blue-300 transition-colors">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-slate-500 text-xs">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link href="/programs" className="text-blue-600 font-semibold text-sm hover:underline">
              View All Programs →
            </Link>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">How to Apply for JRI Funding</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Register at Indiana Career Connect', desc: 'Create your account at indianacareerconnect.com.' },
              { step: '2', title: 'Schedule a WorkOne Appointment', desc: 'Tell them you are interested in JRI-funded training.' },
              { step: '3', title: 'Eligibility Review', desc: 'Your case manager reviews your background and determines JRI eligibility.' },
              { step: '4', title: 'Choose Your Program', desc: 'Pick a training program at Elevate that fits your career goals.' },
              { step: '5', title: 'Start Training', desc: 'Begin your program with JRI covering the costs.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{item.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready for a Fresh Start?</h2>
          <p className="text-white/90 mb-6 text-sm">Register at Indiana Career Connect and schedule your WorkOne appointment to get started.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
              className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-blue-50 transition-colors text-center">
              Register Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </a>
            <Link href="/apply" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Apply for Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
