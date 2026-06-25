import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partners | Elevate For Humanity',
  description: 'Partner portal.',
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Partner Portal</h1>
        <p className="text-slate-600">Welcome to the partner portal.</p>
      </div>
    </div>
  );
}
