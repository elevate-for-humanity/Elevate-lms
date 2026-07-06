import { Metadata } from 'next';
import Link from 'next/link';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs | Elevate for Humanity',
  description: 'Launch your healthcare career with CNA, Medical Assistant, Phlebotomy, and Pharmacy Tech programs. WIOA funding available.',
};

export default function HealthcarePage() {
  const heroBanner = heroBanners['healthcare'];

  return (
    <div className="min-h-screen">
      {/* Hero with Video from your hero-banners.json */}
      <HeroVideo
        videoSrcDesktop={heroBanner?.videoSrcDesktop || 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-healthcare.mp4'}
        videoSrcMobile={heroBanner?.videoSrcMobile}
        voiceoverSrc={heroBanner?.voiceoverSrc}
        microLabel={heroBanner?.microLabel || 'Healthcare Programs'}
        belowHeroHeadline={heroBanner?.belowHeroHeadline || 'Healthcare training that leads to certification.'}
        belowHeroSubheadline={heroBanner?.belowHeroSubheadline || 'CNA, Medical Assistant, Pharmacy Technician, Phlebotomy, CPR, and more.'}
        ctas={[
          { label: 'Enroll Now', href: '/apply?program=healthcare', variant: 'primary' },
          { label: 'Request Information', href: '/programs/healthcare/request-info', variant: 'secondary' },
        ]}
        trustIndicators={heroBanner?.trustIndicators || ['Free with WIOA funding', 'State-approved curricula', 'Clinical rotations included', 'Job placement assistance']}
        transcript={heroBanner?.transcript}
        eagerVideoLoad
        compactBelowHero
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Explore Healthcare Programs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/programs/cna" className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <h3 className="text-xl font-bold text-slate-900 mb-2">CNA / Nursing Assistant</h3>
              <p className="text-slate-600 text-sm mb-4">Start in healthcare in 4-8 weeks. Work in hospitals, nursing homes, and home health.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>4-8 weeks</span>
                <span>•</span>
                <span>WIOA Eligible</span>
              </div>
              <span className="text-teal-600 font-semibold">Learn More →</span>
            </Link>
            <Link href="/programs/medical-assistant" className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Medical Assistant</h3>
              <p className="text-slate-600 text-sm mb-4">Clinical and administrative skills for physician offices and clinics.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>12-16 weeks</span>
                <span>•</span>
                <span>WIOA Eligible</span>
              </div>
              <span className="text-teal-600 font-semibold">Learn More →</span>
            </Link>
            <Link href="/programs/pharmacy-technician" className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pharmacy Technician</h3>
              <p className="text-slate-600 text-sm mb-4">Prepare prescriptions and assist pharmacists in retail and hospital settings.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>8-12 weeks</span>
                <span>•</span>
                <span>Certification Prep</span>
              </div>
              <span className="text-teal-600 font-semibold">Learn More →</span>
            </Link>
            <Link href="/programs/phlebotomy" className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Phlebotomy Technician</h3>
              <p className="text-slate-600 text-sm mb-4">Draw blood for tests, donations, and research. High demand in hospitals and labs.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>6-8 weeks</span>
                <span>•</span>
                <span>Certification Prep</span>
              </div>
              <span className="text-teal-600 font-semibold">Learn More →</span>
            </Link>
            <Link href="/programs/qma" className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <h3 className="text-xl font-bold text-slate-900 mb-2">QMA / Medication Aide</h3>
              <p className="text-slate-600 text-sm mb-4">Administer medications in nursing homes under RN supervision.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>8 weeks</span>
                <span>•</span>
                <span>CNA Required</span>
              </div>
              <span className="text-teal-600 font-semibold">Learn More →</span>
            </Link>
            <Link href="/programs/home-health-aide" className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow block">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Home Health Aide</h3>
              <p className="text-slate-600 text-sm mb-4">Care for patients in their homes, helping with daily activities.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>4-6 weeks</span>
                <span>•</span>
                <span>High Demand</span>
              </div>
              <span className="text-teal-600 font-semibold">Learn More →</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Start Your Healthcare Career?</h2>
          <p className="text-slate-600 mb-8">Check your eligibility for WIOA funding — many programs are free.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/check-eligibility" className="bg-teal-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-teal-700">Check Eligibility</Link>
            <Link href="/contact" className="bg-slate-100 text-slate-700 font-bold py-4 px-8 rounded-lg hover:bg-slate-200">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
