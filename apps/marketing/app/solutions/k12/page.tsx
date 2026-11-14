import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'K-12 Workforce Solutions',
  description: 'Career and technical education (CTE) partnerships for high schools and school districts.',
};

export default function K12Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">K-12 Workforce Solutions</h1>
          <p className="text-xl text-blue-100">Career and technical education partnerships for high schools.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">CTE Partnerships</h2>
          <p className="text-gray-600 mb-8">
            Elevate for Humanity partners with high schools and school districts to provide career and technical education (CTE) programs.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Career Exploration', desc: 'Help students discover career paths in healthcare, trades, and technology.' },
              { title: 'Industry Certifications', desc: 'Students can earn certifications while still in high school.' },
              { title: 'Dual Credit', desc: 'Programs offer dual credit toward post-secondary education.' },
              { title: 'Work-Based Learning', desc: 'Connect students with internships and apprenticeship opportunities.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-slate-50 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/contact" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
