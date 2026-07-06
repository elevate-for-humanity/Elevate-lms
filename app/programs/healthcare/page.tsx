import { Metadata } from 'next';
import Link from 'next/link';
import ProgramPageTemplate from '@/components/content/ProgramPageTemplate';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs | Elevate for Humanity',
  description: 'Launch your healthcare career with CNA, Medical Assistant, Phlebotomy, and Pharmacy Tech programs. WIOA funding available.',
};

export default function HealthcarePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-teal-700 to-teal-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-teal-200 font-semibold mb-3 uppercase text-sm tracking-wide">Healthcare Programs</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Start Your Healthcare Career</h1>
          <p className="text-xl text-teal-100 max-w-2xl">
            Train for in-demand healthcare careers in weeks, not years. Many programs are fully funded through WIOA.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Explore Healthcare Programs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">CNA / Nursing Assistant</h3>
              <p className="text-slate-600 text-sm mb-4">Start in healthcare in 4-8 weeks. Work in hospitals, nursing homes, and home health.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>4-8 weeks</span>
                <span>•</span>
                <span>WIOA Eligible</span>
              </div>
              <Link href="/programs/cna" className="text-teal-600 font-semibold hover:underline">Learn More →</Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Medical Assistant</h3>
              <p className="text-slate-600 text-sm mb-4">Clinical and administrative skills for physician offices and clinics.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>12-16 weeks</span>
                <span>•</span>
                <span>WIOA Eligible</span>
              </div>
              <Link href="/programs/medical-assistant" className="text-teal-600 font-semibold hover:underline">Learn More →</Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pharmacy Technician</h3>
              <p className="text-slate-600 text-sm mb-4">Prepare prescriptions and assist pharmacists in retail and hospital settings.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>8-12 weeks</span>
                <span>•</span>
                <span>Certification Prep</span>
              </div>
              <Link href="/programs/pharmacy-technician" className="text-teal-600 font-semibold hover:underline">Learn More →</Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Phlebotomy Technician</h3>
              <p className="text-slate-600 text-sm mb-4">Draw blood for tests, donations, and research. High demand in hospitals and labs.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>6-8 weeks</span>
                <span>•</span>
                <span>Certification Prep</span>
              </div>
              <Link href="/programs/phlebotomy" className="text-teal-600 font-semibold hover:underline">Learn More →</Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">QMA / Medication Aide</h3>
              <p className="text-slate-600 text-sm mb-4">Administer medications in nursing homes under RN supervision.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>8 weeks</span>
                <span>•</span>
                <span>CNA Required</span>
              </div>
              <Link href="/programs/qma" className="text-teal-600 font-semibold hover:underline">Learn More →</Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Home Health Aide</h3>
              <p className="text-slate-600 text-sm mb-4">Care for patients in their homes, helping with daily activities.</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span>4-6 weeks</span>
                <span>•</span>
                <span>High Demand</span>
              </div>
              <Link href="/programs/home-health-aide" className="text-teal-600 font-semibold hover:underline">Learn More →</Link>
            </div>
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
