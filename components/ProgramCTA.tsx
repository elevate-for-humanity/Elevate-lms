import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface ProgramCTAProps {
  programName?: string;
}

export default function ProgramCTA({ programName = 'this program' }: ProgramCTAProps) {
  return (
    <>
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Ready to Start Your Career?</h2>
              <p className="text-xl mb-8 text-white">
                Enroll in {programName} and access training funded through WIOA, WRG, or JRI for eligible participants. No tuition for those who qualify — just training and a career.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  ['/images/pages/comp-cta-main.webp', 'Funded training', 'No-Cost Training Available', 'Funded through WIOA, WRG, and JRI for eligible participants'],
                  ['/images/pages/career-counseling.webp', 'Job placement', 'Job Placement Support', 'We help you find employment after graduation'],
                  ['/images/pages/workforce-training.webp', 'Hands-on training', 'Hands-On Training', 'Real-world experience with industry professionals'],
                ].map(([src, alt, title, text]) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={src} alt={alt} fill className="object-cover" sizes="48px" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{title}</h3>
                      <p className="text-white">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply" className="inline-block px-8 py-4 bg-white text-brand-orange-700 font-bold rounded-full hover:bg-brand-orange-50 transition-all shadow-xl text-center text-lg">Apply Now</Link>
                <a href="/support" className="inline-block px-8 py-4 bg-transparent text-slate-900 font-bold rounded-full border-2 border-white hover:bg-white hover:text-brand-orange-700 transition-all text-center text-lg">Get Help</a>
              </div>
            </div>
            <div className="relative h-[400px] sm:h-[500px] rounded-lg overflow-hidden shadow-2xl">
              <Image src="/images/pages/workforce-training.webp" alt="Students in training" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-brand-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden shadow-2xl order-2 md:order-1">
              <Image src="/images/pages/training-cohort.webp" alt="Indiana Career Connect" fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Start at Indiana Career Connect</h2>
              <p className="text-xl mb-6 text-slate-300">All WIOA-funded training starts with Indiana Career Connect. Create your account, schedule an appointment, and get approved for funded training.</p>
              <div className="space-y-4 mb-8">
                {[
                  'Create account at IndianaCareerConnect.com',
                  'Schedule appointment with career advisor',
                  'Get approved for WIOA funding',
                  `Enroll with ${PLATFORM_DEFAULTS.orgName}`,
                ].map((text, index) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-brand-blue-700">{index + 1}</div>
                    <p className="text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
              <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-full hover:bg-brand-orange-700 transition-all shadow-xl text-lg">Go to Indiana Career Connect →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">We Support Your Success</h2>
            <p className="text-xl text-black max-w-3xl mx-auto">Beyond training, we provide comprehensive support to help you succeed</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <SupportCard image="/images/pages/career-counseling.webp" alt="Career counseling" title="Career Counseling" text="One-on-one guidance to help you choose the right career path and achieve your goals." href="/advising" linkLabel="Schedule Counseling →" />
            <SupportCard image="/images/pages/training-cohort.webp" alt="Job placement" title="Job Placement" text="We connect you with employers actively hiring in your field. Resume help and interview prep included." href="/employer" linkLabel="View Employers →" />
            <SupportCard image="/images/pages/workforce-training.webp" alt="Supportive services" title="Supportive Services" text="Transportation assistance, childcare support, and other services to help you complete training." href="/support" linkLabel="Learn More →" />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Questions? We're Here to Help</h2>
          <p className="text-xl mb-8 text-white/90">Our team is ready to answer your questions and guide you through the enrollment process.</p>
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 text-slate-900"><div className="text-4xl mb-3">💬</div><h3 className="font-bold mb-2">Get Support</h3><a href="/support" className="text-brand-blue-700">Visit Support Center</a></div>
            <div className="bg-white rounded-lg p-6 text-slate-900"><div className="text-4xl mb-3">✉️</div><h3 className="font-bold mb-2">Email Us</h3><a href="/contact" className="text-brand-blue-700">our contact form</a></div>
            <div className="bg-white rounded-lg p-6 text-slate-900"><MapPin className="w-8 h-8 mb-3 text-brand-red-500 mx-auto"/><h3 className="font-bold mb-2">Visit Us</h3><p className="text-sm">6331 N Keystone Ave<br/>Suite D<br/>Indianapolis, IN 46220</p></div>
          </div>
          <Link href="/contact" className="inline-block px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-full hover:bg-slate-50 transition-all shadow-xl text-lg">Contact Us Today</Link>
        </div>
      </section>
    </>
  );
}

function SupportCard({ image, alt, title, text, href, linkLabel }: { image: string; alt: string; title: string; text: string; href: string; linkLabel: string }) {
  return (
    <div className="bg-slate-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative h-48"><Image src={image} alt={alt} fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" /></div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-black mb-3">{title}</h3>
        <p className="text-black mb-4">{text}</p>
        <Link href={href} className="text-brand-orange-700 font-semibold hover:underline">{linkLabel}</Link>
      </div>
    </div>
  );
}
