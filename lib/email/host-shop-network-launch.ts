import 'server-only';

import { sendEmail } from '@/lib/email/sendgrid';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getApprovedShops } from '@/lib/programs/host-shops';

const NETWORK_URL = 'https://www.elevateforhumanity.org/partners/host-shops';
const DASHBOARD_URL = 'https://app.elevateforhumanity.org/host-shop/dashboard/profile';

type Recipient = { shopName: string; email: string; profileUrl: string };

function validExternalEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const email = value.trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) &&
    !email.startsWith('pending-contact+') &&
    !email.endsWith('@elevateforhumanity.org');
}

function identityKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function resolveHostShopNetworkRecipients(): Promise<Recipient[]> {
  const db = await requireAdminClient();
  const approved = await getApprovedShops();
  const [{ data: barberRows }, { data: hostRows }] = await Promise.all([
    db.from('barbershop_partner_applications')
      .select('shop_legal_name,shop_dba_name,contact_email')
      .eq('status', 'approved'),
    db.from('host_shop_applications')
      .select('shop_name,email,contact_email,approved_by')
      .eq('status', 'approved')
      .neq('approved_by', 'system_verification'),
  ]);

  const candidates = [
    ...(barberRows ?? []).map((row) => ({ shopName: row.shop_dba_name || row.shop_legal_name, email: row.contact_email })),
    ...(hostRows ?? []).map((row) => ({ shopName: row.shop_name, email: row.contact_email || row.email })),
  ];
  const seen = new Set<string>();

  return candidates.flatMap((candidate): Recipient[] => {
    if (!candidate.shopName || !validExternalEmail(candidate.email)) return [];
    // Elevate/Prestige is the sponsor-operated training site, not an external
    // shop recipient for this partner marketing campaign.
    if (/prestige elevation/i.test(candidate.shopName)) return [];
    const email = candidate.email.trim().toLowerCase();
    if (seen.has(email)) return [];
    const shop = approved.find((item) => identityKey(item.name) === identityKey(candidate.shopName));
    if (!shop?.publicSlug) return [];
    seen.add(email);
    return [{ shopName: candidate.shopName, email, profileUrl: `https://www.elevateforhumanity.org/host-shops/${shop.publicSlug}` }];
  });
}

export function hostShopNetworkLaunchEmail(recipient: Recipient) {
  const subject = `${recipient.shopName}: your Elevate Host Shop Network profile`;
  const text = `Hello ${recipient.shopName} team,

Elevate for Humanity is launching a statewide public Host Shop Network to help apprentices and local customers discover participating Indiana businesses.

Your shop has a shareable network profile: ${recipient.profileUrl}

Please take these three steps:
1. Review your business name, address, phone number, programs, and links.
2. Open your Host Shop dashboard and upload your logo, flyer, best shop photos, and a 30–60 second shop video: ${DASHBOARD_URL}
3. Share your profile on your website, Google Business Profile, Facebook, Instagram, and booking page.

A complete, accurate profile can expand your shop's digital visibility and give prospective clients and apprentices another way to find you. Search visibility, inquiries, placements, and revenue are not guaranteed.

View the full network: ${NETWORK_URL}

Thank you for helping build Indiana's apprenticeship talent network.

Elevate for Humanity
support@elevateforhumanity.org
(317) 314-3757`;
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:640px;margin:0 auto;padding:24px"><div style="background:#0f172a;color:#fff;padding:28px;border-radius:18px 18px 0 0"><p style="margin:0;color:#fca5a5;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase">Elevate Host Shop Network</p><h1 style="margin:10px 0 0;font-size:28px;line-height:1.2">Your shop now has a shareable network profile.</h1></div><div style="background:#fff;padding:28px;border-radius:0 0 18px 18px"><p>Hello <strong>${recipient.shopName}</strong> team,</p><p style="line-height:1.65">Elevate for Humanity is launching a statewide public Host Shop Network to help apprentices and local customers discover participating Indiana businesses.</p><p style="text-align:center;margin:26px 0"><a href="${recipient.profileUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:800">Review Your Public Profile</a></p><h2 style="font-size:20px">Complete your network launch</h2><ol style="padding-left:22px;line-height:1.75"><li>Confirm your business name, location, phone number, programs, and links.</li><li>Upload your logo, flyer, best photos, and a 30–60 second shop video.</li><li>Share your profile on your website, Google Business Profile, social pages, and booking page.</li></ol><p style="text-align:center;margin:24px 0"><a href="${DASHBOARD_URL}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:800">Open Host Shop Dashboard</a></p><p style="line-height:1.65">A complete, accurate profile can expand your shop’s digital visibility and give prospective clients and apprentices another way to find you. Search visibility, inquiries, placements, and revenue are not guaranteed.</p><p><a href="${NETWORK_URL}" style="color:#1d4ed8;font-weight:700">View the full Elevate Host Shop Network</a></p><p style="margin-top:28px">Thank you for helping build Indiana’s apprenticeship talent network.</p><p><strong>Elevate for Humanity</strong><br>support@elevateforhumanity.org<br>(317) 314-3757</p></div></div></body></html>`;
  return { subject, text, html };
}

export async function sendHostShopNetworkLaunch() {
  const recipients = await resolveHostShopNetworkRecipients();
  const results = [];
  for (const recipient of recipients) {
    const message = hostShopNetworkLaunchEmail(recipient);
    const result = await sendEmail({
      to: recipient.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    results.push({ shopName: recipient.shopName, email: recipient.email, success: result.success, error: result.error });
  }
  return results;
}
