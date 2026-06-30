import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const SENDGRID_KEY = process.env.SENDGRID_KEY || process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'elevate4humanityedu@gmail.com';

const PARTNERSHIP_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#222;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
<tr><td style="padding-bottom:24px; border-bottom:2px solid #222;">
  // IMAGE-CONTRACT: allow raw img because legacy markup
  <img src="${PLATFORM_DEFAULTS.siteUrl}/logo.jpg" alt="${PLATFORM_DEFAULTS.orgName}" width="44" height="44" style="display:inline-block; vertical-align:middle; margin-right:12px;">
  <span style="font-size:20px; font-weight:bold; vertical-align:middle;">${PLATFORM_DEFAULTS.orgName}</span>
</td></tr>
<tr><td style="padding:24px 0;">
<p>Good morning,</p>
<p>My name is Elizabeth Greene. I am the founder of <strong>${PLATFORM_DEFAULTS.orgName}</strong>, a 501(c)(3) nonprofit workforce development institute based in Indianapolis.</p>
<p>I am reaching out because your organization serves people who may benefit from funded career training — and I would like to explore a partnership.</p>
<p style="font-size:17px; font-weight:bold; margin:24px 0 12px;">Who we are</p>
<p>Elevate for Humanity is a U.S. Department of Labor Registered Apprenticeship sponsor, an ETPL-approved training provider listed with Indiana DWD, and an authorized Certiport testing center. We operate as a career and technical instructional institution providing industry-recognized certifications.</p>
<p style="font-size:17px; font-weight:bold; margin:24px 0 12px;">What we do</p>
<p>We provide career training programs in healthcare (CNA, Medical Assistant, Phlebotomy), skilled trades (HVAC, Electrical, Welding, Plumbing), CDL trucking (Class A and B), technology (IT Support, Cybersecurity), barbering (DOL Registered Apprenticeship), and tax preparation. Most programs run 4 to 16 weeks and include hands-on training, certification exam preparation, proctored testing on-site, and job placement assistance.</p>
<p>Training is funded through WIOA, the Indiana Workforce Ready Grant, and Job Ready Indy. We handle the eligibility screening and paperwork with WorkOne and DWD — participants pay nothing out of pocket when they qualify.</p>
<p style="font-size:17px; font-weight:bold; margin:24px 0 12px;">Who we serve</p>
<p>Our participants include justice-involved individuals, low-income families, veterans, dislocated workers, and anyone facing barriers to employment. If your clients are looking for a path to stable employment with an industry-recognized credential, we can help.</p>
<p style="font-size:17px; font-weight:bold; margin:24px 0 12px;">How a partnership works</p>
<ul style="padding-left:20px; margin:0 0 16px;">
  <li style="margin-bottom:8px;"><strong>Referral pathway:</strong> You refer clients who are ready for training. We handle enrollment, funding applications, and placement.</li>
  <li style="margin-bottom:8px;"><strong>Resource directory listing:</strong> Your organization can be listed on our public resource directory at no cost — giving your services visibility to our participants and partners.</li>
  <li style="margin-bottom:8px;"><strong>Employer partnerships:</strong> If your organization hires entry-level or skilled workers, we can connect you with trained, certified candidates at no recruitment cost.</li>
</ul>
<p style="font-size:17px; font-weight:bold; margin:24px 0 12px;">What I am asking</p>
<p>I would appreciate 15 minutes of your time to discuss whether a referral partnership or directory listing makes sense for your organization. You can pick a day and time that works for you:</p>
<p style="margin:16px 0;">
  <a href="https://${PLATFORM_DEFAULTS.canonicalDomain}/schedule-consultation" style="color:#222; font-weight:bold; font-size:16px;">Schedule a Meeting</a><br>
  <span style="font-size:13px; color:#555;">${PLATFORM_DEFAULTS.canonicalDomain}/schedule-consultation</span>
