import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Database | Dev Studio',
  description: 'Database management and monitoring.',
};

export default function DevStudioDatabasePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Database Management</h1>
      <p className="text-slate-600">Database tools and monitoring coming soon.</p>
    </div>
  );
}
