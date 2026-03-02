/**
 * Employer Partnership MOU Template
 *
 * Generates the Memorandum of Understanding for employer partners.
 * Covers: apprenticeship hosting, OJL supervision, insurance requirements,
 * hour attestation, compliance obligations, and termination terms.
 */

export interface EmployerMOUData {
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  ein?: string;
  worksiteAddress: string;
  supervisorName: string;
  supervisorTitle: string;
  programTypes: string[]; // e.g. ['barber-apprenticeship', 'cosmetology-apprenticeship']
  date: string;
}

export function generateEmployerMOUText(data: EmployerMOUData): string {
  const programs = data.programTypes.length > 0
    ? data.programTypes.join(', ')
    : 'workforce training programs';

  return `ELEVATE FOR HUMANITY CAREER & TRAINING INSTITUTE
EMPLOYER PARTNERSHIP
MEMORANDUM OF UNDERSTANDING (MOU)

This Memorandum of Understanding ("MOU") outlines the partnership between:

Elevate for Humanity Career & Training Institute
2Exclusive LLC-S d/b/a Elevate for Humanity
("Institute")

and

${data.businessName}
("Employer")

Effective Date: ${data.date}

---

SECTION 1: PURPOSE

This MOU establishes the terms under which Employer participates as a partner in the Institute's ${programs}. The purpose is to provide structured on-the-job learning (OJL) opportunities, supervised work experience, and employment pathways for program participants.

SECTION 2: EMPLOYER OBLIGATIONS

Employer agrees to:

a) Provide a safe, supervised work environment that meets all applicable federal, state, and local regulations.

b) Designate a qualified supervisor (${data.supervisorName}, ${data.supervisorTitle}) responsible for:
   - Direct oversight of apprentices/trainees during work hours
   - Completing weekly hour attestations
   - Providing performance feedback to the Institute
   - Ensuring compliance with program training standards

c) Maintain current insurance coverage:
   - General Liability Insurance (minimum $1,000,000 per occurrence / $2,000,000 aggregate)
   - Workers' Compensation Insurance covering all apprentices/trainees as required by Indiana law
   - Provide Certificate of Insurance (COI) to the Institute prior to placement and upon renewal

d) Accurately record and attest to all training hours using the Institute's employer portal.

e) Not discriminate against any participant on the basis of race, color, religion, sex, national origin, age, disability, or genetic information, in accordance with 29 CFR Part 30.

f) Comply with all applicable wage and hour laws, including payment of at least the applicable minimum wage or apprentice wage scale.

g) Notify the Institute within 48 hours of any workplace incident, disciplinary action, or change in employment status involving a program participant.

SECTION 3: INSTITUTE OBLIGATIONS

The Institute agrees to:

a) Screen and prepare candidates before placement, including background checks where applicable.

b) Provide Related Technical Instruction (RTI) as required by the training program.

c) Monitor participant progress and coordinate with the designated supervisor.

d) Process OJT wage reimbursements (where applicable under WIOA or apprenticeship funding).

e) Provide the employer portal for hour tracking, document management, and compliance reporting.

f) Maintain program accreditation and DOL registration as applicable.

SECTION 4: INSURANCE REQUIREMENTS

Employer must maintain the following insurance coverage for the duration of this agreement:

- General Liability: $1,000,000 per occurrence / $2,000,000 aggregate
- Workers' Compensation: As required by Indiana Code IC 22-3
- Professional Liability (if applicable to the trade)

Employer must provide updated COI documentation:
- Prior to any participant placement
- Within 30 days of policy renewal
- Upon request by the Institute

Failure to maintain required insurance coverage will result in immediate suspension of participant placements until coverage is restored.

SECTION 5: HOUR ATTESTATION AND REPORTING

Employer agrees to:

a) Log all OJL hours through the employer portal within 7 calendar days of the work period.

b) Attest to the accuracy of reported hours. Falsification of hour records is grounds for immediate termination of this agreement.

c) Cooperate with any audit or verification of hour records by the Institute, DOL, or funding agencies.

SECTION 6: CONFIDENTIALITY

Employer agrees to maintain the confidentiality of all participant information received through this partnership, including but not limited to: personal identification, educational records, assessment results, and funding status. This obligation survives termination of this agreement.

SECTION 7: TERM AND TERMINATION

This MOU is effective for one (1) year from the date of execution and renews automatically unless either party provides 30 days written notice of non-renewal.

Either party may terminate this agreement with 30 days written notice. The Institute may terminate immediately if Employer:
- Fails to maintain required insurance
- Falsifies hour attestations
- Violates non-discrimination requirements
- Creates an unsafe work environment

SECTION 8: DISPUTE RESOLUTION

Any disputes arising under this MOU shall first be addressed through good-faith negotiation between the parties. If unresolved within 30 days, disputes shall be submitted to mediation in Marion County, Indiana.

SECTION 9: GOVERNING LAW

This MOU shall be governed by the laws of the State of Indiana.

---

EMPLOYER ACKNOWLEDGMENT

By signing below, Employer acknowledges that they have read, understand, and agree to all terms of this Memorandum of Understanding.

Employer: ${data.businessName}
Contact: ${data.contactName}
Email: ${data.contactEmail}
Phone: ${data.contactPhone}
${data.ein ? `EIN: ${data.ein}` : ''}
Worksite: ${data.worksiteAddress}
Designated Supervisor: ${data.supervisorName}, ${data.supervisorTitle}

Signature: ______________________________
Name: ${data.contactName}
Title: ______________________________
Date: ${data.date}

---

INSTITUTE ACKNOWLEDGMENT

Elevate for Humanity Career & Training Institute
2Exclusive LLC-S d/b/a Elevate for Humanity

Signature: ______________________________
Name: Elizabeth Greene
Title: Founder & CEO
Date: ${data.date}

---

This MOU was generated on ${data.date} via the Elevate for Humanity Employer Portal.
For questions or to request modifications, contact: admin@www.elevateforhumanity.org
`;
}
