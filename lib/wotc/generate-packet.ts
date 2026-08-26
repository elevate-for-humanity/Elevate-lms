import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';

export const IRS_8850_ARCHIVE_URL = 'https://www.irs.gov/pub/irs-prior/f8850--2016.pdf';
export const ETA_9061_ARCHIVE_URL = 'https://www.dol.gov/sites/dolgov/files/ETA/advisories/TEGL/2022/TEGL%2022-22/Attachment%20I%20-%20ETA%20Form%209061%20-%20Individual%20Characteristics%20Form.pdf';

export type WotcPacketInput = {
  applicant: { firstName: string; lastName: string; middleInitial?: string; ssnLast4?: string; dateOfBirth?: string; address?: string; city?: string; state?: string; zip?: string; county?: string; phone?: string };
  employer: { name: string; ein?: string; address?: string; city?: string; state?: string; zip?: string; phone?: string; email?: string };
  employment: { offerDate?: string; hireDate?: string; startDate: string; startingWage?: number; position?: string; targetGroups?: string[]; previouslyEmployed?: boolean };
};

function assertHistoricalEligibility(input: WotcPacketInput) {
  const start = new Date(`${input.employment.startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || start.getUTCFullYear() > 2025) {
    throw new Error('Historical WOTC packets are limited to hires who started on or before December 31, 2025.');
  }
}

const date = (value?: string) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
const clipped = (value: unknown, max = 52) => String(value ?? '').slice(0, max);

function text(page: PDFPage, value: unknown, x: number, y: number, size = 8) {
  if (!value) return;
  page.drawText(clipped(value), { x, y, size, color: rgb(0, 0, 0) });
}

function check(page: PDFPage, on: boolean, x: number, y: number) {
  if (on) page.drawText('X', { x, y, size: 10, color: rgb(0, 0, 0) });
}

function historicalStamp(page: PDFPage) {
  page.drawRectangle({ x: 38, y: 2, width: 536, height: 12, color: rgb(1, .94, .78), borderColor: rgb(.72, .45, 0), borderWidth: .7 });
  page.drawText('HISTORICAL DRAFT - COMPLETE SSN, VERIFY ALL FIELDS, AND SIGN BEFORE SUBMISSION', { x: 75, y: 5, size: 6.5, color: rgb(.45, .22, 0) });
}

export async function generateWotcPacket(input: WotcPacketInput): Promise<Uint8Array> {
  assertHistoricalEligibility(input);
  const [irsResponse, etaResponse] = await Promise.all([fetch(IRS_8850_ARCHIVE_URL), fetch(ETA_9061_ARCHIVE_URL)]);
  if (!irsResponse.ok || !etaResponse.ok) throw new Error('Official historical WOTC templates could not be downloaded.');
  const [irs, eta] = await Promise.all([PDFDocument.load(await irsResponse.arrayBuffer()), PDFDocument.load(await etaResponse.arrayBuffer())]);
  const out = await PDFDocument.create();
  const irsPages = await out.copyPages(irs, irs.getPageIndices());
  const etaPages = await out.copyPages(eta, eta.getPageIndices());
  [...irsPages, ...etaPages].forEach((page) => out.addPage(page));
  await out.embedFont(StandardFonts.Helvetica);

  const [p1, p2, e1, e2] = out.getPages();
  historicalStamp(p1); historicalStamp(p2); historicalStamp(e1); historicalStamp(e2);
  const a = input.applicant, employer = input.employer, job = input.employment;
  const name = `${a.firstName} ${a.middleInitial ?? ''} ${a.lastName}`.replace(/\s+/g, ' ').trim();
  const employerAddress = [employer.address, employer.city, employer.state, employer.zip].filter(Boolean).join(', ');
  const applicantAddress = [a.address, a.city, a.state, a.zip].filter(Boolean).join(', ');

  // IRS Form 8850 (Rev. 3-2016). SSN is intentionally never reconstructed from stored hashes.
  text(p1, name, 105, 684, 9); text(p1, a.ssnLast4 ? `XXX-XX-${a.ssnLast4}` : '', 430, 684, 9);
  text(p1, a.address, 125, 656); text(p1, [a.city, a.state, a.zip].filter(Boolean).join(', '), 125, 637);
  text(p1, a.county, 125, 618); text(p1, a.phone, 430, 618); text(p1, date(a.dateOfBirth), 445, 596);
  const groups = new Set(job.targetGroups ?? []);
  check(p1, ['tanf','veteran','vocrehab','snap','exfelon','ssi'].some((g) => groups.has(g)), 71, 497);
  check(p1, groups.has('longterm'), 71, 170);
  text(p2, employer.name, 122, 695, 9); text(p2, employer.phone, 355, 695); text(p2, employer.ein, 490, 695);
  text(p2, employer.address, 122, 671); text(p2, [employer.city, employer.state, employer.zip].filter(Boolean).join(', '), 122, 647);
  text(p2, date(job.offerDate), 115, 494); text(p2, date(job.hireDate), 315, 494); text(p2, date(job.startDate), 475, 494);

  // ETA Form 9061 (Rev. 5-2023), first two data pages.
  text(e1, employer.name, 55, 546); text(e1, `${employerAddress} ${employer.phone ?? ''} ${employer.email ?? ''}`, 230, 546, 7);
  text(e1, employer.ein, 405, 546); text(e1, `${a.lastName}, ${a.firstName} ${a.middleInitial ?? ''}`, 55, 449); text(e1, a.ssnLast4 ? `XXX-XX-${a.ssnLast4}` : '', 230, 449);
  check(e1, job.previouslyEmployed === true, 425, 449); check(e1, job.previouslyEmployed !== true, 484, 449);
  text(e1, date(job.startDate), 55, 359); text(e1, job.startingWage != null ? `$${job.startingWage.toFixed(2)}` : '', 235, 359); text(e1, job.position, 405, 359);
  check(e1, groups.has('tanf'), 293, 306); check(e1, groups.has('veteran'), 293, 217); check(e1, groups.has('exfelon'), 244, 92);
  check(e2, groups.has('drc'), 133, 670); check(e2, groups.has('vocrehab'), 425, 610); check(e2, groups.has('summeryouth'), 400, 568);
  check(e2, groups.has('snap'), 432, 510); check(e2, groups.has('ssi'), 503, 429); check(e2, groups.has('longterm'), 486, 332);
  text(e2, a.dateOfBirth ? `DOB: ${date(a.dateOfBirth)}; address: ${applicantAddress}` : applicantAddress, 78, 250, 7);

  out.setTitle(`Historical WOTC packet - ${name}`);
  out.setSubject('Draft historical Form 8850 and ETA Form 9061 packet; signatures and full SSN required');
  return out.save();
}
