'use server';

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import { getHostShopBoard } from '@/lib/partner/board';
import { hostShopReadyForReview } from '@/lib/partners/host-shop-review';
import { logger } from '@/lib/logger';

export async function submitHostShopForReview() {
  await requireRole(HOST_SHOP_ROLES);
  const { user, db, partner } = await requireCurrentHostShopPartner({ allowPendingOnboarding: true });
  const board = await getHostShopBoard(user.id);
  if (board.partner.id !== partner.id || !partner.partner_application_id || !hostShopReadyForReview(partner, board)) {
    redirect('/host-shop/onboarding?review=incomplete');
  }
  const now = new Date().toISOString();
  const { data, error } = await db.from('host_shop_applications')
    .update({ status: 'submitted', submitted_at: now, updated_at: now })
    .eq('id', partner.partner_application_id).eq('status', 'drafted')
    .select('id').maybeSingle();
  if (error) throw new Error('HOST_SHOP_REVIEW_SUBMISSION_FAILED');
  if (data) {
    try {
      const { error: notificationError } = await db.from('staff_notifications').insert({
        type: 'host_shop_application_submitted', title: `Host Shop ready for review: ${partner.name}`,
        message: 'The Host Shop submitted its saved application, profile, signed MOU, and uploaded documents for staff review.',
        severity: 'info', metadata: { application_id: data.id, partner_id: partner.id, submitted_by: user.id },
      });
      if (notificationError) logger.error('[host-shop/review] Queue notification failed', notificationError);
    } catch (notificationError) { logger.error('[host-shop/review] Queue notification failed', notificationError); }
  }
  redirect(`/host-shop/onboarding?review=${data ? 'submitted' : 'already-sent'}`);
}
