import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Containers | Dev Studio',
  description: 'Container management.',
};

export default function DevStudioContainersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Container Management</h1>
      <p className="text-slate-600">Container tools coming soon.</p>
    </div>
  );
}
