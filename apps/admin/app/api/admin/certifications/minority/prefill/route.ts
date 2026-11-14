import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import PDFDocument from 'pdfkit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MinorityPayload = {
  businessName?: string;
  ownerName?: string;
  ownerEthnicity?: string;
  ownerGender?: string;
  ownershipPercent?: string;
  taxId?: string;
  uei?: string;
  naicsCodes?: string;
  businessAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  certifyingAgency?: string;
  businessNarrative?: string;
  emailTo?: string;
};

function txt(v: unknown, fallback = 'Not provided') {
  const s = String(v ?? '').trim();
  return s || fallback;
}

function slug(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function makeDocx(data: MinorityPayload) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun('Minority Certification Application Draft')],
          }),
          new Paragraph(`Generated: ${new Date().toISOString()}`),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Business Profile')] }),
          new Paragraph(`Business Name: ${txt(data.businessName)}`),
          new Paragraph(`Owner Name: ${txt(data.ownerName)}`),
          new Paragraph(`Owner Ethnicity: ${txt(data.ownerEthnicity)}`),
          new Paragraph(`Owner Gender: ${txt(data.ownerGender)}`),
          new Paragraph(`Ownership Percent: ${txt(data.ownershipPercent)}`),
          new Paragraph(`Tax ID / EIN: ${txt(data.taxId)}`),
          new Paragraph(`UEI: ${txt(data.uei)}`),
          new Paragraph(`NAICS Codes: ${txt(data.naicsCodes)}`),
          new Paragraph(`Address: ${txt(data.businessAddress)}`),
          new Paragraph(`Contact Email: ${txt(data.contactEmail)}`),
          new Paragraph(`Contact Phone: ${txt(data.contactPhone)}`),
          new Paragraph(`Certifying Agency: ${txt(data.certifyingAgency, 'Indiana IOT / MWBE Office')}`),
          new Paragraph({ children: [new TextRun('')] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Business Narrative')] }),
          new Paragraph(txt(data.businessNarrative, 'Auto-generated draft. Update with your business history and qualifying minority ownership details.')),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

async function makePdf(data: MinorityPayload) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pdf = new PDFDocument({ margin: 48 });
    pdf.on('data', (c) => chunks.push(c));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    pdf.fontSize(18).text('Minority Certification Application Draft');
    pdf.moveDown(0.4);
    pdf.fontSize(10).fillColor('#555').text(`Generated: ${new Date().toISOString()}`);
    pdf.fillColor('#111');
    pdf.moveDown(0.8);

    const line = (label: string, value: unknown) => {
      pdf.fontSize(10).text(`${label}: ${txt(value)}`);
    };

    line('Business Name', data.businessName);
    line('Owner Name', data.ownerName);
    line('Owner Ethnicity', data.ownerEthnicity);
    line('Owner Gender', data.ownerGender);
    line('Ownership Percent', data.ownershipPercent);
    line('Tax ID / EIN', data.taxId);
    line('UEI', data.uei);
    line('NAICS Codes', data.naicsCodes);
    line('Address', data.businessAddress);
    line('Contact Email', data.contactEmail);
    line('Contact Phone', data.contactPhone);
    line('Certifying Agency', data.certifyingAgency || 'Indiana IOT / MWBE Office');

    pdf.moveDown(1);
    pdf.fontSize(12).text('Business Narrative');
    pdf.moveDown(0.4);
    pdf
      .fontSize(10)
      .text(
        txt(
          data.businessNarrative,
          'Auto-generated draft. Update with your business history and qualifying minority ownership details.',
        ),
      );

    pdf.end();
  });
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('audit_logs')
      .select('id, action, resource_id, metadata, created_at')
      .ilike('action', 'certifications.minority.%')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) return safeInternalError(error, 'Failed to load minority certification timeline');
    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Failed to load minority certification timeline');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json().catch(() => null)) as MinorityPayload | null;
    if (!body?.businessName) return safeError('businessName is required', 400);

    const db = await requireAdminClient();
    const storage = db.storage.from('documents');
    const now = Date.now();
    const base = `certifications/minority/${slug(body.businessName)}-${now}`;

    const docx = await makeDocx(body);
    const pdf = await makePdf(body);

    const docxPath = `${base}.docx`;
    const pdfPath = `${base}.pdf`;

    const docxUp = await storage.upload(docxPath, docx, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true,
    });
    if (docxUp.error) return safeInternalError(docxUp.error, 'Failed to upload DOCX');

    const pdfUp = await storage.upload(pdfPath, pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (pdfUp.error) return safeInternalError(pdfUp.error, 'Failed to upload PDF');

    const [docxSigned, pdfSigned] = await Promise.all([
      storage.createSignedUrl(docxPath, 60 * 60 * 24 * 7),
      storage.createSignedUrl(pdfPath, 60 * 60 * 24 * 7),
    ]);

    await db.from('documents').insert([
      {
        user_id: auth.id,
        title: `${body.businessName} Minority Certification Draft (DOCX)`,
        file_name: `${slug(body.businessName)}-minority-certification.docx`,
        document_type: 'minority_certification_docx',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_path: docxPath,
        file_url: docxSigned.data?.signedUrl || null,
        file_size: docx.length,
        file_size_bytes: docx.length,
        status: 'active',
      },
      {
        user_id: auth.id,
        title: `${body.businessName} Minority Certification Draft (PDF)`,
        file_name: `${slug(body.businessName)}-minority-certification.pdf`,
        document_type: 'minority_certification_pdf',
        mime_type: 'application/pdf',
        file_path: pdfPath,
        file_url: pdfSigned.data?.signedUrl || null,
        file_size: pdf.length,
        file_size_bytes: pdf.length,
        status: 'active',
      },
    ]);

    if (body.emailTo) {
      await sendEmail({
        to: body.emailTo,
        subject: `Minority Certification Draft: ${body.businessName}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.4">
            <h2>Minority Certification Draft Ready</h2>
            <p><strong>Business:</strong> ${txt(body.businessName)}</p>
            <ul>
              <li><a href="${docxSigned.data?.signedUrl || '#'}">DOCX Draft</a></li>
              <li><a href="${pdfSigned.data?.signedUrl || '#'}">PDF Draft</a></li>
            </ul>
          </div>
        `,
      });
    }

    await db.from('audit_logs').insert({
      user_id: auth.id,
      action: 'certifications.minority.prefill.generated',
      resource_type: 'certifications.minority',
      resource_id: body.businessName,
      metadata: {
        businessName: body.businessName,
        emailedTo: body.emailTo || null,
        docxPath,
        pdfPath,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      files: [
        { type: 'docx', signedUrl: docxSigned.data?.signedUrl || null },
        { type: 'pdf', signedUrl: pdfSigned.data?.signedUrl || null },
      ],
      emailedTo: body.emailTo || null,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to generate minority certification draft');
  }
}