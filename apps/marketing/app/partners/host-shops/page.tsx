import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Host Shop Program | Elevate for Humanity',
  description: 'Become a host shop for apprenticeship programs and help train the next generation of skilled professionals in your industry.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Apprenticeship Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Host Shop</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Train the next generation of skilled professionals while building your workforce pipeline and giving back to your community.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">What is a Host Shop?</h2>
              <p className="text-lg text-slate-600 mb-6">Host shops are licensed businesses that partner with Elevate to provide hands-on training for apprentices. You'll mentor future professionals while building a reliable talent pipeline for your business.</p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Real-World Training</h4>
                    <p className="text-slate-600 text-sm">Apprentices learn by doing under your supervision</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Tax Incentives</h4>
                    <p className="text-slate-600 text-sm">Available for hiring registered apprentices</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Future Employees</h4>
                    <p className="text-slate-600 text-sm">Pre-trained talent ready to hire</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Apprenticeship Industries</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">✂️</span>
                  <span className="font-medium text-slate-900">Barbering</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">💇</span>
                  <span className="font-medium text-slate-900">Cosmetology</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">💅</span>
                  <span className="font-medium text-slate-900">Nail Technology</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">✨</span>
                  <span className="font-medium text-slate-900">Esthetics</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">❄️</span>
                  <span className="font-medium text-slate-900">HVAC</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">🔧</span>
                  <span className="font-medium text-slate-900">Welding</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Host Shop Requirements</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Licensed Business</h4>
                <p className="text-slate-600 text-sm">Valid business license in your industry</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Qualified Mentor</h4>
                <p className="text-slate-600 text-sm">Licensed professional to supervise apprentices</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Training Space</h4>
                <p className="text-slate-600 text-sm">Adequate area for apprentice instruction</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">RTI Tracking</h4>
                <p className="text-slate-600 text-sm">Use our system to log training hours</p>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white mb-16">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">100+</div>
                <div className="text-blue-200">Active Host Shops</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-blue-200">Apprentices Trained</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">80%</div>
                <div className="text-blue-200">Hire Rate</div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Become a Host Shop?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">Join hundreds of businesses already training the next generation while building their workforce pipeline.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/partners/barber-host-shop/apply" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Apply to Become a Host Shop
              </Link>
              <Link href="/contact" className="bg-white text-brand-blue-600 border-2 border-brand-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-50 transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
