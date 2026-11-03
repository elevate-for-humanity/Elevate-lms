// pre-auth-registry: exempt - authenticated holder ownership is checked before accepting tax information.
import { randomUUID, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  w9Schema,
  W9_CERTIFICATION,
  W9_CERTIFICATION_INSTRUCTIONS,
} from '@/lib/program-holder/w9-form';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const ctx = await requireProgramHolder({ allowPendingApproval: true });
  if (ctx.mode !== 'holder')
    return NextResponse.json(
      { error: 'Complete this form from your own partner account.' },
      { status: 403 },
    );
  const parsed = w9Schema.safeParse(await request.json().catch(() => null));
  // Never echo submitted tax data or validation input in an error response.
  if (!parsed.success)
    return NextResponse.json(
      {
        error: 'Check your required W-9 fields, nine-digit TIN, tax classification and signature.',
      },
      { status: 400 },
    );
  const values = parsed.data;
  const { data: bucket, error: bucketError } = await ctx.db.storage.getBucket('provider-documents');
  if (bucketError || !bucket || bucket.public !== false)
    return NextResponse.json(
      { error: 'Private document storage is unavailable. Please retry later.' },
      { status: 503 },
    );
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  pdf.setFontSize(17);
  pdf.text('Substitute Form W-9', 15, 20);
  pdf.setFontSize(10);
  let y = 30;
  const line = (text: string) => {
    for (const part of pdf.splitTextToSize(text, 178)) {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(part, 15, y);
      y += 5;
    }
    y += 3;
  };
  line(
    'Request for Taxpayer Identification Number and Certification. Based on IRS Form W-9 (Rev. March 2024). Give to requester; do not send to the IRS.',
  );
  for (const [label, value] of [
    ['1. Name of entity/individual', values.legalName],
    ['2. Business/disregarded entity name', values.businessName],
    [
      '3a. Federal tax classification',
      values.classification +
        (values.classification === 'llc'
          ? ': ' + values.llcClass
          : values.classification === 'other'
            ? ': ' + values.otherClass
            : ''),
    ],
    [
      '3b. Foreign partners/owners/beneficiaries (when applicable)',
      values.foreignOwners ? 'Checked' : 'Not checked',
    ],
    ['4. Exempt payee code', values.exemptPayee],
    ['4. FATCA exemption code', values.fatca],
    ['5. Address', values.address],
    ['6. City, state and ZIP', values.cityStateZip],
    ['7. Account numbers (optional)', values.accounts],
    ['Requester', 'Elevate for Humanity'],
    [
      'Part I. ' +
        (values.tinType === 'ein' ? 'Employer identification number' : 'Social security number'),
      values.tin,
    ],
  ])
    line(label + ': ' + value);
  line('Part II. Certification');
  for (const [index, certification] of W9_CERTIFICATION.entries()) {
    if (index === 2 && values.backupWithholding) {
      line('[ITEM 2 CROSSED OUT BY PAYEE - CURRENTLY SUBJECT TO BACKUP WITHHOLDING]');
      const start = y;
      const wrapped: string[] = pdf.splitTextToSize(certification, 178);
      for (const part of wrapped) {
        if (y > 275) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(part, 15, y);
        pdf.line(15, y - 1, 193, y - 1);
        y += 5;
      }
      if (y === start) y += 5;
      y += 3;
    } else line(certification);
  }
  line(W9_CERTIFICATION_INSTRUCTIONS);
  const now = new Date().toISOString();
  line('Electronic signature of U.S. person / authorized signer: ' + values.signature);
  line('Signed at: ' + now);
  line('Authenticated submitting account: ' + ctx.user.id);
  line('Full IRS instructions: https://www.irs.gov/pub/irs-pdf/fw9.pdf');
  const bytes = new Uint8Array(pdf.output('arraybuffer'));
  const path = `program-holders/${ctx.holderId}/w9/${randomUUID()}.pdf`;
  const upload = await ctx.db.storage
    .from('provider-documents')
    .upload(path, bytes, { contentType: 'application/pdf', upsert: false });
  if (upload.error)
    return NextResponse.json(
      { error: 'Your W-9 could not be saved. Please retry.' },
      { status: 503 },
    );
  const result = await ctx.db
    .from('program_holder_documents')
    .insert({
      user_id: ctx.user.id,
      document_type: 'w9',
      file_name: 'signed-w9.pdf',
      file_url: path,
      storage_bucket: 'provider-documents',
      file_size: bytes.length,
      mime_type: 'application/pdf',
      uploaded_by: ctx.user.id,
      uploaded_at: now,
      updated_at: now,
      status: 'pending',
      approved: false,
      description: JSON.stringify({
        kind: 'electronic_w9',
        version: 'irs-w9-2024-03',
        signed_at: now,
        signed_by: ctx.user.id,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        user_agent: request.headers.get('user-agent')?.slice(0, 500) || '',
      }),
    })
    .select('id')
    .single();
  if (result.error) {
    await ctx.db.storage.from('provider-documents').remove([path]);
    return NextResponse.json(
      { error: 'Your W-9 record could not be saved. Please retry.' },
      { status: 503 },
    );
  }
  return NextResponse.json(
    {
      id: result.data.id,
      message: 'Signed W-9 saved in your dashboard for review.',
      downloadUrl: `/api/program-holder/documents/${result.data.id}/download`,
    },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