</p>
<p>You can also learn more about our programs and partnerships at:</p>
<ul style="padding-left:20px; margin:0 0 16px;">
  <li style="margin-bottom:4px;">Programs: <a href="${PLATFORM_DEFAULTS.siteUrl}/programs" style="color:#222;">${PLATFORM_DEFAULTS.canonicalDomain}/programs</a></li>
  <li style="margin-bottom:4px;">Partnerships: <a href="https://${PLATFORM_DEFAULTS.canonicalDomain}/partnerships" style="color:#222;">elevateforhumanity.org/partnerships</a></li>
  <li style="margin-bottom:4px;">Resource Directory: <a href="https://www.elevateforhumanity.org/directory" style="color:#222;">elevateforhumanity.org/directory</a></li>
  <li style="margin-bottom:4px;">Funding Information: <a href="https://www.elevateforhumanity.org/funding" style="color:#222;">elevateforhumanity.org/funding</a></li>
</ul>
<p>Thank you for the work you do in our community. I look forward to hearing from you.</p>
<p style="margin-top:24px;">
  Elizabeth Greene<br>
  Founder, " + PLATFORM_DEFAULTS.orgName + "<br>
  <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}" style="color:#222;">${PLATFORM_DEFAULTS.supportPhone}</a><br>
  <a href={PLATFORM_DEFAULTS.siteUrl} style="color:#222;">www.elevateforhumanity.org</a><br>
  Indianapolis, Indiana
</p>
</td></tr>
<tr><td style="padding-top:24px; border-top:1px solid #ddd; font-size:12px; color:#666;">
  <p style="margin:0;">Elevate for Humanity is a 501(c)(3) nonprofit workforce development institute | DOL Registered Apprenticeship Sponsor | ETPL-Approved Training Provider | Authorized Certiport Testing Center. This email is a one-time partnership inquiry. If you do not wish to be contacted again, simply reply and let us know.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const PARTNERSHIP_TEXT = `Good morning,

My name is Elizabeth Greene. I am the founder of ${PLATFORM_DEFAULTS.orgName}, a 501(c)(3) nonprofit workforce development institute based in Indianapolis.

I am reaching out because your organization serves people who may benefit from funded career training — and I would like to explore a partnership.

WHO WE ARE
${PLATFORM_DEFAULTS.orgName} is a U.S. Department of Labor Registered Apprenticeship sponsor, an ETPL-approved training provider listed with Indiana DWD, and an authorized Certiport testing center. We operate as a career and technical instructional institution providing industry-recognized certifications.

WHAT WE DO
We provide career training programs in healthcare (CNA, Medical Assistant, Phlebotomy), skilled trades (HVAC, Electrical, Welding, Plumbing), CDL trucking (Class A and B), technology (IT Support, Cybersecurity), barbering (DOL Registered Apprenticeship), and tax preparation. Most programs run 4 to 16 weeks and include hands-on training, certification exam preparation, proctored testing on-site, and job placement assistance.

Training is funded through WIOA, the Indiana Workforce Ready Grant, and Job Ready Indy. We handle the eligibility screening and paperwork with WorkOne and DWD — participants pay nothing out of pocket when they qualify.

WHO WE SERVE
Our participants include justice-involved individuals, low-income families, veterans, dislocated workers, and anyone facing barriers to employment. If your clients are looking for a path to stable employment with an industry-recognized credential, we can help.

HOW A PARTNERSHIP WORKS
- Referral pathway: You refer clients who are ready for training. We handle enrollment, funding applications, and placement.
- Resource directory listing: Your organization can be listed on our public resource directory at no cost.
- Employer partnerships: If your organization hires entry-level or skilled workers, we can connect you with trained, certified candidates at no recruitment cost.

WHAT I AM ASKING
I would appreciate 15 minutes of your time to discuss whether a referral partnership or directory listing makes sense for your organization. You can pick a day and time that works for you:

  Schedule a Meeting: ${PLATFORM_DEFAULTS.siteUrl}/schedule-consultation

Learn more:
  Programs: https://${PLATFORM_DEFAULTS.canonicalDomain}/programs
  Partnerships: https://www.${PLATFORM_DEFAULTS.canonicalDomain}/partnerships
  Resource Directory: ${PLATFORM_DEFAULTS.siteUrl}/directory
  Funding Information: https://${PLATFORM_DEFAULTS.canonicalDomain}/funding

Thank you for the work you do in our community. I look forward to hearing from you.

Elizabeth Greene
Founder, Elevate for Humanity
${PLATFORM_DEFAULTS.supportPhone}
www.${PLATFORM_DEFAULTS.canonicalDomain}
Indianapolis, Indiana`;

