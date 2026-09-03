import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Template | Communications',
  description: 'Create a new communication template.',
};

export default function NewTemplatePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">New Communication Template</h1>
      <p className="text-slate-600">Template creation form coming soon.</p>
    </div>
  );
}
