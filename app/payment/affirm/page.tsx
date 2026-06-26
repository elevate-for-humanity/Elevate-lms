import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affirm Payment | Elevate For Humanity',
  description: 'Pay with Affirm.',
};

export default function AffirmPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <h1 className="text-3xl font-bold">Pay with Affirm</h1>
    </div>
  );
}
