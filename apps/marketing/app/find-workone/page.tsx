import { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Find WorkOne | Elevate', description: 'Find WorkOne page.' };
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Find WorkOne</h1>
          <p className="text-blue-200">Workforce development.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/contact" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}

