import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Order Verification | Elevate Store',
  robots: { index: false, follow: false },
};

// A return URL alone is not proof of payment. Fulfillment requires a verified
// event from the active billing provider and is handled by the order system.
export default function CartSuccessPage() {
  return <Pending message="We could not verify this order from the return link. Check your account or contact support. Do not submit another payment for the same order." />;
}

function Pending({
  message = 'Do not submit another payment. Return to your account or contact support if this status does not update.',
}: {
  message?: string;
}) {
  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-300 bg-white p-8 text-center">
        <h1 className="text-2xl font-black text-slate-950">Payment verification pending</h1>
        <p className="mt-3 text-slate-700">{message}</p>
        <Link href="/store" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800">
          Return to Store
        </Link>
      </div>
    </main>
  );
}
