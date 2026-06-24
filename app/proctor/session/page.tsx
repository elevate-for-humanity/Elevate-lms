import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proctor Session | Elevate For Humanity',
  description: 'Online proctoring session.',
};

export default function ProctorSessionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Proctor Session</h1>
        <p className="text-slate-600">Your proctored exam session.</p>
      </div>
    </div>
  );
}
