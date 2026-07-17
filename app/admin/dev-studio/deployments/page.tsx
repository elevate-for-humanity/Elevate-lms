import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deployments | Dev Studio',
  description: 'Deployment management.',
};

export default function DevStudioDeploymentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Deployment Management</h1>
      <p className="text-slate-600">Deployment tools coming soon.</p>
    </div>
  );
}
