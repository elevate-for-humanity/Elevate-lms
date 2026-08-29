import Link from 'next/link';
import PaymentPlanCalculator from '@/components/programs/PaymentPlanCalculator';

export const metadata = {
  title: 'Cosmetology Apprenticeship Payment Options,
  robots: { index: false, follow: false },
};

export default function CosmetologyPaymentSetupPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/programs/cosmetology-apprenticeship"
          className="text-sm font-bold text-brand-blue-700 hover:underline"
        >
          Back to Cosmetology Apprenticeship
        </Link>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-brand-red-700">
            Self-pay options
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Choose a secure tuition payment option
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            The calculator below loads the published program price from the server. The minimum
            enrollment deposit is $600. You can adjust the deposit, pay tuition in full, or review
            available buy-now-pay-later options. Final financing terms are provided by the selected
            payment provider at checkout.
          </p>

          <div className="mt-7">
            <PaymentPlanCalculator programSlug="cosmetology-apprenticeship" />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
          Payment does not replace the application or identity-verification requirements. Complete
          your full student application and secure government-ID/SSN verification before final
          enrollment access is released.
        </div>
      </div>
    </main>
  );
}
