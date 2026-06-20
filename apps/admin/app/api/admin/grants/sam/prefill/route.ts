import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import PDFDocument from 'pdfkit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GrantPayload = {
  opportunityId?: string;
  title?: string;
  agency?: string;
  closeDate?: string | null;
  awardFloor?: number | string | null;
  awardCeiling?: number | string | null;
  description?: string;
  url?: string | null;
};

type PrefillPayload = {
  grant: GrantPayload;
  organization?: {
    legalName?: string;
    uei?: string;
    duns?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  project?: {
    title?: string;
    summary?: string;
    populationServed?: string;
    budgetAmount?: string;
    timeline?: string;
  };
  output?: {
    createDocx?: boolean;
    createPdf?: boolean;
    emailTo?: string;
  };
};

function cleanName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toDisplay(value: unknown, fallback = 'Not provided') {
  const s = String(value ?? '').trim();
  return s || fallback;
}

function buildPrefillText(payload: PrefillPayload) {
  const grant = payload.grant || {};
  const org = payload.organization || {};
  const project = payload.project || {};

  return {
    grantTitle: toDisplay(grant.title),
    opportunityId: toDisplay(grant.opportunityId),
    agency: toDisplay(grant.agency),
    closeDate: toDisplay(grant.closeDate),
    awardFloor: toDisplay(grant.awardFloor),
    awardCeiling: toDisplay(grant.awardCeiling),
    grantUrl: toDisplay(grant.url),
    grantDescription: toDisplay(grant.description),
    legalName: toDisplay(org.legalName, PLATFORM_DEFAULTS.orgName),
    uei: toDisplay(org.uei),
    duns: toDisplay(org.duns),
    contactName: toDisplay(org.contactName),
    contactEmail: toDisplay(org.contactEmail),
    contactPhone: toDisplay(org.contactPhone),
    address: toDisplay(org.address),
    cityStateZip: `${toDisplay(org.city, '')}${org.state ? `, ${org.state}` : ''}${org.zip ? ` ${org.zip}` : ''}`.trim() || 'Not provided',
    projectTitle: toDisplay(project.title, `Application for ${toDisplay(grant.title, 'Grant Opportunity')}`),
    projectSummary: toDisplay(project.summary, 'Auto-prefilled from SAM.gov feed. Please customize before submission.'),
    populationServed: toDisplay(project.populationServed),
    budgetAmount: toDisplay(project.budgetAmount),
    timeline: toDisplay(project.timeline),
  };
}

async function buildDocxBuffer(prefill: ReturnType<typeof buildPrefillText>) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun('SAM.gov Grant Prefill Package')],
          }),
          new Paragraph({ children: [new TextRun(`Generated: ${new Date().toISOString()}`)] }),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Grant Opportunity')] }),
          new Paragraph(`Title: ${prefill.grantTitle}`),
          new Paragraph(`Opportunity ID: ${prefill.opportunityId}`),
          new Paragraph(`Agency: ${prefill.agency}`),
          new Paragraph(`Close Date: ${prefill.closeDate}`),
          new Paragraph(`Award Floor: ${prefill.awardFloor}`),
          new Paragraph(`Award Ceiling: ${prefill.awardCeiling}`),
          new Paragraph(`Opportunity URL: ${prefill.grantUrl}`),
          new Paragraph(`Description: ${prefill.grantDescription}`),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Applicant Organization')] }),
          new Paragraph(`Legal Name: ${prefill.legalName}`),
          new Paragraph(`UEI: ${prefill.uei}`),
          new Paragraph(`DUNS: ${prefill.duns}`),
          new Paragraph(`Contact Name: ${prefill.contactName}`),
          new Paragraph(`Contact Email: ${prefill.contactEmail}`),
          new Paragraph(`Contact Phone: ${prefill.contactPhone}`),
          new Paragraph(`Address: ${prefill.address}`),
          new Paragraph(`City/State/Zip: ${prefill.cityStateZip}`),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Project Narrative Draft')] }),
          new Paragraph(`Project Title: ${prefill.projectTitle}`),
          new Paragraph(`Summary: ${prefill.projectSummary}`),
          new Paragraph(`Population Served: ${prefill.populationServed}`),
          new Paragraph(`Budget Amount: ${prefill.budgetAmount}`),
          new Paragraph(`Timeline: ${prefill.timeline}`),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

