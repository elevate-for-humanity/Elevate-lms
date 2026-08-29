import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'HSI Partnership,
  description: 'Partner with Elevate as a Hispanic-Serving Institution to expand workforce development opportunities for Hispanic students.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Partnership Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hispanic-Serving Institution Partnership</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Expand workforce development opportunities for your Hispanic student population through our comprehensive training programs.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bilingual Programs</h3>
              <p className="text-slate-600">Access training materials and support in both English and Spanish to serve diverse student needs.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Student Support</h3>
              <p className="text-slate-600">Dedicated advisors who understand Hispanic cultural values and can guide students through career pathways.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Industry Certifications</h3>
              <p className="text-slate-600">Prepare students for in-demand credentials that open doors to stable, family-sustaining careers.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-sm mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Partnership Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Customized Curriculum</h4>
                  <p className="text-slate-600 text-sm">Programs tailored to meet the specific needs of your student population and local employer demands.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Funding Assistance</h4>
                  <p className="text-slate-600 text-sm">Help students access WIOA, Pell Grants, and institutional scholarships to reduce financial barriers.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Employer Connections</h4>
                  <p className="text-slate-600 text-sm">Direct pathways to hiring partners who value diverse talent and provide career advancement opportunities.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Reporting & Analytics</h4>
                  <p className="text-slate-600 text-sm">Track student outcomes, completion rates, and employment metrics with detailed dashboards.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Partner with Us?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">Join other Hispanic-Serving Institutions in providing transformative workforce training to your students.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/partners/apply" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
                Apply for Partnership
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
