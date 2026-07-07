import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API | Dev Studio',
  description: 'API management and monitoring.',
};

export default function DevStudioApiPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">API Management</h1>
      <p className="text-slate-600">API tools and monitoring coming soon.</p>
    </div>
  );
}
