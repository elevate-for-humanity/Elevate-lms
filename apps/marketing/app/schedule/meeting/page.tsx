import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Schedule a Meeting,
  description: 'Book a one-on-one consultation with Elevate for Humanity. Schedule time for program inquiries, employer partnerships, or student support.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Schedule a Meeting</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Book a one-on-one consultation with our team. We&apos;re here to help you find the right pathway.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Program Inquiry</h3>
              <p className="text-slate-600 mb-6">Learn about our training programs, career pathways, funding options, and enrollment process.</p>
              <Link href="/contact?type=program-inquiry" className="inline-block bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-700">Schedule Inquiry</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Employer Partnership</h3>
              <p className="text-slate-600 mb-6">Discuss hiring needs, apprenticeship programs, custom training, and workforce solutions.</p>
              <Link href="/contact?type=employer-partnership" className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">Schedule Meeting</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Student Support</h3>
              <p className="text-slate-600 mb-6">Get help with enrollment, scheduling, financial aid, or career services.</p>
              <Link href="/contact?type=student-support" className="inline-block bg-amber-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-700">Get Support</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prefer to Call?</h2>
          <p className="text-xl text-slate-300 mb-6">Our team is available Monday through Friday, 8am to 5pm EST.</p>
          <a href="tel:+13173143757" className="text-3xl font-bold text-emerald-400 hover:text-emerald-300">(317) 314-3757</a>
        </div>
      </section>
    </div>
  );
}

