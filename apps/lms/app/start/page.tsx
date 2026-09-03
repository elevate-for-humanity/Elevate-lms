export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Get Started | Elevate', keywords: ["get started", "apply", "enroll", "workforce training"], description: 'Start your journey.' };
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Get Started</h1>
          <p className="text-blue-200">Begin your workforce training journey.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/check-eligibility" className="bg-brand-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-orange-700">Check Eligibility</Link>
        </div>
      </section>
    </div>
  );
}

