/**
 * WorkOne Attachment C program cost snapshots.
 * Each amount comes from a previously prepared provider FAA, not a funding
 * approval. Never read costs or funding authority from a student's browser.
 * Update through reviewed program-policy changes only.
 */
export const FAA_PROGRAMS = Object.freeze({
  hvac: Object.freeze({
    label: 'HVAC / EPA 608 Universal Certification',
    weeks: 6,
    source: 'Brian Boyd revised provider FAA, October 27, 2026',
    costs: Object.freeze({
      registration: 15000, tuition: 325000, books: 100500, lab: 50000,
      physicals: 0, licenses: 9500, parking: 0, activity: 0,
      transportation: 0, childcare: 0, other1: 0, other2: 0
    })
  }),
  bookkeeping: Object.freeze({
    label: 'Bookkeeping, Accounting, and Auditing Clerk',
    weeks: 8,
    source: 'Kimberly Pritchett provider FAA, revised eight-week schedule November 2026',
    costs: Object.freeze({
      registration: 5000, tuition: 460000, books: 27500, lab: 0,
      physicals: 0, licenses: 0, parking: 0, activity: 0,
      transportation: 0, childcare: 0, other1: 0, other2: 0
    })
  })
});
export const FAA_COST_ROWS = Object.freeze([
  ['registration','Application/Registration'], ['tuition','Tuition'],
  ['books','Books/Supplies'], ['lab','Shop/Clinic/Lab Fees/Uniforms'],
  ['physicals','Physicals'], ['licenses','Licenses/Permits'],
  ['parking','Parking Fees'], ['activity','Student Activity Fees'],
  ['transportation','Transportation'], ['childcare','Child Care Cost'],
  ['other1','Other Required Cost (specify)'],
  ['other2','Other Required Cost (specify)']
]);
export function faaTotalCents(program) {
  if (!program || !program.costs) throw Error('FAA_PROGRAM_REQUIRED');
  const values=Object.values(program.costs);
  if (values.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('FAA_COST_INVALID');
  return values.reduce((s,v)=>s+v,0);
}
export function faaEndDate(startDate,weeks) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate))throw Error('FAA_START_DATE_INVALID');
  if (!Number.isSafeInteger(weeks)||weeks<1||weeks>52)throw Error('FAA_WEEKS_INVALID');
  const d=new Date(startDate+'T12:00:00Z');
  if (Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==startDate)throw Error('FAA_START_DATE_INVALID');
  d.setUTCDate(d.getUTCDate()+weeks*7);
  return d.toISOString().slice(0,10);
}
