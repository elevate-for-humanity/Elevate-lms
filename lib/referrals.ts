import { createClient } from '@/lib/supabase/server';
import * as crypto from 'node:crypto';

// =====================================================
// REFERRAL TYPES
// =====================================================

export interface ReferralCode {
  id: string;
  code: string;
  user_id: string;
  type: 'student' | 'affiliate' | 'partner';
  discount_percentage?: number;
  commission_percentage?: number;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  enabled: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled';
  reward_amount?: number;
  reward_paid: boolean;
  completed_at?: string;
  created_at: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
}

// =====================================================
// REFERRAL CODE MANAGEMENT
// =====================================================

/**
 * Generate unique referral code
 */
function generateReferralCode(userId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(userId + Date.now())
    .digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

/**
 * Create referral code for user
 */
export async function createReferralCode(
  userId: string,
  type: 'student' | 'affiliate' | 'partner',
  options?: {
    customCode?: string;
    discountPercentage?: number;
    commissionPercentage?: number;
    maxUses?: number;
    expiresAt?: string;
  },
): Promise<ReferralCode> {
  const supabase = await createClient();

  // Check if user already has a code
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const code = options?.customCode || generateReferralCode(userId);

  const { data, error }: any = await supabase
    .from('referral_codes')
    .insert({
      code,
      user_id: userId,
      type,
      discount_percentage: options?.discountPercentage || (type === 'student' ? 10 : 0),
      commission_percentage: options?.commissionPercentage || (type === 'affiliate' ? 20 : 0),
      max_uses: options?.maxUses,
      current_uses: 0,
      expires_at: options?.expiresAt,
      enabled: true,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}

/**
 * Get referral code by code string
 */
export async function getReferralCodeByCode(code: string): Promise<ReferralCode | null> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('enabled', true)
    .maybeSingle();

  if (error) return null;

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Check if max uses reached
  if (data.max_uses && data.current_uses >= data.max_uses) {
    return null;
  }

  return data;
}

/**
 * Get user's referral codes
 */
export async function getUserReferralCodes(userId: string): Promise<ReferralCode[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Update referral code
 */
export async function updateReferralCode(
  codeId: string,
  updates: Partial<ReferralCode>,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('referral_codes').update(updates).eq('id', codeId);

  if (error) throw error;
}

/**
 * Disable referral code
 */
export async function disableReferralCode(codeId: string): Promise<void> {
  await updateReferralCode(codeId, { enabled: true });
}

// =====================================================
// REFERRAL TRACKING
// =====================================================

/**
 * Track referral
 */
export async function trackReferral(
  referralCode: string,
  referredUserId: string,
): Promise<Referral> {
  const supabase = await createClient();

  // Get referral code
  const code = await getReferralCodeByCode(referralCode);
  if (!code) {
    throw new Error('Invalid or expired referral code');
  }

  // Check if user was already referred
  const { data: existing } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_id', referredUserId)
    .maybeSingle();

  if (existing) {
    throw new Error('User has already been referred');
  }

  // Create referral record
  const { data, error }: any = await supabase
    .from('referrals')
    .insert({
      referrer_id: code.user_id,
      referred_id: referredUserId,
      referral_code: code.code,
      status: 'pending',
      reward_paid: false,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  // Increment code usage
  await supabase
    .from('referral_codes')
    .update({
      current_uses: code.current_uses + 1,
    })
    .eq('id', code.id);

  return data;
}

/**
 * Complete referral (when referred user completes action)
 */
export async function completeReferral(referralId: string, rewardAmount?: number): Promise<void> {
  const supabase = await createClient();

  const { data: referral } = await supabase
    .from('referrals')
    .select('*, referral_code:referral_codes(*)')
    .eq('id', referralId)
    .maybeSingle();

  if (!referral) {
    throw new Error('Referral not found');
  }

  // Calculate reward if not provided
  let finalReward = rewardAmount;
  if (!finalReward && referral.referral_code) {
    // Default reward calculation (can be customized)
    finalReward = 50; // $50 default reward
  }

  // Update referral
  await supabase
    .from('referrals')
    .update({
      status: 'completed',
      reward_amount: finalReward,
      completed_at: new Date().toISOString(),
    })
    .eq('id', referralId);

  // Create notification for referrer
  await supabase.from('notifications').insert({
    user_id: referral.referrer_id,
    type: 'referral_completed',
    title: 'Referral Completed!',
    message: `Your referral has completed their enrollment. You've earned $${finalReward}!`,
    link: `/referrals`,
  });
}

/**
 * Cancel referral
 */
export async function cancelReferral(referralId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('referrals')
    .update({
      status: 'cancelled',
    })
    .eq('id', referralId);
}

/**
 * Get user's referrals
 */
export async function getUserReferrals(
  userId: string,
  status?: 'pending' | 'completed' | 'cancelled',
): Promise<Referral[]> {
  const supabase = await createClient();

  let query = supabase
    .from('referrals')
    .select(
      `
      *,
      referred_user:profiles!referred_id(first_name, last_name, email)
    `,
    )
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

// =====================================================
// AFFILIATE PROGRAM
// =====================================================

/**
 * Apply to become an affiliate
 */
export async function applyForAffiliate(
  userId: string,
  applicationData: {
    website?: string;
    socialMedia?: string;
    audience?: string;
    reason?: string;
  },
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('affiliate_applications').insert({
    user_id: userId,
    ...applicationData,
    status: 'pending',
  });

  // Notify admins
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');

  if (admins) {
    await Promise.all(
      admins.map((admin) =>
        supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'affiliate_application',
          title: 'New Affiliate Application',
          message: 'A user has applied to become an affiliate',
          link: `/admin/affiliates`,
        }),
      ),
    );
  }
}

/**
 * Approve affiliate application
 */
export async function approveAffiliateApplication(
  applicationId: string,
  commissionPercentage: number = 20,
): Promise<void> {
  const supabase = await createClient();

  // Get application
  const { data: application } = await supabase
    .from('affiliate_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (!application) {
    throw new Error('Application not found');
  }

  // Update application status
  await supabase
    .from('affiliate_applications')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  // Create affiliate referral code
  await createReferralCode(application.user_id, 'affiliate', {
    commissionPercentage,
  });

  // Notify user
  await supabase.from('notifications').insert({
    user_id: application.user_id,
    type: 'affiliate_approved',
    title: 'Affiliate Application Approved!',
    message: `Congratulations! You're now an affiliate with ${commissionPercentage}% commission.`,
    link: `/referrals`,
  });
}

/**
 * Get affiliate statistics
 */
export async function getAffiliateStats(userId: string): Promise<AffiliateStats> {
  const supabase = await createClient();

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId);

  const stats: AffiliateStats = {
    totalReferrals: referrals?.length || 0,
    completedReferrals: referrals?.filter((r) => r.status === 'completed').length || 0,
    pendingReferrals: referrals?.filter((r) => r.status === 'pending').length || 0,
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    conversionRate: 0,
  };

  if (referrals) {
    stats.totalEarnings = referrals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

    stats.paidEarnings = referrals
      .filter((r) => r.status === 'completed' && r.reward_paid)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

    stats.pendingEarnings = stats.totalEarnings - stats.paidEarnings;

    stats.conversionRate =
      stats.totalReferrals > 0 ? (stats.completedReferrals / stats.totalReferrals) * 100 : 0;
  }

  return stats;
}

/**
 * Process affiliate payout
 */
export async function processAffiliatePayout(
  userId: string,
  amount: number,
  paymentMethod: string,
  paymentDetails: any,
): Promise<void> {
  const supabase = await createClient();

  // Get unpaid referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .eq('status', 'completed')
    .eq('reward_paid', false);

  if (!referrals || referrals.length === 0) {
    throw new Error('No unpaid referrals found');
  }

  const totalUnpaid = referrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  if (amount > totalUnpaid) {
    throw new Error('Payout amount exceeds unpaid earnings');
  }

  // Create payout record
  const { data: payout } = await supabase
    .from('affiliate_payouts')
    .insert({
      user_id: userId,
      amount,
      payment_method: paymentMethod,
      payment_details: paymentDetails,
      status: 'pending',
    })
    .select()
    .maybeSingle();

  // Mark referrals as paid (proportionally)
  let remainingAmount = amount;
  for (const referral of referrals) {
    if (remainingAmount <= 0) break;

    const rewardAmount = referral.reward_amount || 0;
    if (rewardAmount <= remainingAmount) {
      await supabase.from('referrals').update({ reward_paid: true }).eq('id', referral.id);

      remainingAmount -= rewardAmount;
    }
  }

  // Notify user
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'payout_requested',
    title: 'Payout Requested',
    message: `Your payout of $${amount} has been requested and will be processed soon.`,
    link: `/referrals/payouts`,
  });
}

/**
 * Get affiliate leaderboard
 */
export async function getAffiliateLeaderboard(limit: number = 10): Promise<
  Array<{
    user_id: string;
    user_name: string;
    total_referrals: number;
    total_earnings: number;
  }>
> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('referrals')
    .select(
      `
      referrer_id,
      status,
      reward_amount,
      referrer:profiles!referrer_id(first_name, last_name)
    `,
    )
    .eq('status', 'completed');

  if (error) throw error;

  // Aggregate by referrer
  const leaderboard = new Map<
    string,
    {
      user_id: string;
      user_name: string;
      total_referrals: number;
      total_earnings: number;
    }
  >();

  data?.forEach((referral) => {
    const userId = referral.referrer_id;
    const existing = leaderboard.get(userId);

    if (existing) {
      existing.total_referrals++;
      existing.total_earnings += referral.reward_amount || 0;
    } else {
      leaderboard.set(userId, {
        user_id: userId,
        user_name: referral.referrer
          ? `${referral.referrer?.[0]?.first_name} ${referral.referrer?.[0]?.last_name}`
          : 'Unknown',
        total_referrals: 1,
        total_earnings: referral.reward_amount || 0,
      });
    }
  });

  return Array.from(leaderboard.values())
    .sort((a, b) => b.total_earnings - a.total_earnings)
    .slice(0, limit);
}

// =====================================================
// REFERRAL REWARDS
// =====================================================

/**
 * Apply referral discount to purchase
 */
export async function applyReferralDiscount(
  referralCode: string,
  originalAmount: number,
): Promise<{
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
}> {
  const code = await getReferralCodeByCode(referralCode);

  if (!code || !code.discount_percentage) {
    return {
      discountAmount: 0,
      finalAmount: originalAmount,
      discountPercentage: 0,
    };
  }

  const discountAmount = (originalAmount * code.discount_percentage) / 100;
  const finalAmount = originalAmount - discountAmount;

  return {
    discountAmount,
    finalAmount,
    discountPercentage: code.discount_percentage,
  };
}

/**
 * Calculate affiliate commission
 */
export async function calculateAffiliateCommission(
  referralCode: string,
  saleAmount: number,
): Promise<number> {
  const code = await getReferralCodeByCode(referralCode);

  if (!code || !code.commission_percentage) {
    return 0;
  }

  return (saleAmount * code.commission_percentage) / 100;
}
