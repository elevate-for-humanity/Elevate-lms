/**
 * Elevate Institutional Email Template
 *
 * All outbound emails use this wrapper for consistent branding.
 * Logo header, clean typography, professional signature block.
 */

import { ORG } from './elevate-document-system';

interface EmailOptions {
  /** Recipient first name for greeting */
  recipientName: string;
  /** Email subject line */
  subject: string;
  /** Body paragraphs — each string becomes a <p> */
  body: string[];
  /** Optional call-to-action button */
  cta?: { label: string; url: string };
  /** Sender name (defaults to org name) */
  senderName?: string;
  /** Sender title */
  senderTitle?: string;
}

export function buildInstitutionalEmail(options: EmailOptions): { subject: string; html: string; text: string } {
  const {
    recipientName,
    subject,
    body,
    cta,
    senderName = ORG.name,
    senderTitle,
  } = options;

  const bodyHtml = body
    .map((p) => `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">${p}</p>`)
    .join('\n      ');

  const ctaHtml = cta
    ? `
      <div style="margin: 24px 0; text-align: left;">
        <a href="${cta.url}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">${cta.label}</a>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header with logo -->
    <div style="background-color: #ffffff; border-radius: 8px 8px 0 0; padding: 24px 32px; border-bottom: 3px solid #1e3a5f;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            <img src="${ORG.logoAbsoluteUrl}" alt="${ORG.name}" width="140" height="42" style="display: block; height: 42px; width: auto;" />
          </td>
          <td style="vertical-align: middle; text-align: right;">
            <span style="font-size: 11px; color: #64748b; line-height: 1.4;">
              ${ORG.tagline}<br />
              ${ORG.website.replace('https://', '')}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">

      <p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">Dear ${recipientName},</p>

      ${bodyHtml}

      ${ctaHtml}

      <!-- Signature -->
      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px; color: #334155; font-weight: 600;">${senderName}</p>
        ${senderTitle ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${senderTitle}</p>` : ''}
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${ORG.name}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${ORG.email} | ${ORG.phone}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${ORG.website.replace('https://', '')}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; border-radius: 0 0 8px 8px; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
        ${ORG.name} | Operated by ${ORG.operator}<br />
        ${ORG.address}<br />
        <a href="${ORG.website}" style="color: #64748b; text-decoration: underline;">${ORG.website.replace('https://', '')}</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  const bodyText = body.join('\n\n');
  const ctaText = cta ? `\n${cta.label}: ${cta.url}\n` : '';
  const text = `Dear ${recipientName},

${bodyText}
${ctaText}
${senderName}${senderTitle ? `\n${senderTitle}` : ''}
${ORG.name}
${ORG.email} | ${ORG.phone}
${ORG.website.replace('https://', '')}`;

  return { subject, html, text };
}
