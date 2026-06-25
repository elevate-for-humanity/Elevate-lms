import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Governance | Elevate For Humanity',
  description: 'Institutional governance and policies.',
};

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Governance</h1>
        <div className="grid gap-6">
          <Link href="/governance/operational-controls" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-xl font-semibold">Operational Controls</h2>
          </Link>
          <Link href="/governance/security" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-xl font-semibold">Security</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
