/** Server catalog and paid invoice evidence only; never trust the client's paid flag. */
export function requiresSelfPayProgramPayment(program, funding) {
  if (!program?.id || !program?.slug) throw new Error('Program payment metadata unavailable.');
  if (program.is_free === true) return false;
  const apprenticeship = program.is_apprenticeship === true || /apprentice/i.test(program.slug);
  const agency = ['workone', 'wioa', 'wrg', 'grant', 'employer'].includes(String(funding || '').trim().toLowerCase());
  return apprenticeship || !agency;
}
export function paidInvoiceMatchesProgram(invoice, program, email) {
  if (!invoice || invoice.status !== 'paid' || !(Number(invoice.total_cents) > 0)) return false;
  if (!['program_enrollment', 'apprenticeship_deposit'].includes(invoice.fulfillment_type)) return false;
  if (invoice.fulfillment_type === 'apprenticeship_deposit' &&
      !(program.is_apprenticeship === true || /apprentice/i.test(program.slug))) return false;
  const payload = invoice.fulfillment_payload || {};
  const slug = String(payload.program_slug || '').trim().toLowerCase();
  const id = String(payload.program_id || '');
  if ((!slug && !id) || (slug && slug !== program.slug) || (id && id !== program.id)) return false;
  const normalize = value => String(value || '').trim().toLowerCase();
  return Boolean(normalize(email)) && normalize(invoice.customer_email) === normalize(email);
}
