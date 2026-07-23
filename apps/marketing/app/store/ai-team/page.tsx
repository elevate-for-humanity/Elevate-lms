import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ai Team',
  keywords: ["team", "staff", "workforce development", "Elevate staff"], description: 'Ai Team page content.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900">AI Team</h1>
          <p className="text-slate-600 mt-2">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-red-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
