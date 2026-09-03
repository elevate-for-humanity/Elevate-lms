import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'NRF Foundation Partnership | Elevate for Humanity',
  description: 'Partner with the NRF Foundation to provide retail workforce training and certification programs.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Industry Partnership</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">NRF Foundation Partnership</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Empower the next generation of retail professionals with industry-recognized credentials and career pathways.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Partner with NRF Foundation?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">The NRF Foundation is the workforce development arm of the National Retail Federation, connecting retailers, educators, and students to build careers in retail.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Industry Credentials</h3>
              <p className="text-slate-600 text-sm">NRF-certified programs recognized by top retailers nationwide</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Career Pathways</h3>
              <p className="text-slate-600 text-sm">Clear progression from entry-level to management roles</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Hiring Network</h3>
              <p className="text-slate-600 text-sm">Connect graduates directly with NRF member companies</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Flexible Learning</h3>
              <p className="text-slate-600 text-sm">Online and in-person options to fit any schedule</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Retail Training Programs</h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-brand-blue-600 pl-4">
                    <h4 className="font-semibold text-slate-900">Customer Service Excellence</h4>
                    <p className="text-slate-600 text-sm">Master the skills that drive customer loyalty and satisfaction in any retail environment.</p>
                  </div>
                  <div className="border-l-4 border-brand-orange-500 pl-4">
                    <h4 className="font-semibold text-slate-900">Retail Management Fundamentals</h4>
                    <p className="text-slate-600 text-sm">Develop leadership abilities to manage teams, inventory, and store operations.</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-slate-900">Sales & Merchandising</h4>
                    <p className="text-slate-600 text-sm">Learn visual merchandising, inventory management, and sales techniques.</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">By the Numbers</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-brand-blue-600">10M+</div>
                    <div className="text-slate-600 text-sm">Students Impacted</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-brand-blue-600">500+</div>
                    <div className="text-slate-600 text-sm">Retail Partners</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-brand-blue-600">95%</div>
                    <div className="text-slate-600 text-sm">Job Placement Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-brand-blue-600">50+</div>
                    <div className="text-slate-600 text-sm">Credential Programs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Build Your Retail Career?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">Whether you're an employer looking to upskill your workforce or an individual starting a retail career, NRF Foundation programs through Elevate can help.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/programs" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Explore Programs
              </Link>
              <Link href="/contact" className="bg-white text-brand-blue-600 border-2 border-brand-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-50 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
