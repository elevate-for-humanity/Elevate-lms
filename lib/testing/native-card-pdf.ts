import { PDFDocument, PDFName, PDFRawStream, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export interface NativeCardRecord {
  issuer: string;
  candidate_name: string;
  exam_type: string;
  approvalDate: string;
  certificate_issued_at: string;
  certificate_number: string;
}
export async function nativeCardPdf(record: NativeCardRecord) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit({
    create: (bytes: Uint8Array) => {
      const f = fontkit.create(bytes);
      Object.defineProperty(f, 'cff', {
        value: Boolean((f as unknown as Record<string, unknown>)['CFF ']),
      });
      return f;
    },
  });
  const asset = async (name: string) => {
    for (const root of ['public', '../../public', 'apps/lms/public', 'apps/admin/public']) {
      try {
        return await readFile(path.join(process.cwd(), root, 'fonts', name));
      } catch {
        /* Try the next deployed asset location. */
      }
    }
    throw new Error('Certification font unavailable');
  };
  const font = await pdf.embedFont(new Uint8Array(await asset('Inter-Regular.otf')));
  const bold = await pdf.embedFont(new Uint8Array(await asset('Inter-Bold.otf')));
  const front = pdf.addPage([243, 153]),
    back = pdf.addPage([243, 153]);
  const draw = (s: string, y: number, size = 8, heavy = false) => {
    const face = heavy ? bold : font;
    const fit = Math.min(size, 219 / Math.max(1, face.widthOfTextAtSize(s, 1)));
    front.drawText(s, { x: 12, y, size: fit, font: face, color: rgb(0.08, 0.16, 0.25) });
  };
  draw(record.issuer, 133, 12, true);
  draw('EPA Section 608 Technician Certification', 115, 9, true);
  draw(record.candidate_name, 92, 12, true);
  const labels: Record<string, string> = {
    type_i: 'Type I',
    type_ii: 'Type II',
    type_iii: 'Type III',
    universal: 'Universal',
  };
  const type = labels[record.exam_type];
  if (!type) throw new Error('Invalid certification type');
  draw(`Certification: ${type}`, 73, 10, true);
  draw(`EPA program approval: ${record.approvalDate}`, 55, 7);
  draw(`Issued: ${record.certificate_issued_at.slice(0, 10)}`, 40, 7);
  draw(record.certificate_number, 22, 6);
  const statement = `${record.candidate_name} has successfully passed a ${type} exam on how to responsibly handle refrigerants as required by EPA’s National Recycling and Emissions Reduction Program.`;
  let line = '',
    y = 130;
  for (const word of statement.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, 8) > 219 && line) {
      back.drawText(line, { x: 12, y, size: 8, font });
      y -= 12;
      line = word;
    } else line = candidate;
  }
  if (line) back.drawText(line, { x: 12, y, size: 8, font });
  const url = `https://www.elevateforhumanity.org/credentials/epa/${record.certificate_number}`;
  back.drawText('Verify this credential:', { x: 12, y: 35, size: 7, font });
  back.drawText(url, {
    x: 12,
    y: 20,
    size: Math.min(6, 219 / font.widthOfTextAtSize(url, 1)),
    font,
  });
  await font.embed();
  await bold.embed();
  for (const [, object] of pdf.context.enumerateIndirectObjects()) {
    if (
      object instanceof PDFRawStream &&
      object.dict.get(PDFName.of('Subtype')) === PDFName.of('CIDFontType0C')
    )
      object.dict.set(PDFName.of('Subtype'), PDFName.of('OpenType'));
  }
  return pdf.save();
}
