import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reentry Partnership | Elevate for Humanity',
  description: 'Partner with Elevate to provide workforce training for individuals returning to their communities.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Second Chance Partnership</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Reentry Workforce Training</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Help individuals successfully transition back to their communities through job training, career readiness, and ongoing support.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Breaking Barriers to Employment</h2>
              <p className="text-lg text-slate-600 mb-8">We believe everyone deserves a second chance. Our reentry programs help individuals with criminal backgrounds develop marketable skills and find meaningful employment.</p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Industry-Recognized Credentials</h4>
                    <p className="text-slate-600 text-sm">Certifications that open doors to legitimate employment</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Expungement Assistance</h4>
                    <p className="text-slate-600 text-sm">Help clearing records to improve job prospects</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Employer Partnerships</h4>
                    <p className="text-slate-600 text-sm">Companies committed to second-chance hiring</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-brand-blue-700 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6">Our Impact</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-4xl font-bold">85%</div>
                  <div className="text-blue-200">Completion Rate</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">72%</div>
                  <div className="text-blue-200">Job Placement</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">12mo</div>
                  <div className="text-blue-200">Retention Support</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">500+</div>
                  <div className="text-blue-200">Graduates Annually</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Partner With Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">For Employers</h4>
                <p className="text-slate-600 text-sm">Access a dedicated pipeline of motivated workers with retention rates 40% higher than traditional hiring.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">For Corrections</h4>
                <p className="text-slate-600 text-sm">Pre-release training programs that reduce recidivism and prepare inmates for successful reentry.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">For Nonprofits</h4>
                <p className="text-slate-600 text-sm">Extend your reentry services with our training programs and job placement support.</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Make a Difference?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">Join our network of employers, corrections partners, and nonprofits working together to reduce recidivism and build stronger communities.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/partners/apply" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Partner With Us
              </Link>
              <Link href="/programs" className="bg-white text-brand-blue-600 border-2 border-brand-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-50 transition-colors">
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