// Wave definitions
const WAVES: Record<string, string[]> = {
  '1': [
    'info@chipindy.org',
    'gethelp@holyfamilyshelter.net',
    'info@doverecoveryhouse.org',
    'emberwoodcenter@mhai.net',
    'support@webloom.org',
    'info@flannerhouse.org',
    'info@maryrigg.org',
    'info@concordindy.org',
    'info@baci-indy.org',
  ],
  '2': [
    'info@fbgncenter.org',
    'info@christamorehouse.org',
    'info@pourhouse.org',
    'info@unconditionalindy.com',
    'office@westmin.org',
    'info@hopefortomorrowusa.org',
    'Steps.to_life@yahoo.com',
    'info@aclu-in.org',
  ],
  '3': [
    'info@indyccc.org',
    'info@chapelrock.org',
    'info@mustardseedindy.org',
    'youfeedthemmfp@gmail.com',
    'info@svdpindy.org',
    'brightwoodcc@gmail.com',
    'cumbc5815@gmail.com',
    'circlecityrelief@yahoo.com',
    'universityumcap@gmail.com',
    'mbc_952@yahoo.com',
  ],
};

async function sendViaSendGrid(to: string[], subject: string, html: string, text: string) {
  if (!SENDGRID_KEY) {
    return NextResponse.json(
      { error: 'SendGrid API key not configured (SENDGRID_KEY or SENDGRID_API_KEY)' },
      { status: 500 },
    );
  }

  // Send individually (not BCC) so each org gets their own email
  const results: { email: string; status: string; error?: string }[] = [];

  for (const email of to) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: SENDGRID_FROM, name: `Elizabeth Greene — ${PLATFORM_DEFAULTS.orgName}` },
          reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (res.ok || res.status === 202) {
        results.push({ email, status: 'sent' });
      } else {
        const body = await res.text();
        results.push({ email, status: 'failed', error: `${res.status}: ${body}` });
      }
    } catch (err: unknown) {
      results.push({ email, status: 'failed', error: 'Send failed' });
    }

    // Small delay between sends to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  await hydrateProcessEnv();
  // Auth check — only admin can trigger outreach
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Parse request
  const body = await request.json();
  const { wave, test_email } = body;

  const subject = 'Partnership Inquiry — ' + PLATFORM_DEFAULTS.orgName + ' (Workforce Training)';

  // Test mode: send to a single email
  if (test_email) {
    const results = await sendViaSendGrid(
      [test_email],
      subject,
      PARTNERSHIP_HTML,
      PARTNERSHIP_TEXT,
    );
    return NextResponse.json({ mode: 'test', results });
  }

  // Wave mode: send to a predefined wave
  if (!wave || !WAVES[wave]) {
    return NextResponse.json({ error: 'Specify wave (1, 2, or 3) or test_email' }, { status: 400 });
  }

  const recipients = WAVES[wave];
  const results = await sendViaSendGrid(recipients, subject, PARTNERSHIP_HTML, PARTNERSHIP_TEXT);

  const sent = results.filter((r) => r.status === 'sent').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  return NextResponse.json({
    mode: 'wave',
    wave,
    total: recipients.length,
    sent,
    failed,
    results,
  });
}
