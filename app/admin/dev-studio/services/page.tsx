import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services | Dev Studio',
  description: 'Service management.',
};

export default function DevStudioServicesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Management</h1>
      <p className="text-slate-600">Service tools coming soon.</p>
    </div>
  );
}
