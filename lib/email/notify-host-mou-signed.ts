import { logger } from '@/lib/logger';
import { generateMOUPdf } from '@/lib/documents/generate-mou-pdf';
import { generateCosmetologyMOUPdf } from '@/lib/documents/generate-cosmetology-mou-pdf';
import { generateNailMOUPdf } from '@/lib/documents/generate-nail-mou-pdf';

const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';

export type HostMouProgram = 'barber' | 'cosmetology' | 'nail_technician';

type NotifyHostMouSignedInput = {
  program: HostMouProgram;
  organizationName: string;
  signerName: string;
  signerTitle?: string;
  contactEmail: string;
  supervisorName?: string;
  supervisorLicense?: string;
  compensationModel?: string;
  compensationRate?: string;
  signatureData: string;
  signedAt: string;
  mouVersion?: string;
};

const PROGRAM_LABELS: Record<HostMouProgram, string> = {
  barber: 'Barber Apprenticeship',
  cosmetology: 'Cosmetology Apprenticeship',
  nail_technician: 'Nail Technician Apprenticeship',
};

async function buildSignedPdf(input: NotifyHostMouSignedInput): Promise<Uint8Array> {
  const common = {
    signer_name: input.signerName,
    signer_title: input.signerTitle ?? 'Owner',
    supervisor_name: input.supervisorName,
    supervisor_license: input.supervisorLicense,
    compensation_model: input.compensationModel,
    compensation_rate: input.compensationRate,
    signed_at: input.signedAt,
    signature_data: input.signatureData,
    mou_version: input.mouVersion,
  };

  if (input.program === 'barber') {
    return generateMOUPdf({ shop_name: input.organizationName, ...common });
  }
  if (input.program === 'nail_technician') {
    return generateNailMOUPdf({ salon_name: input.organizationName, ...common });
  }
  return generateCosmetologyMOUPdf({ salon_name: input.organizationName, ...common });
}

/** Email Elevate a signed host-shop MOU PDF when a partner completes digital signature. */
export async function notifyElevateHostMouSigned(input: NotifyHostMouSignedInput): Promise<void> {
  try {
    const label = PROGRAM_LABELS[input.program];
    const pdfBytes = await buildSignedPdf(input);
    const pdfB64 = Buffer.from(pdfBytes).toString('base64');
    const filename = `Signed-MOU-${input.program}-${input.organizationName.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`;

    await hydrateAndSendWithAttachment({
      to: ELEVATE_COPY,
      subject: `[SIGNED MOU] ${label} — ${input.organizationName} (${input.signerName})`,
      html: `<p style="font-family:Arial,sans-serif;color:#1e293b">
        <strong>${input.signerName}</strong> digitally signed the <strong>${label}</strong> host shop MOU for
        <strong>${input.organizationName}</strong> on ${new Date(input.signedAt).toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })}.
      </p>
      <p style="font-family:Arial,sans-serif;color:#475569">Contact: ${input.contactEmail}</p>
      <p style="font-family:Arial,sans-serif;color:#475569">Signed PDF attached. Activate partner dashboard when ready and send next-steps email.</p>`,
      pdfB64,
      filename,
    });
  } catch (err) {
    logger.warn('[notifyElevateHostMouSigned] failed (non-fatal)', { err });
  }
}

async function hydrateAndSendWithAttachment(opts: {
  to: string;
  subject: string;
  html: string;
  pdfB64: string;
  filename: string;
}) {
  let apiKey = process.env.SENDGRID_API_KEY;
  // Try to hydrate from DB-backed secrets (5-min cache)
  try {
    const { hydrateProcessEnv } = await import('@/lib/secrets');
    await hydrateProcessEnv();
    apiKey = process.env.SENDGRID_API_KEY;
  } catch (err) {
    logger.warn('[notifyElevateHostMouSigned] Failed to hydrate secrets, using env fallback', { err });
  }
  if (!apiKey) {
    logger.warn('[notifyElevateHostMouSigned] SENDGRID_API_KEY missing');
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
      subject: opts.subject,
      content: [{ type: 'text/html', value: opts.html }],
      attachments: [
        {
          content: opts.pdfB64,
          type: 'application/pdf',
          filename: opts.filename,
          disposition: 'attachment',
        },
      ],
    }),
  });

  if (res.status !== 202) {
    logger.warn('[notifyElevateHostMouSigned] SendGrid error', { status: res.status, body: await res.text() });
  }
}
