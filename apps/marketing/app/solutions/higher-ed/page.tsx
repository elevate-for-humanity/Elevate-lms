import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Higher Education Solutions',
  description: 'Partner with colleges and universities for credit articulation and degree completion pathways.',
};

export default function HigherEdPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Higher Education Solutions</h1>
          <p className="text-xl text-blue-100">Credit articulation and degree completion pathways.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Partner With Us</h2>
          <p className="text-gray-600 mb-8">
            Elevate for Humanity partners with colleges and universities to provide stackable credentials and career pathways.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Credit Articulation', desc: 'Our certifications transfer to partner colleges for college credit.' },
              { title: 'Degree Completion', desc: 'Stack credentials toward an associate or bachelor degree.' },
              { title: 'Career Pathways', desc: 'Clear pathways from certificate to degree to career.' },
              { title: 'Custom Programs', desc: 'We can tailor programs to meet your institutional needs.' },
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
