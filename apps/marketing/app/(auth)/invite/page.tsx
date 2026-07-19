import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invite | Elevate For Humanity',
  description: 'Accept invitation to join.',
};

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Accept Invitation</h1>
        <p className="text-slate-600">Processing your invitation...</p>
      </div>
    </div>
  );
}
