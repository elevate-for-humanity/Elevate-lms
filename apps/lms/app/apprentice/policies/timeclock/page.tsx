import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Clock3, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  APPRENTICE_POLICY_KEYS,
  APPRENTICE_POLICY_VERSION,
  APPRENTICE_TIMECLOCK_RULES,
} from '@/lib/apprenticeship/apprentice-policy';
import { PolicyAcknowledgment } from '../PolicyAcknowledgment';

export const dynamic = 'force-dynamic';

export default async function TimeclockPolicyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/policies/timeclock');
  const db = await requireAdminClient();
  const { data: acceptance } = await db
    .from('agreement_acceptances')
    .select('id')
    .eq('subject_type', 'apprentice')
    .eq('subject_id', user.id)
    .eq('agreement_key', APPRENTICE_POLICY_KEYS.timeclock)
    .eq('agreement_version', APPRENTICE_POLICY_VERSION)
    .maybeSingle();
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link href="/apprentice" className="font-bold text-brand-blue-700">
        ← Dashboard
      </Link>
      <section className="relative min-h-[300px] overflow-hidden rounded-3xl shadow-xl">
        <Image
          src="/images/pages/mentorship-page-3.webp"
          alt="Apprentice training at an approved work site"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20" />
        <div className="relative z-10 max-w-2xl p-7 text-white sm:p-10">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-cyan-300" />
            <h1 className="text-3xl font-black sm:text-4xl">Timeclock & Geofence Policy</h1>
          </div>
          <p className="mt-4 text-lg font-bold leading-7 text-slate-100">
            Arrive inside the approved radius, clock in, work your shift, and clock out before
            leaving.
          </p>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="font-semibold text-slate-700">
          These rules apply to every apprentice and every shift.
        </p>
        <ol className="mt-6 space-y-4">
          {APPRENTICE_TIMECLOCK_RULES.map((rule, index) => (
            <li key={rule} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                {index + 1}
              </span>
              <span className="font-medium leading-7 text-slate-800">{rule}</span>
            </li>
          ))}
        </ol>
        <Link
          href="/apprentice/timeclock"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-4 py-3 font-black text-white"
        >
          <Clock3 className="h-5 w-5" /> Open timeclock
        </Link>
      </section>
      <PolicyAcknowledgment
        agreementKey={APPRENTICE_POLICY_KEYS.timeclock}
        alreadyAccepted={Boolean(acceptance)}
      />
    </main>
  );
}
