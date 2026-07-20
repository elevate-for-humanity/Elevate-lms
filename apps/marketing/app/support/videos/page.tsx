export const dynamic = 'force-dynamic';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Videos',
  description: 'Watch support and tutorial videos.',
};

export default function SupportVideosPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Support Videos</h1>
      <p className="text-slate-600">Tutorial videos coming soon.</p>
    </div>
  );
}
