import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeInternalError } from '@/lib/api/safe-error';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import PDFKit from 'pdfkit';

const SENDGRID_KEY = process.env.SENDGRID_API_KEY!;
const TO_EMAIL = 'Elevate4humanityedu@gmail.com';
const FROM_EMAIL = 'info@elevateforhumanity.org';

// ── W-9 ─────────────────────────────────────────────────────────────────────

async function buildW9(sigPngBytes: Uint8Array): Promise<Uint8Array> {
  const irsRes = await fetch('https://www.irs.gov/pub/irs-pdf/fw9.pdf');
  const irsBytes = await irsRes.arrayBuffer();
  const pdfDoc = await PDFDocument.load(irsBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  form.getTextField('topmostSubform[0].Page1[0].f1_01[0]')
    .setText('2Exclusive LLC-S DBA Elevate for Humanity Career & Technical Institute');
  form.getTextField('topmostSubform[0].Page1[0].f1_02[0]')
    .setText('Elevate for Humanity Career & Technical Institute');
  form.getCheckBox('topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[5]').check();
  form.getTextField('topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_03[0]').setText('S');
  form.getTextField('topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]')
    .setText('8888 Keystone Crossing, Suite 1300');
  form.getTextField('topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]')
    .setText('Indianapolis, IN 46240');
  form.getTextField('topmostSubform[0].Page1[0].f1_14[0]').setText('88');
  form.getTextField('topmostSubform[0].Page1[0].f1_15[0]').setText('2609728');

  // Embed signature image
  const sigImage = await pdfDoc.embedPng(sigPngBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { height } = page.getSize();

  // Signature line is approximately at y=420 from top on the W-9
  page.drawImage(sigImage, {
    x: 52,
    y: height - 480,
    width: 180,
    height: 36,
  });

  // Date next to signature
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  page.drawText(today, {
    x: 420,
    y: height - 472,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  return pdfDoc.save();
}

// ── ACH Form ─────────────────────────────────────────────────────────────────

function buildACH(sigDataUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFKit({ margin: 50, size: 'LETTER' });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 512;
    const DARK = '#1e293b';
    const RED = '#dc2626';
    const GRAY = '#64748b';

    // Header
    doc.rect(50, 45, W, 5).fill(DARK);
    doc.moveDown(1.5);
    doc.fontSize(15).fillColor(DARK).font('Helvetica-Bold').text('APM US Shared Services', { align: 'center' });
    doc.fontSize(13).fillColor(RED).text('VENDOR ACH ENROLLMENT FORM', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(8.5).fillColor(GRAY).font('Helvetica')
      .text('Submit to: apsolutions@apmnet.us with a voided check or bank verification letter.', { align: 'center', width: W });
    doc.moveDown(0.8);
    doc.rect(50, doc.y, W, 1).fill('#e2e8f0');
    doc.moveDown(0.6);

    const section = (title: string) => {
      doc.rect(50, doc.y, W, 18).fill(DARK);
      doc.fontSize(9).fillColor('white').font('Helvetica-Bold').text(title, 56, doc.y - 14);
      doc.moveDown(0.8);
    };

    const field = (label: string, value: string) => {
      doc.fontSize(7.5).fillColor(GRAY).font('Helvetica').text(label, 50, doc.y);
      doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(value || '', 50, doc.y, { width: W });
      doc.rect(50, doc.y + 2, W, 0.5).fill('#cbd5e1');
      doc.moveDown(0.7);
    };

    const fieldRow = (pairs: [string, string][]) => {
      const startY = doc.y;
      const colW = Math.floor(W / pairs.length) - 8;
      let x = 50;
      let maxY = startY;
      for (const [label, value] of pairs) {
        doc.fontSize(7.5).fillColor(GRAY).font('Helvetica').text(label, x, startY);
        doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(value || '', x, doc.y, { width: colW });
        doc.rect(x, doc.y + 2, colW, 0.5).fill('#cbd5e1');
        if (doc.y > maxY) maxY = doc.y;
        x += colW + 8;
        doc.y = startY;
      }
      doc.y = maxY + 14;
    };

    // Payee
    section('PAYEE INFORMATION');
    field('Payee / Vendor Name', '2Exclusive LLC-S DBA Elevate for Humanity Career & Technical Institute');
    fieldRow([['Address', '8888 Keystone Crossing, Suite 1300'], ['City, State, Zip', 'Indianapolis, IN 46240']]);

    // Classification
    doc.fontSize(7.5).fillColor(GRAY).font('Helvetica').text('Business Classification', 50, doc.y);
    doc.moveDown(0.3);
    const classifications = ['Individual/Sole Proprietor', 'Corporation', 'S-Corp', 'Partnership', 'LLC'];
    let cx = 50;
    for (const c of classifications) {
      const checked = c === 'S-Corp';
      doc.rect(cx, doc.y, 9, 9).stroke(DARK);
      if (checked) doc.fontSize(9).fillColor(RED).font('Helvetica-Bold').text('X', cx + 1.5, doc.y - 1);
      doc.fontSize(8).fillColor(DARK).font('Helvetica').text(c, cx + 12, doc.y - 1);
      cx += 90;
    }
    doc.moveDown(1);

    field('Taxpayer ID No. (EIN)', '88-2609728');
    field('E-mail to Receive Remittance Advice (required)', 'info@elevateforhumanity.org');
    doc.fontSize(8.5).fillColor(DARK).font('Helvetica-Bold').text('Primary Contact:');
    doc.moveDown(0.2);
    fieldRow([['Name', 'Elizabeth Greene'], ['E-mail', 'info@elevateforhumanity.org'], ['Phone', '(317) 314-3757']]);

    // Banking
    section('BANKING INFORMATION');
    doc.rect(50, doc.y, 9, 9).stroke(DARK);
    doc.fontSize(9).fillColor(RED).font('Helvetica-Bold').text('X', 51.5, doc.y - 1);
    doc.fontSize(9).fillColor(DARK).font('Helvetica').text('New Enrollment', 63, doc.y - 1);
    doc.moveDown(1);
    field('Bank Name', 'Sunrise Banks');
    fieldRow([['Address', '200 University Ave W'], ['City, State, Zip', 'Saint Paul, MN 55103']]);
    field('Name (as it appears on bank account)', '2Exclusive LLC-S DBA Elevate for Humanity');
    fieldRow([['9-Digit ABA Routing Number', '091017138'], ['Bank Account Number', '692101663981']]);

    // Authorization
    section('AUTHORIZATION');
    doc.fontSize(8.5).fillColor(DARK).font('Helvetica')
      .text('I authorize APM US Shared Services and its affiliates to deposit payments directly to the bank account indicated above and to correct any errors which may occur. I also authorize the financial institution named above to post these transactions to that account. This authorization will remain in force until APM US Shared Services receives written notice of cancellation.', { width: W });

    doc.moveDown(1);
    fieldRow([['Full Name', 'Elizabeth Greene'], ['Title', 'Founder & Chief Executive Officer']]);

    // Signature image
    doc.moveDown(0.5);
    doc.fontSize(7.5).fillColor(GRAY).font('Helvetica').text('Signature', 50, doc.y);
    doc.moveDown(0.3);

    // Strip data URL prefix and embed
    const base64 = sigDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const sigBuf = Buffer.from(base64, 'base64');
    doc.image(sigBuf, 50, doc.y, { width: 160, height: 40 });
    doc.moveDown(3);

    // Date
    const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    fieldRow([['Date', today], ['', '']]);

    // Footer
    doc.moveDown(1);
    doc.rect(50, doc.y, W, 1).fill('#e2e8f0');
    doc.moveDown(0.5);
    doc.fontSize(7.5).fillColor(GRAY).font('Helvetica')
      .text('Elevate for Humanity Career & Technical Institute  |  8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240  |  (317) 314-3757', { align: 'center', width: W });

    doc.end();
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { signatureDataUrl, documents } = await request.json() as {
      signatureDataUrl: string;
      documents: string[];
    };

    if (!signatureDataUrl || !documents?.length) {
      return NextResponse.json({ error: 'Missing signature or documents' }, { status: 400 });
    }

    // Convert data URL to PNG bytes for pdf-lib
    const base64 = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const sigPngBytes = Uint8Array.from(Buffer.from(base64, 'base64'));

    const attachments: { content: string; filename: string; type: string; disposition: string }[] = [];
    const docLabels: string[] = [];

    if (documents.includes('w9')) {
      const w9Bytes = await buildW9(sigPngBytes);
      attachments.push({
        content: Buffer.from(w9Bytes).toString('base64'),
        filename: 'Elevate-W9-Signed-2026.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      });
      docLabels.push('IRS Form W-9');
    }

    if (documents.includes('ach')) {
      const achBuf = await buildACH(signatureDataUrl);
      attachments.push({
        content: achBuf.toString('base64'),
        filename: 'Elevate-APM-ACH-Enrollment-Signed.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      });
      docLabels.push('APM ACH Enrollment Form');
    }

    const body = {
      personalizations: [{ to: [{ email: TO_EMAIL, name: 'Elizabeth Greene' }] }],
      from: { email: FROM_EMAIL, name: 'Elevate for Humanity' },
      reply_to: { email: FROM_EMAIL },
      subject: `Signed Documents — ${docLabels.join(' + ')}`,
      content: [{
        type: 'text/html',
        value: `<div style="font-family:Arial,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
          <img src="https://elevateforhumanity.org/logo.jpg" alt="Elevate for Humanity" style="height:50px;margin-bottom:20px;"/><br/>
          <p>Elizabeth,</p>
          <p>Your signed documents are attached:</p>
          <ul>${docLabels.map(l => `<li><strong>${l}</strong></li>`).join('')}</ul>
          <p style="color:#dc2626;font-weight:bold;">
            ${documents.includes('ach') ? 'ACH form: email to apsolutions@apmnet.us with a voided check.<br/>' : ''}
            ${documents.includes('w9') ? 'W-9: submit to the requesting party.' : ''}
          </p>
          <p style="font-size:12px;color:#64748b;">Signed on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>`,
      }],
      attachments,
    };

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (sgRes.status !== 202) {
      const err = await sgRes.text();
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      message: `Signed ${docLabels.join(' and ')} sent to ${TO_EMAIL}`,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to sign and send documents');
  }
}
