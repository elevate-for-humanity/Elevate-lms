import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Partner Learning | Elevate For Humanity',
  description: 'Partner learning and enrollment management.',
};

export default function PartnerLearningPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Partner Learning</h1>
        <p className="text-slate-600">View and manage partner learning enrollments.</p>
      </div>
    </div>
  );
}
