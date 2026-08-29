import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function ImplementationPackageSuccessPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-5 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-700" />
        <h1 className="mt-5 text-3xl font-black text-slate-950">Payment received</h1>
        <p className="mt-4 font-semibold leading-7 text-slate-700">
          Thank you for selecting an Elevate standalone platform build. We will use the contact
          information provided at checkout to send the scope agreement, onboarding checklist and
          next payment details.
        </p>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Project work begins after the signed scope and required branding and content materials are
          received.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact?topic=standalone-platform-onboarding"
            className="rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800"
          >
            Contact Onboarding
          </Link>
          <Link
            href="/store"
            className="rounded-xl border-2 border-slate-800 px-6 py-3 font-black text-slate-950 hover:bg-slate-100"
          >
            Return to Store
          </Link>
        </div>
      </section>
    </main>
  );
}
