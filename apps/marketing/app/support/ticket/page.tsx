export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ticket',
  description: 'Submit a support ticket for Elevate for Humanity.',
  robots: { index: false, follow: false },
};

export default function TicketPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Support Ticket</h1>
          <p className="text-blue-200">Submit a ticket and our team will help you.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/support" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Support</Link>
        </div>
      </section>
    </div>
  );
}
