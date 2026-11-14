function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function programHolderWorkOneEmail(input: {
  applicantName: string;
  programTitle: string;
  bookingUrl: string;
}) {
  const firstName = input.applicantName.trim().split(/\s+/)[0] || 'there';
  const title = input.programTitle.trim();
  if (!title) throw new Error('Assigned program title is required.');
  const subject = `${title}: WorkOne booking and status update`;
  const text = `Hi ${firstName},\n\nWe are following up on your ${title} application with Elevate for Humanity.\n\nIf you have not scheduled your WorkOne appointment, book here:\n${input.bookingUrl}\n\nPlease reply with your current status: not scheduled, appointment scheduled (include the date), already attended (include the date and next steps), funding/application pending (include what WorkOne is waiting for), or denied (include the reason given and whether you need help with next steps).\n\nIf you already attended or your application is pending or denied, please still reply so we can update your record.\n\nThank you,\nElevate for Humanity Admissions`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">${text.split('\n\n').map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('')}<p><a href="${escapeHtml(input.bookingUrl)}">Book your WorkOne appointment</a></p></div>`;
  return { subject, text, html };
}
