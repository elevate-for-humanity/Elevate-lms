import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getApprovedHoursByType } from '@/lib/hours/get-approved-hours';
import { APPRENTICE_PORTAL_CONFIGS, type ApprenticePortalConfig } from '@/components/portal/ApprenticePortalShell';
import { remainingHoursDisplay } from '@/lib/barber/pricing';

export type ApprenticePortalEnrollment = {
  id: string;
  program_id?: string | null;
  program_slug?: string | null;
  enrollment_state: string;
  orientation_completed_at?: string | null;
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
};

export type ApprenticePortalBilling = {
  weeklyPaymentCents: number | null;
  remainingBalance: number | null;
  setupFeePaid: boolean;
  fullyPaid: boolean;
  paymentStatus: string | null;
  bnplProvider: string | null;
};

export async function loadApprenticePortalData(programSlug: string) {
  const config: ApprenticePortalConfig =
    APPRENTICE_PORTAL_CONFIGS[programSlug] ??
    ({
      programSlug,
      label: 'Apprenticeship',
      icon: require('lucide-react').GraduationCap,
      accentBg: 'bg-blue-600',
      accentText: 'text-blue-600',
      heroImage: '/images/pages/apprenticeship-hero.webp',
      shopLabel: 'Host Shop',
      requiredOjl: 2000,
      requiredRti: 0,
      portalPath: '/learner/dashboard',
    } as ApprenticePortalConfig);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=${config.portalPath}`);

  const [profileRes, enrollmentRes, apprenticeRes] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle(),
    supabase
      .from('program_enrollments')
      .select(
        'id, program_id, program_slug, enrollment_state, orientation_completed_at, stripe_subscription_id, stripe_subscription_status',
      )
      .eq('user_id', user.id)
      .eq('program_slug', programSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('apprentices')
      .select('id, shop_id, employer_id, start_date, status, rapids_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  let enrollment: ApprenticePortalEnrollment | null = enrollmentRes.data;
  const apprentice = apprenticeRes.data;

  let billing: ApprenticePortalBilling | null = null;
  let transferHoursClaimed = 0;
  let transferHoursVerified: number | null = null;

  if (programSlug === 'barber-apprenticeship') {
    const { data: barberSub } = await supabase
      .from('barber_subscriptions')
      .select(
        'id, status, stripe_subscription_id, setup_fee_paid, weekly_payment_cents, remaining_balance, fully_paid, bnpl_provider, transferred_hours_verified, hours_remaining',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (barberSub) {
      billing = {
        weeklyPaymentCents: barberSub.weekly_payment_cents,
        remainingBalance: barberSub.remaining_balance,
        setupFeePaid: barberSub.setup_fee_paid ?? false,
        fullyPaid: barberSub.fully_paid ?? false,
        paymentStatus: barberSub.status,
        bnplProvider: barberSub.bnpl_provider,
      };

      transferHoursVerified =
        barberSub.transferred_hours_verified != null
          ? Number(barberSub.transferred_hours_verified)
          : null;

      if (!enrollment) {
        enrollment = {
          id: barberSub.id,
          program_slug: programSlug,
          enrollment_state: 'active',
          orientation_completed_at: null,
          stripe_subscription_id: barberSub.stripe_subscription_id,
          stripe_subscription_status: barberSub.status,
        };
      } else if (!enrollment.stripe_subscription_id && barberSub.stripe_subscription_id) {
        enrollment = {
          ...enrollment,
          stripe_subscription_id: barberSub.stripe_subscription_id,
          stripe_subscription_status:
            enrollment.stripe_subscription_status ?? barberSub.status,
        };
      }
    }

    const email = profileRes.data?.email ?? user.email ?? '';
    if (email) {
      const { data: application } = await supabase
        .from('applications')
        .select('transfer_hours_claimed, transfer_hours_verified')
        .eq('normalized_email', email.toLowerCase().trim())
        .or(`program_slug.eq.${programSlug},program_interest.eq.${programSlug}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (application?.transfer_hours_claimed != null) {
        transferHoursClaimed = Math.max(0, Number(application.transfer_hours_claimed) || 0);
      }
      if (
        transferHoursVerified == null &&
        application?.transfer_hours_verified != null
      ) {
        transferHoursVerified = Number(application.transfer_hours_verified);
      }
    }
  }

  // Resolve shop name from shops table (apprentice.shop_id) or barber_shops fallback
  let shopName: string | null = null;
  const shopId = apprentice?.shop_id ?? apprentice?.employer_id ?? null;
  if (shopId) {
    const { data: shop } = await supabase
      .from('shops')
      .select('name')
      .eq('id', shopId)
      .maybeSingle();
    shopName = shop?.name ?? null;
  }

  const [hoursRes, docsRes] = await Promise.all([
    getApprovedHoursByType(supabase, user.id, programSlug),
    supabase
      .from('documents')
      .select('document_type, status, verification_status')
      .eq('user_id', user.id),
  ]);

  const firstName = profileRes.data?.full_name?.split(' ')[0] ?? 'Apprentice';
  const fullName = profileRes.data?.full_name ?? 'Apprentice';

  const creditedTransfer =
    transferHoursVerified != null && transferHoursVerified > 0
      ? transferHoursVerified
      : transferHoursClaimed;

  return {
    config,
    firstName,
    fullName,
    enrollment,
    apprentice: apprentice
      ? {
          id: apprentice.id,
          shopId: apprentice.shop_id,
          startDate: apprentice.start_date,
          rapidsId: apprentice.rapids_id,
        }
      : null,
    shopName,
    hours: hoursRes,
    docs: docsRes.data ?? [],
    billing,
    transferHoursClaimed,
    transferHoursVerified,
    hoursRemainingDisplay: remainingHoursDisplay(creditedTransfer),
  };
}
