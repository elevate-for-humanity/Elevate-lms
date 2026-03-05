/**
 * Standardized document templates for MOUs, reports, and emails.
 * These are the documents partners and agencies see most often.
 */

// ─── MOU Template ───────────────────────────────────────────────

export interface MOUTemplate {
  partnerOrganization: string;
  purpose: string;
  background: string;
  scopeOfCollaboration: string;
  elevateResponsibilities: string[];
  partnerResponsibilities: string[];
  participantOutcomes: string[];
  termStart: string;
  termEnd: string;
  renewalTerms: string;
  dataSharing: string;
  financialTerms: string;
  elevateSigner: { name: string; title: string };
  partnerSigner: { name: string; title: string };
}

export const MOU_TEMPLATE_DEFAULT: MOUTemplate = {
  partnerOrganization: '',
  purpose: '',
  background: '',
  scopeOfCollaboration: '',
  elevateResponsibilities: [
    'Program coordination and participant recruitment',
    'Credential preparation and testing administration',
    'Case management and support services',
    'Reporting and compliance documentation',
  ],
  partnerResponsibilities: [
    'Training facility and equipment access',
    'Qualified instructors for hands-on training',
    'On-the-job training placement opportunities',
    'Industry-recognized credential verification',
  ],
  participantOutcomes: [
    'Industry-recognized certification(s)',
    'Employment placement in related field',
    'Career pathway advancement',
  ],
  termStart: '',
  termEnd: '',
  renewalTerms: 'This agreement may be renewed by mutual written consent of both parties for additional one-year terms.',
  dataSharing: 'Both parties agree to share participant data only as necessary for program administration, reporting, and compliance. All data sharing shall comply with applicable federal and state privacy laws, including FERPA and WIOA regulations.',
  financialTerms: 'This Memorandum of Understanding does not constitute a financial agreement. No funds are exchanged between the parties under this agreement.',
  elevateSigner: { name: '', title: 'Executive Director' },
  partnerSigner: { name: '', title: '' },
};

export function generateMOUMarkdown(mou: MOUTemplate): string {
  const elevateResp = mou.elevateResponsibilities.map(r => `- ${r}`).join('\n');
  const partnerResp = mou.partnerResponsibilities.map(r => `- ${r}`).join('\n');
  const outcomes = mou.participantOutcomes.map(o => `- ${o}`).join('\n');

  return `# Memorandum of Understanding

**Between Elevate for Humanity and ${mou.partnerOrganization}**

---

## Purpose

${mou.purpose}

## Background

${mou.background}

## Scope of Collaboration

${mou.scopeOfCollaboration}

## Roles and Responsibilities

### Elevate for Humanity

${elevateResp}

### ${mou.partnerOrganization}

${partnerResp}

## Participant Outcomes

${outcomes}

## Term of Agreement

This agreement is effective from **${mou.termStart}** through **${mou.termEnd}**.

${mou.renewalTerms}

## Data Sharing and Compliance

${mou.dataSharing}

## Non-Financial Understanding

${mou.financialTerms}

## Signatures

| | Elevate for Humanity | ${mou.partnerOrganization} |
|---|---|---|
| **Name** | ${mou.elevateSigner.name} | ${mou.partnerSigner.name} |
| **Title** | ${mou.elevateSigner.title} | ${mou.partnerSigner.title} |
| **Date** | ________________ | ________________ |
| **Signature** | ________________ | ________________ |
`;
}

// ─── Report Template ────────────────────────────────────────────

export interface ReportTemplate {
  programName: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  programOverview: string;
  keyActivities: string[];
  enrollments: number;
  completions: number;
  certificationsEarned: number;
  employmentPlacements: number;
  operationalUpdates: string[];
  challengesOrRisks: string[];
  nextSteps: string[];
  summary: string;
}

export const REPORT_TEMPLATE_DEFAULT: ReportTemplate = {
  programName: '',
  reportingPeriodStart: '',
  reportingPeriodEnd: '',
  programOverview: '',
  keyActivities: [],
  enrollments: 0,
  completions: 0,
  certificationsEarned: 0,
  employmentPlacements: 0,
  operationalUpdates: [],
  challengesOrRisks: [],
  nextSteps: [],
  summary: '',
};

export function generateReportMarkdown(r: ReportTemplate): string {
  const activities = r.keyActivities.map(a => `- ${a}`).join('\n');
  const updates = r.operationalUpdates.map(u => `- ${u}`).join('\n');
  const challenges = r.challengesOrRisks.map(c => `- ${c}`).join('\n');
  const next = r.nextSteps.map(n => `- ${n}`).join('\n');

  return `# Program Progress Report – ${r.programName}

## Reporting Period

${r.reportingPeriodStart} through ${r.reportingPeriodEnd}

## Program Overview

${r.programOverview}

## Key Activities

${activities}

## Participant Metrics

| Metric | Count |
|---|---|
| Enrollments | ${r.enrollments} |
| Completions | ${r.completions} |
| Certifications Earned | ${r.certificationsEarned} |
| Employment Placements | ${r.employmentPlacements} |

## Operational Updates

${updates || 'No operational updates for this period.'}

## Challenges or Risks

${challenges || 'No significant challenges during this period.'}

## Next Steps

${next}

## Summary

${r.summary}

---

*Prepared by Elevate for Humanity*
*Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*
`;
}

