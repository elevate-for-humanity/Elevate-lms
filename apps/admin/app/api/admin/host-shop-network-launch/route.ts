import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  resolveHostShopNetworkRecipients,
  sendHostShopNetworkLaunch,
} from '@/lib/email/host-shop-network-launch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const recipients = await resolveHostShopNetworkRecipients();
  return NextResponse.json({
    count: recipients.length,
    recipients: recipients.map(({ shopName, email, profileUrl }) => ({
      shopName,
      email,
      profileUrl,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => ({}));
  if (body.confirm !== 'SEND_HOST_SHOP_NETWORK_LAUNCH') {
    return NextResponse.json(
      { error: 'Explicit campaign confirmation is required.' },
      { status: 400 },
    );
  }
  const results = await sendHostShopNetworkLaunch();
  const sent = results.filter((result) => result.success).length;
  return NextResponse.json(
    { sent, failed: results.length - sent, results },
    { status: sent === results.length ? 200 : 207 },
  );
}
