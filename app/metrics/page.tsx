import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Metrics | Elevate for Humanity',
  description: 'Performance metrics',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Metrics</h1>
          <p className="text-xl text-blue-100">Elevate your career with our workforce development programs</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600 mb-8">This page is under construction. Please check back soon.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">Contact Us</Link>
            <Link href="/" className="px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50">Return Home</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