// ─── Email Templates ────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  placeholders: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'partnership-outreach',
    name: 'Partnership Outreach',
    description: 'Initial outreach to a potential training or employer partner.',
    subject: 'Workforce Training Partnership Opportunity – Elevate for Humanity',
    placeholders: ['[Recipient Name]', '[Organization Name]', '[Program Area]', '[Your Name]', '[Your Title]'],
    body: `Dear [Recipient Name],

I am reaching out on behalf of Elevate for Humanity to explore a potential workforce training partnership with [Organization Name].

Elevate for Humanity is an ETPL-listed workforce development organization based in Indianapolis. We deliver funded career training programs in healthcare, skilled trades, technology, and business — serving participants through WIOA, DOL apprenticeship, and other workforce funding streams.

We are currently expanding our [Program Area] programming and believe [Organization Name] would be an excellent partner for training delivery, credential testing, or on-the-job training placement.

I would welcome the opportunity to schedule a brief call or meeting to discuss how we might collaborate. Please let me know your availability, and I will coordinate accordingly.

Thank you for your time and consideration.

Sincerely,
[Your Name]
[Your Title]
Elevate for Humanity
www.elevateforhumanity.org`,
  },
  {
    id: 'workforce-board-followup',
    name: 'Workforce Board Follow-Up',
    description: 'Follow-up communication with a workforce development board.',
    subject: 'Follow-Up: [Program Name] – Elevate for Humanity',
    placeholders: ['[Recipient Name]', '[Program Name]', '[Meeting Date]', '[Specific Topic]', '[Your Name]', '[Your Title]'],
    body: `Dear [Recipient Name],

Thank you for speaking with me on [Meeting Date] regarding [Program Name]. I appreciate the time and guidance your office provided.

As discussed, Elevate for Humanity is committed to [Specific Topic] and ensuring our programs meet the standards and expectations of the workforce development system. We are prepared to provide any additional documentation or reporting your office may require.

Please let me know if there are any next steps on your end, or if you need any additional information from our team. We look forward to continuing this partnership.

Sincerely,
[Your Name]
[Your Title]
Elevate for Humanity
www.elevateforhumanity.org`,
  },
  {
    id: 'employer-recruitment',
    name: 'Employer Recruitment',
    description: 'Outreach to employers for hiring program graduates.',
    subject: 'Skilled Workforce Pipeline – Elevate for Humanity Graduates',
    placeholders: ['[Recipient Name]', '[Company Name]', '[Program Area]', '[Credential Names]', '[Your Name]', '[Your Title]'],
    body: `Dear [Recipient Name],

I am writing to introduce Elevate for Humanity's workforce training programs and the skilled candidates we prepare for employment in [Program Area].

Our graduates complete industry-recognized training and earn credentials including [Credential Names]. Each participant receives hands-on instruction, career readiness coaching, and is prepared for immediate entry-level employment.

We are seeking employer partners who are interested in:
- Interviewing and hiring program graduates
- Providing on-the-job training or apprenticeship opportunities
- Participating in career fairs or mock interview sessions

There is no cost to your organization for accessing our talent pipeline. We handle all training, credentialing, and pre-employment preparation.

I would welcome the opportunity to discuss how Elevate graduates could support [Company Name]'s workforce needs. Please let me know a convenient time to connect.

Sincerely,
[Your Name]
[Your Title]
Elevate for Humanity
www.elevateforhumanity.org`,
  },
  {
    id: 'program-update-partners',
    name: 'Program Update to Partners',
    description: 'Periodic update to existing partners on program progress.',
    subject: 'Program Update: [Program Name] – [Reporting Period]',
    placeholders: ['[Recipient Name]', '[Program Name]', '[Reporting Period]', '[Enrollments]', '[Completions]', '[Certifications]', '[Placements]', '[Key Update]', '[Your Name]', '[Your Title]'],
    body: `Dear [Recipient Name],

I am writing to provide an update on [Program Name] for the period of [Reporting Period].

Program Metrics:
- Enrollments: [Enrollments]
- Completions: [Completions]
- Certifications Earned: [Certifications]
- Employment Placements: [Placements]

[Key Update]

We appreciate your continued partnership and support. If you have any questions or would like to discuss these results in more detail, please do not hesitate to reach out.

Sincerely,
[Your Name]
[Your Title]
Elevate for Humanity
www.elevateforhumanity.org`,
  },
  {
    id: 'meeting-request',
    name: 'Meeting Request',
    description: 'Request a meeting with a partner, agency, or stakeholder.',
    subject: 'Meeting Request: [Topic] – Elevate for Humanity',
    placeholders: ['[Recipient Name]', '[Topic]', '[Purpose]', '[Proposed Dates]', '[Your Name]', '[Your Title]'],
    body: `Dear [Recipient Name],

I am writing to request a meeting to discuss [Topic].

[Purpose]

I am available on the following dates and would be happy to accommodate your schedule:
[Proposed Dates]

The meeting can be held in person, by phone, or via video conference — whichever is most convenient for you. I anticipate the discussion will take approximately 30 minutes.

Please let me know your availability, and I will send a calendar invitation with the details.

Thank you for your time.

Sincerely,
[Your Name]
[Your Title]
Elevate for Humanity
www.elevateforhumanity.org`,
  },
];
