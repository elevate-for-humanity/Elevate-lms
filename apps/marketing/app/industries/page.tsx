import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Industries We Serve | Elevate for Humanity',
  description: 'Elevate for Humanity serves healthcare, skilled trades, beauty, and business industries with workforce training programs designed for real career outcomes.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Industries We Serve</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Industry-specific training programs designed to meet real workforce demands. Our graduates are ready to contribute from day one.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Healthcare</h3>
              <p className="text-slate-600 mb-4">High-demand clinical roles with certification pathways.</p>
              <ul className="text-sm text-slate-600 space-y-1 mb-4">
                <li>• Medical Assistant</li>
                <li>• Phlebotomy Technician</li>
                <li>• Pharmacy Technician</li>
                <li>• Patient Care Technician</li>
                <li>• EKG Technician</li>
              </ul>
              <Link href="/programs/healthcare" className="text-emerald-600 font-semibold hover:text-emerald-700">View Healthcare Programs →</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Skilled Trades</h3>
              <p className="text-slate-600 mb-4">Hands-on training for essential technical careers.</p>
              <ul className="text-sm text-slate-600 space-y-1 mb-4">
                <li>• HVAC Technician</li>
                <li>• Building Maintenance</li>
                <li>• EPA 608 Certification</li>
                <li>• Welding Fundamentals</li>
                <li>• CDL Training</li>
              </ul>
              <Link href="/programs/trades" className="text-blue-600 font-semibold hover:text-blue-700">View Trades Programs →</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-pink-500">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Beauty & Wellness</h3>
              <p className="text-slate-600 mb-4">Licensure prep for cosmetology and skincare careers.</p>
              <ul className="text-sm text-slate-600 space-y-1 mb-4">
                <li>• Barbering Apprenticeship</li>
                <li>• Cosmetology</li>
                <li>• Esthetics</li>
                <li>• Nail Technology</li>
              </ul>
              <Link href="/barber-and-beauty-apprenticeships" className="text-pink-600 font-semibold hover:text-pink-700">View Beauty Programs →</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-500">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Business & Technology</h3>
              <p className="text-slate-600 mb-4">Digital skills for modern workplace success.</p>
              <ul className="text-sm text-slate-600 space-y-1 mb-4">
                <li>• Medical Billing & Coding</li>
                <li>• EHR/EMR Training</li>
                <li>• Microsoft Office Suite</li>
                <li>• QuickBooks Certification</li>
              </ul>
              <Link href="/programs/business" className="text-amber-600 font-semibold hover:text-amber-700">View Business Programs →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Industry Partnerships</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-400 mb-2">500+</div>
              <div className="text-slate-300">Employer Partners</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-400 mb-2">95%</div>
              <div className="text-slate-300">Graduate Placement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-400 mb-2">4,000+</div>
              <div className="text-slate-300">Annual Graduates</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Partner With Us</h2>
          <p className="text-lg text-slate-600 mb-8">Connect with industry-aligned training programs designed to fill your talent pipeline.</p>
          <Link href="/for-employers" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 mr-4">For Employers</Link>
          <Link href="/contact" className="bg-white text-brand-blue-600 font-bold py-3 px-8 rounded-lg border-2 border-brand-blue-600 hover:bg-blue-50">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
