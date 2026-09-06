import Link from 'next/link';

export default function MicrocourseSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-10 shadow-sm">
        <p className="font-semibold text-emerald-700">Payment received</p>
        <h1 className="mt-3 text-4xl font-black">Your microcourses are being activated.</h1>
        <p className="mt-4 text-slate-600">Provider payment and course access are completed by the signed Stripe webhook. You will receive access details after settlement succeeds.</p>
        <Link href="/login" className="mt-8 inline-block rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Sign in to continue</Link>
      </div>
    </main>
  );
}
