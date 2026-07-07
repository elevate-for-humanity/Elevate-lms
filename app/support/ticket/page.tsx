import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ticket | Elevate for Humanity',
  description: 'Ticket page content.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Ticket</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Support', href: '/support' }, { label: 'Ticket' }]} />
      </div>
      <Loader2 className="w-10 h-10 text-brand-blue-500 animate-spin" />
    </div>
  );
}

export default function SubmitTicketPage() {
  return (
          <SubmitTicketContent />
  );
}

