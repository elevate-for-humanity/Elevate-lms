import Link from 'next/link';
import PaymentPlanCalculator from '@/components/programs/PaymentPlanCalculator';

export default function PaymentSetupPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-black">Barber Apprenticeship payment options</h1>
        <PaymentPlanCalculator programSlug="barber-apprenticeship" initialPaymentMode="plan" />
        <Link
          href="/programs/barber-apprenticeship"
          className="mt-6 inline-block font-bold underline"
        >
          Back to Barber Apprenticeship
        </Link>
      </div>
    </main>
  );
}
