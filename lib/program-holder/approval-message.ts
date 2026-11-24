type ApprovalMessageInput = {
  organizationName: string;
  contactName: string;
  email: string;
  accountRole: 'program_holder' | 'site_coordinator';
  programSlugs: string[];
  accessUrl: string;
  portalUrl: string;
  isNewUser: boolean;
  requiresRecovery?: boolean;
  alreadySigned: boolean;
  supportPhone: string;
};

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export function isGaryRegionalCoordinator(data: Record<string, unknown>): boolean {
  return /site coordinator/i.test(String(data.approved_role || '')) &&
    /\bgary\b/i.test(`${data.approved_role || ''} ${data.regional_assignment || ''}`);
}

/** Generic approvals must not inherit another region's role or compensation. */
export function buildProgramHolderApprovalMessage(input: ApprovalMessageInput) {
  const role = input.accountRole === 'site_coordinator' ? 'Site Coordinator' : 'Program Holder';
  const accessLabel = input.requiresRecovery ? 'Request Password Setup Link' : input.isNewUser ? 'Set Password & Continue Onboarding' : 'Secure Sign In & Continue Onboarding';
  const programs = input.programSlugs.length
    ? `<p><strong>Approved program scope:</strong> ${input.programSlugs.map(escapeHtml).join(', ')}. Your dashboard is limited to the programs assigned to your organization.</p>`
    : '<p>Your specific program assignments will be confirmed during onboarding.</p>';
  return {
    subject: `Approved: ${role} — Dashboard Access & Required Onboarding | Elevate for Humanity`,
    html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#0f172a;line-height:1.55"><h2>Your ${role} application is approved</h2><p>Hello ${escapeHtml(input.contactName)},</p><p><strong>${escapeHtml(input.organizationName)}</strong> has been approved for ${role} onboarding.</p>${programs}<p><strong>Account email:</strong> ${escapeHtml(input.email)}</p><p><a href="${escapeHtml(input.accessUrl)}">${accessLabel}</a></p>${input.requiresRecovery ? '<p>Use the account email above to request a secure password setup email before your first sign-in.</p>' : ''}<h3>Required onboarding</h3><ol>${input.alreadySigned ? '' : '<li>Review and sign your applicable Program Holder or Site Coordinator agreement.</li>'}<li>Complete the required organization, instructor, worksite, tax, and payment-record documentation through the secure portal.</li><li>Confirm the approved training scope, participant assignments, supervision, attendance, reporting, and completion requirements before beginning operations.</li><li>Use your dashboard to maintain the records and progress reports required for each assigned participant.</li></ol><h3>Compensation</h3><p>Your applicable written agreement governs the per-student payment calculation, eligible revenue, required milestones, supporting records, and payment timing. An application or lead alone does not earn a payment. Any program-specific rate or exception must be confirmed in writing before training begins.</p><p>Portal: <a href="${escapeHtml(input.portalUrl)}">${escapeHtml(input.portalUrl)}</a></p><p>Questions? Call ${escapeHtml(input.supportPhone)}.</p></div>`,
  };
}