async function buildPdfBuffer(prefill: ReturnType<typeof buildPrefillText>) {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pdf = new PDFDocument({ margin: 48 });
    pdf.on('data', (c) => chunks.push(c));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    pdf.fontSize(18).text('SAM.gov Grant Prefill Package');
    pdf.moveDown(0.5);
    pdf.fontSize(10).fillColor('#555').text(`Generated: ${new Date().toISOString()}`);
    pdf.fillColor('#111');
    pdf.moveDown(1);

    const section = (title: string, lines: string[]) => {
      pdf.fontSize(13).text(title);
      pdf.moveDown(0.3);
      pdf.fontSize(10);
      for (const line of lines) pdf.text(line);
      pdf.moveDown(0.8);
    };

    section('Grant Opportunity', [
      `Title: ${prefill.grantTitle}`,
      `Opportunity ID: ${prefill.opportunityId}`,
      `Agency: ${prefill.agency}`,
      `Close Date: ${prefill.closeDate}`,
      `Award Floor: ${prefill.awardFloor}`,
      `Award Ceiling: ${prefill.awardCeiling}`,
      `Opportunity URL: ${prefill.grantUrl}`,
      `Description: ${prefill.grantDescription}`,
    ]);

    section('Applicant Organization', [
      `Legal Name: ${prefill.legalName}`,
      `UEI: ${prefill.uei}`,
      `DUNS: ${prefill.duns}`,
      `Contact Name: ${prefill.contactName}`,
      `Contact Email: ${prefill.contactEmail}`,
      `Contact Phone: ${prefill.contactPhone}`,
      `Address: ${prefill.address}`,
      `City/State/Zip: ${prefill.cityStateZip}`,
    ]);

    section('Project Narrative Draft', [
      `Project Title: ${prefill.projectTitle}`,
      `Summary: ${prefill.projectSummary}`,
      `Population Served: ${prefill.populationServed}`,
      `Budget Amount: ${prefill.budgetAmount}`,
      `Timeline: ${prefill.timeline}`,
    ]);

    pdf.end();
  });
}

async function writeAudit(db: Awaited<ReturnType<typeof requireAdminClient>>, userId: string, action: string, metadata: Record<string, unknown>) {
  await db.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: 'grants.sam',
    resource_id: String(metadata.opportunityId || ''),
    metadata,
    created_at: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json().catch(() => null)) as PrefillPayload | null;
    if (!body?.grant?.title) {
      return safeError('grant.title is required', 400);
    }

    const output = body.output || {};
    const createDocx = output.createDocx !== false;
    const createPdf = output.createPdf !== false;
    const prefill = buildPrefillText(body);

    const db = await requireAdminClient();
    const storage = db.storage.from('documents');

    const now = Date.now();
    const slug = cleanName(`${prefill.opportunityId || 'grant'}-${prefill.grantTitle}`);
    const basePath = `grants/sam-prefill/${slug || 'grant'}-${now}`;

    const outputs: Array<{ type: string; path: string; signedUrl: string | null; bytes: number }> = [];

    if (createDocx) {
      const docxBuffer = await buildDocxBuffer(prefill);
      const docxPath = `${basePath}.docx`;
      const up = await storage.upload(docxPath, docxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });
      if (up.error) return safeInternalError(up.error, 'Failed to upload DOCX');

      const signed = await storage.createSignedUrl(docxPath, 60 * 60 * 24 * 7);
      outputs.push({
        type: 'docx',
        path: docxPath,
        signedUrl: signed.data?.signedUrl ?? null,
        bytes: docxBuffer.length,
      });

      await db.from('documents').insert({
        user_id: auth.id,
        title: `${prefill.projectTitle} (SAM prefill DOCX)`,
        file_name: `${slug || 'sam-grant'}-prefill.docx`,
        document_type: 'grant_prefill_docx',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_path: docxPath,
        file_url: signed.data?.signedUrl || null,
        file_size: docxBuffer.length,
        file_size_bytes: docxBuffer.length,
        status: 'active',
      });
    }

    if (createPdf) {
      const pdfBuffer = await buildPdfBuffer(prefill);
      const pdfPath = `${basePath}.pdf`;
      const up = await storage.upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (up.error) return safeInternalError(up.error, 'Failed to upload PDF');

      const signed = await storage.createSignedUrl(pdfPath, 60 * 60 * 24 * 7);
      outputs.push({
        type: 'pdf',
        path: pdfPath,
        signedUrl: signed.data?.signedUrl ?? null,
        bytes: pdfBuffer.length,
      });

      await db.from('documents').insert({
        user_id: auth.id,
        title: `${prefill.projectTitle} (SAM prefill PDF)`,
        file_name: `${slug || 'sam-grant'}-prefill.pdf`,
        document_type: 'grant_prefill_pdf',
        mime_type: 'application/pdf',
        file_path: pdfPath,
        file_url: signed.data?.signedUrl || null,
        file_size: pdfBuffer.length,
        file_size_bytes: pdfBuffer.length,
        status: 'active',
      });
    }

    if (output.emailTo) {
      const linksHtml = outputs
        .map((o) => `<li><a href="${o.signedUrl || '#'}">${o.type.toUpperCase()} package</a></li>`)
        .join('');

      await sendEmail({
        to: output.emailTo,
        subject: `SAM Prefill Package: ${prefill.grantTitle}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.4">
            <h2>SAM Grant Prefill Package Ready</h2>
            <p><strong>Grant:</strong> ${prefill.grantTitle}</p>
            <p><strong>Opportunity ID:</strong> ${prefill.opportunityId}</p>
            <p><strong>Agency:</strong> ${prefill.agency}</p>
            <ul>${linksHtml}</ul>
            <p>Generated automatically from your SAM.gov feed in the Elevate admin dashboard.</p>
          </div>
        `,
      });
    }

    await writeAudit(db, auth.id, 'grants.sam.prefill.generated', {
      opportunityId: prefill.opportunityId,
      title: prefill.grantTitle,
      generatedCount: outputs.length,
      emailedTo: output.emailTo || null,
    });

    return NextResponse.json({
      ok: true,
      prefill,
      files: outputs,
      emailedTo: output.emailTo || null,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to generate grant prefill package');
  }
}