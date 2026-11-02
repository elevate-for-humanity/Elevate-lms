import { PDFDocument, PDFName, PDFRawStream, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { HostStudentCertificate } from './host-shop-student-records';

export async function hostStudentCertificatePdf(record: HostStudentCertificate) {
  const pdf = await PDFDocument.create();
  // pdf-lib reads `cff`; this fontkit version exposes the OpenType `CFF `
  // table instead. Preserve the correct PDF descendant-font type.
  pdf.registerFontkit({ create: (bytes: Uint8Array) => {
    const font = fontkit.create(bytes);
    Object.defineProperty(font, 'cff', { value: Boolean((font as unknown as Record<string, unknown>)['CFF ']) });
    return font;
  } });
  pdf.setTitle(`${record.title} - ${record.studentName}`);
  pdf.setAuthor('Elevate for Humanity Career & Technical Institute');
  const page = pdf.addPage([792, 612]);
  const asset = async (name: string) => {
    for (const root of ['public', 'apps/lms/public', '../../public']) {
      try { return await readFile(path.join(process.cwd(), root, name)); } catch { /* Try the monorepo or standalone runtime location. */ }
    }
    throw new Error(`Certificate asset missing: ${name}`);
  };
  const bold = await pdf.embedFont(new Uint8Array(await asset('fonts/Inter-Bold.otf')));
  const sans = await pdf.embedFont(new Uint8Array(await asset('fonts/Inter-Regular.otf')));
  const red = rgb(.7, .06, .16), navy = rgb(.05, .13, .24), gray = rgb(.28, .34, .42);
  const center = (text: string, y: number, size: number, font = sans, color = navy) => {
    while (size > 9 && font.widthOfTextAtSize(text, size) > 660) size -= .5;
    page.drawText(text, { x: (792 - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });
  };
  page.drawRectangle({ x: 22, y: 22, width: 748, height: 568, borderColor: navy, borderWidth: 2 });
  page.drawRectangle({ x: 30, y: 30, width: 732, height: 552, borderColor: red, borderWidth: 1 });
  const logo = await pdf.embedPng(new Uint8Array(await asset('logo-small.png')));
  page.drawImage(logo, { x: 64, y: 512, width: 58, height: 58 });
  center('ELEVATE FOR HUMANITY', 539, 21, bold);
  center('CAREER & TECHNICAL INSTITUTE', 517, 11);
  page.drawLine({ start: { x: 280, y: 496 }, end: { x: 512, y: 496 }, color: red, thickness: 3 });
  center(record.title, 452, 34, bold, red);
  center(record.status === 'application' ? 'This acknowledges the application of' : 'This certifies the current student record for', 410, 14, sans, gray);
  center(record.studentName, 357, 34, bold);
  center(record.program, 318, 19, bold);
  center('HOST TRAINING SITE', 272, 10, sans, gray);
  center(record.shopName, 245, 23, bold);
  const status = record.status === 'enrolled' ? 'Enrollment recorded with Elevate for Humanity' : record.status === 'application' ? 'Application received - enrollment and training authorization pending' : 'Host-site placement recorded - enrollment not confirmed';
  center(status, 202, 12, sans, gray);
  const dateValue = record.recordDate && /^\d{4}-\d{2}-\d{2}$/.test(record.recordDate) ? `${record.recordDate}T12:00:00Z` : record.recordDate;
  const date = dateValue ? new Date(dateValue).toLocaleDateString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not recorded';
  center(`Record date: ${date}`, 178, 11, sans, gray);
  center('Issued from Elevate student records', 128, 12, bold);
  center('This document confirms application, enrollment or host-site assignment only.', 101, 10, sans, gray);
  center('It does not certify program completion, licensure, hours or authorization to begin work.', 85, 10, sans, gray);
  center(record.reference, 51, 8, sans, gray);
  await bold.embed();
  await sans.embed();
  // Full OpenType assets include the SFNT wrapper, not a raw CFF program.
  // Declare that stream accurately so Acrobat, browser viewers and printers
  // use the embedded font rather than a viewer-specific substitute.
  for (const [, object] of pdf.context.enumerateIndirectObjects()) {
    if (object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('CIDFontType0C')) {
      object.dict.set(PDFName.of('Subtype'), PDFName.of('OpenType'));
    }
  }
  return pdf.save();
}
