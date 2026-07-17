import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Performance | Dev Studio',
  description: 'Performance monitoring and analysis.',
};

export default function DevStudioPerformancePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Performance Monitoring</h1>
      <p className="text-slate-600">Performance tools coming soon.</p>
    </div>
  );
}
