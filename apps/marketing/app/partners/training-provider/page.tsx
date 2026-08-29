import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Training Provider Partnership,
  description: 'Become an authorized training provider for Elevate workforce development programs and expand your educational impact.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Become a Provider</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Training Provider Partnership</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Expand your reach and impact by becoming an authorized Elevate training provider. Deliver industry-aligned curriculum to students in your community.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-brand-orange-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ready-Made Curriculum</h3>
              <p className="text-slate-600">Access comprehensive, industry-aligned curricula that meets DOL standards and employer requirements. No curriculum development needed.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Student Referrals</h3>
              <p className="text-slate-600">Receive a steady stream of motivated students from Elevate's marketing efforts and partner network. Focus on teaching, not recruiting.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Certification Support</h3>
              <p className="text-slate-600">Get assistance with testing center setup, proctor certification, and credentialing processes. We handle the paperwork.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Partnership Requirements</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Facility Requirements
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> Physical classroom space with adequate seating</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> Lab space for hands-on training (varies by program)</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> Reliable internet and AV equipment</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> ADA-compliant accessibility</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Staff Requirements
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> Certified instructors with relevant experience</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> Administrative support for student services</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> Compliance with reporting requirements</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400">•</span> Willingness to follow Elevate curriculum</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white mb-16">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-blue-200">Training Providers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">15</div>
                <div className="text-blue-200">States Served</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-blue-200">Student Satisfaction</div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Become a Training Provider?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">Join our network of education partners and help us expand workforce development opportunities across the country.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/partners/apply" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Apply Now
              </Link>
              <Link href="/contact" className="bg-white text-brand-blue-600 border-2 border-brand-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-50 transition-colors">
                Request Info
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
