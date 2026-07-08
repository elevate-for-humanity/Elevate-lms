import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const HOST_SHOP_REPLY_TO = 'elevate4humanityedu@gmail.com';
export const ICC_URL = 'https://www.indianacareerconnect.com';
export const WORKONE_LOCATOR_URL = 'https://www.workone.in.gov/';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
export const HOST_SHOP_APPLY_URL = '/partners/barber-host-shop/apply';
export const HOST_SHOP_INFO_URL = '/programs/barber-apprenticeship/host-shops';

export function buildBarberHostShopFundingInterestEmail(
  contactName: string,
  shopName: string,
): string {
  const name = contactName.trim() || 'there';
  const shop = shopName.trim() || 'your shop';
  return `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;line-height:1.7">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="${PLATFORM_DEFAULTS.orgName}" style="height:56px;margin-bottom:20px"/>
  <h1 style="color:#dc2626;font-size:22px;margin:0 0 12px">Barber apprenticeship host shops — funding update</h1>
  <p>Hi ${name},</p>
  <p>
  Thank you for applying to host apprentices with <strong>${PLATFORM_DEFAULTS.orgName}</strong>
  for <strong>${shop}</strong>. We are reaching out about your host shop application and next steps.
  </p>
  <p>
  <strong>Workforce funding is available for eligible apprentices</strong> (WIOA and other Indiana programs).
  Many students can enroll with little or no cost when approved through WorkOne. Hosting an apprentice can help
  you grow your team while students complete their DOL-registered barber apprenticeship hours at your shop.
  </p>

  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin:24px 0">
    <h2 style="color:#166534;font-size:16px;margin:0 0 12px">What we need from you</h2>
    <ol style="margin:0;padding-left:20px">
      <li style="margin-bottom:10px">
        <strong>Confirm you are still interested</strong> in becoming (or remaining) an approved host barbershop
        by replying to this email at
        <a href="mailto:${HOST_SHOP_REPLY_TO}" style="color:#dc2626">${HOST_SHOP_REPLY_TO}</a>
        with the word <strong>INTERESTED</strong> and your shop name.
      </li>
      <li style="margin-bottom:10px">
        Encourage prospective apprentices to create an <strong>Indiana Career Connect</strong> account and
        meet with <strong>WorkOne</strong> to check funding eligibility:
        <a href="${ICC_URL}" style="color:#dc2626">${ICC_URL}</a> ·
        <a href="${WORKONE_LOCATOR_URL}" style="color:#dc2626">WorkOne locations</a>.
      </li>
      <li>
        If anything changed on your application (license, supervisor, address), reply with updates or complete
        the host shop form again:
        <a href="${SITE_URL}${HOST_SHOP_APPLY_URL}" style="color:#dc2626">${SITE_URL}${HOST_SHOP_APPLY_URL}</a>
      </li>
    </ol>
  </div>

  <p style="font-size:14px">
    Host shop program information:
    <a href="${SITE_URL}${HOST_SHOP_INFO_URL}" style="color:#dc2626">${SITE_URL}${HOST_SHOP_INFO_URL}</a>
  </p>

  <p>Questions? Call <strong>${PLATFORM_DEFAULTS.supportPhone}</strong> or reply to this email.</p>

  <p style="margin-top:28px">
    Thank you,<br/>
    <strong>${PLATFORM_DEFAULTS.orgName} Partnerships Team</strong><br/>
    <a href="mailto:${HOST_SHOP_REPLY_TO}">${HOST_SHOP_REPLY_TO}</a>
  </p>
</div>`;
}
