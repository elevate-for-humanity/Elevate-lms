import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Order Verification | Elevate Store',
  robots: { index: false, follow: false },
};

// This legacy return URL does not verify an active provider's payment event.
// Never represent a purchase as paid based on the browser redirect alone.
export default function ImplementationPackageSuccessPage() {
  return <Pending message="We could not verify this order from the return link. Check your account or contact support. Do not submit another payment for the same order." />;
}

function Pending({
  message = 'Payment verification is still processing. Do not submit another payment. Contact support if this message remains.',
}: {
  message?: string;
}) {
  return (
    <main className="grid min-h-[65vh] place-items-center bg-slate-50 px-5 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-amber-300 bg-white p-8 text-center">
        <h1 className="text-2xl font-black text-slate-950">Payment verification pending</h1>
        <p className="mt-3 text-slate-700">{message}</p>
        <Link
          href="/contact?topic=standalone-platform-payment"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
        >
          Contact Support
        </Link>
      </section>
    </main>
  );
}
