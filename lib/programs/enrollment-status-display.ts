/** A confirmation page reports a record; visiting it never confirms enrollment. */
export function enrollmentStatusDisplay(status?: string | null, startDate?: string | null) {
  const normalized = (status || '').toLowerCase();
  const confirmed = ['active', 'confirmed', 'completed'].includes(normalized);
  const labels: Record<string, string> = { active: 'Active enrollment record', confirmed: 'Confirmed enrollment record', completed: 'Completed', paid: 'Payment received — enrollment review required', approved: 'Approved — complete remaining enrollment steps', pending: 'Pending review', pending_review: 'Pending review', cancelled: 'Cancelled', withdrawn: 'Withdrawn', suspended: 'Suspended' };
  const date = startDate ? new Date(startDate) : null;
  return { confirmed, label: labels[normalized] || 'Enrollment review in progress', startDateLabel: date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-US', {timeZone:'America/New_York',weekday:'long',month:'long',day:'numeric',year:'numeric'}) : 'Admissions will confirm your start date' };
}
