import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { AlertTriangle, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  APPRENTICE_PAYMENT_RULES,
  APPRENTICE_POLICY_KEYS,
  APPRENTICE_POLICY_VERSION,
} from '@/lib/apprenticeship/apprentice-policy';
import { PolicyAcknowledgment } from '../PolicyAcknowledgment';

export const dynamic = 'force-dynamic';

export default async function PaymentPolicyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/policies/payments');
  const db = await requireAdminClient();
  const { data: acceptance } = await db
    .from('agreement_acceptances')
    .select('id')
    .eq('subject_type', 'apprentice')
    .eq('subject_id', user.id)
    .eq('agreement_key', APPRENTICE_POLICY_KEYS.payment)
    .eq('agreement_version', APPRENTICE_POLICY_VERSION)
    .maybeSingle();
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link href="/apprentice" className="font-bold text-brand-blue-700">
        ← Dashboard
      </Link>
      <section className="relative min-h-[300px] overflow-hidden rounded-3xl shadow-xl">
        <Image
          src="/images/pages/training-classroom.webp"
          alt="Apprentices receiving support and instruction"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-950 via-amber-950/85 to-amber-950/20" />
        <div className="relative z-10 max-w-2xl p-7 text-white sm:p-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-300" />
            <h1 className="text-3xl font-black sm:text-4xl">Payment & Communication Policy</h1>
          </div>
          <p className="mt-4 text-lg font-bold leading-7 text-amber-50">
            If you have a payment problem, call before the due date. Do not ignore communication and
            do not simply stop paying.
          </p>
        </div>
      </section>
      <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm sm:p-8">
        <ol className="space-y-4">
          {APPRENTICE_PAYMENT_RULES.map((rule, index) => (
            <li key={rule} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-900 text-sm font-black text-white">
                {index + 1}
              </span>
              <span className="font-medium leading-7 text-amber-950">{rule}</span>
            </li>
          ))}
        </ol>
        <Link
          href="/contact?topic=billing"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-900 px-4 py-3 font-black text-white"
        >
          <Phone className="h-5 w-5" /> Contact Elevate about payments
        </Link>
      </section>
      <PolicyAcknowledgment
        agreementKey={APPRENTICE_POLICY_KEYS.payment}
        alreadyAccepted={Boolean(acceptance)}
      />
    </main>
  );
}
