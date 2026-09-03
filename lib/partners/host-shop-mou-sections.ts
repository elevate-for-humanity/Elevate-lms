import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export type HostShopMouProgram = 'barber' | 'cosmetology' | 'esthetician' | 'nail';

export type MouSection = {
  title: string;
  content: string;
};

export type HostShopMouMeta = {
  documentType: string;
  title: string;
  subtitle: string;
  worksiteLabel: string;
  handbookHref: string;
  fullDocHref?: string;
  rapidsId: string | null;
  registrationLabel: string;
  registered: boolean;
};

const PROGRAM_SLUG: Record<HostShopMouProgram, string | null> = {
  barber: 'barber-apprenticeship',
  cosmetology: null,
  esthetician: 'esthetician-apprenticeship',
  nail: 'nail-technician-apprenticeship',
};

const LABELS: Record<HostShopMouProgram, { title: string; worksite: string; handbook: string; fullDoc?: string }> = {
  barber: {
    title: 'Indiana Barber Host Shop Program',
    worksite: 'barbershop',
    handbook: '/partners/barber-host-shop/handbook',
    fullDoc: '/docs/Indiana-Barbershop-Apprenticeship-MOU',
  },
  cosmetology: {
    title: 'Indiana Cosmetology Host Site Pathway',
    worksite: 'salon',
    handbook: '/partners/cosmetology-host-shop/handbook',
  },
  esthetician: {
    title: 'Indiana Esthetician Host Site Program',
    worksite: 'spa or salon',
    handbook: '/partners/esthetician-host-shop/handbook',
  },
  nail: {
    title: 'Indiana Nail Technician Host Site Program',
    worksite: 'nail salon',
    handbook: '/partners/nail-technician-host-shop/handbook',
  },
};

function registeredContract(program: HostShopMouProgram) {
  const slug = PROGRAM_SLUG[program];
  return slug ? getRegisteredProgramStandard(slug) : null;
}

function wageText(program: HostShopMouProgram) {
  const contract = registeredContract(program);
  if (!contract) {
    return 'No federal registered wage schedule is asserted by this MOU for this pathway. The Worksite must comply with the applicable employment agreement and all current wage laws.';
  }
  const standard = contract.standard;
  const milestones = standard.wageMilestones
    .map((step) => `${step.completedCompetencies} verified competencies: $${step.hourlyRate.toFixed(2)}/hour registered baseline`)
    .join('\n• ');
  return `The approved occupation standard contains a registered starting baseline of $${standard.startingHourlyRate.toFixed(2)}/hour and the following competency milestones:\n• ${milestones}\n\nThe Worksite must apply the applicable employer-specific RAPIDS wage schedule and any higher wage required by law. The platform stores employer wage schedules separately from the immutable occupation standard so a host-specific schedule is not overwritten by generic copy.`;
}

function authorityText(program: HostShopMouProgram) {
  const contract = registeredContract(program);
  if (!contract) {
    return `The current canonical registry does not contain an approved federal registered-program standard for this specific ${LABELS[program].title}. This MOU therefore establishes host-site operating responsibilities only and must not be used as evidence that this pathway is federally registered. If an approved standard is later added, the registered standard must be incorporated before registered-apprenticeship claims or RAPIDS reporting are made.`;
  }
  const standard = contract.standard;
  return `This worksite relationship operates under Sponsor registration ${contract.sponsor.registrationNumber}, occupation RAPIDS code ${standard.rapidsCode} (${standard.occupationTitle}), revision ${contract.sponsor.revisionDate}. The approved occupation is competency-based. Registered completion requires all ${contract.completion.competencyCount} verified competencies plus ${contract.completion.requiredRtiHours} verified RTI hours. The approved apprentice-to-mentor ratio is ${standard.apprenticeToMentorRatio}; the probationary period is ${standard.probationaryHours} hours. Supervised work/OJL hours remain auditable employment and training evidence but are not a fixed completion denominator for this occupation.`;
}

function worksiteResponsibilities(program: HostShopMouProgram) {
  const contract = registeredContract(program);
  const supervision = contract
    ? `Maintain the approved ${contract.standard.apprenticeToMentorRatio} apprentice-to-mentor ratio and ensure competency verification is performed only by the assigned authorized supervisor.`
    : 'Maintain supervision required by the applicable licensing rules, employment arrangement, and approved pathway.';
  return `The Worksite agrees to:\n\n• Employ and compensate each apprentice/trainee in accordance with the applicable employment agreement and law.\n• ${supervision}\n• Maintain current establishment/business licensing, required professional licenses, insurance, workers-compensation coverage or valid exemption, and other required worksite records.\n• Maintain truthful attendance, supervised-work, wage/payroll, location, safety, and competency evidence.\n• Never backdate, duplicate, falsify, spoof, or approve work, attendance, location, or competency records that were not actually earned.\n• Notify the Sponsor promptly of changes in employment, supervisor, worksite, licensing, insurance, safety status, or apprentice status that affect the approved arrangement.\n• Permit authorized Sponsor or regulatory review of records relevant to the apprenticeship/pathway.\n• Follow applicable nondiscrimination, accessibility, workplace-safety, sanitation, privacy, and employment requirements.`;
}

function sponsorResponsibilities(program: HostShopMouProgram) {
  const contract = registeredContract(program);
  return `${PLATFORM_DEFAULTS.orgName} agrees to:\n\n• Maintain the canonical program, enrollment, placement, document, and audit records used to administer the pathway.\n• Provide or coordinate assigned related instruction and maintain verified RTI records where required.\n• Maintain competency definitions and verification workflows from the approved registered standard where one exists.\n• Review Host Site documents and operating eligibility before treating the site as active/approved.\n• Maintain sponsor-level RAPIDS reporting and completion records for occupations that are actually present in the approved registered-program registry.\n• Keep funding authorization separate from enrollment and never treat WIOA, OJT reimbursement, or other public funding as approved without the applicable workforce authorization.\n• Provide reasonable compliance support and communicate material program changes to active Host Sites.${contract ? `\n• Preserve the occupation requirements for RAPIDS ${contract.standard.rapidsCode} without replacing them with generic state-school or marketing hour totals.` : ''}`;
}

function buildSections(program: HostShopMouProgram): MouSection[] {
  const labels = LABELS[program];
  const contract = registeredContract(program);
  const registeredStatement = contract
    ? `This MOU is a worksite agreement under the registered sponsor structure for occupation ${contract.standard.rapidsCode}. It does not transfer sponsor status, ownership of the registered program, or authority to alter the approved occupation standard to the Worksite.`
    : `This MOU is a host-site operating agreement. It does not itself create federal registered-apprenticeship status or authorize the Worksite to make RAPIDS/registered-program claims.`;

  return [
    {
      title: '1. Parties and Purpose',
      content: `This Memorandum of Understanding ("MOU") is between 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute ("Sponsor") and the ${labels.worksite} identified at execution ("Worksite").\n\n${registeredStatement}\n\nThe purpose is to define supervision, employment, recordkeeping, training, safety, document, funding, and compliance responsibilities for apprentices/participants assigned to the Worksite.`,
    },
    {
      title: '2. Program Authority and Completion Basis',
      content: authorityText(program),
    },
    {
      title: '3. Sponsor Responsibilities',
      content: sponsorResponsibilities(program),
    },
    {
      title: '4. Worksite Responsibilities',
      content: worksiteResponsibilities(program),
    },
    {
      title: '5. Compensation and Wage Evidence',
      content: `${wageText(program)}\n\nThe Worksite is responsible for payroll, withholding, required employer contributions, wage statements, and retention of sufficient wage evidence to support program review. No revenue, reimbursement, commission, funding, or profit is guaranteed by participation in this pathway.`,
    },
    {
      title: '6. Work Records, RTI, and Competency Verification',
      content: `Work records, RTI evidence, and competency verification are separate records. Work time must reflect actual supervised employment/training activity. RTI credit is counted only when instruction is documented and verified under the applicable program standard. Competency completion may be recorded only after an authorized verifier has observed sufficient evidence of mastery.\n\nFor competency-based registered occupations, elapsed work hours do not automatically complete competencies and do not replace the required RTI total.`,
    },
    {
      title: '7. Workforce Funding and Reimbursement',
      content: `WIOA, WorkOne OJT reimbursement, supportive services, grants, and other public funding are subject to separate participant/employer eligibility, allowable-cost rules, and written authorization. The Worksite must not represent funding as guaranteed or submit the same allowable cost for duplicate reimbursement. Payroll and training evidence required by an authorized funding agreement must be retained and must agree with the apprenticeship/work records.`,
    },
    {
      title: '8. Privacy, Confidentiality, and Record Access',
      content: `Both parties must protect apprentice/participant personally identifiable information and use it only for authorized program, employment, compliance, funding, or legal purposes. Access to platform records is role-scoped. The Worksite may not share account credentials or disclose protected records to unauthorized persons. Required records may be provided to authorized regulators, funders, auditors, or program administrators when permitted or required by law and the applicable agreement.`,
    },
    {
      title: '9. Term, Changes, and Termination',
      content: `This MOU becomes effective when electronically signed and continues while the Worksite remains approved or until terminated. Either party may provide 30 days written notice to end the worksite relationship, subject to any immediate suspension or termination required for safety, licensing, wage, fraud, discrimination, record-integrity, or other material compliance concerns.\n\nA change in registered occupation requirements, supervisor, worksite, employer registration, wage schedule, licensing, or funding authorization must be documented in the appropriate system of record; it must not be silently changed by editing marketing copy or local spreadsheets.`,
    },
    {
      title: '10. Electronic Signature and Governing Records',
      content: `The electronic signature record, signer identity, document version, timestamp, IP/user-agent audit data, Host Site document record, applicable registered-program standard, employer-specific RAPIDS data, and subsequent approved amendments together form the operational evidence for this worksite agreement.\n\nIf a page, handbook, dashboard, or marketing statement conflicts with an approved registered-program standard or a later signed amendment, the approved standard and controlling signed record govern.`,
    },
  ];
}

export function getHostShopMouMeta(program: HostShopMouProgram): HostShopMouMeta {
  const labels = LABELS[program];
  const contract = registeredContract(program);
  return {
    documentType: 'Memorandum of Understanding',
    title: labels.title,
    subtitle: contract ? 'Registered Apprenticeship Worksite Agreement' : 'Host Site Operating Agreement',
    worksiteLabel: `Your ${labels.worksite}`,
    handbookHref: labels.handbook,
    fullDocHref: labels.fullDoc,
    rapidsId: contract?.sponsor.registrationNumber || null,
    registrationLabel: contract
      ? `Sponsor ${contract.sponsor.registrationNumber} · occupation ${contract.standard.rapidsCode}`
      : 'No approved registered occupation is present in the canonical registry for this pathway',
    registered: Boolean(contract),
  };
}

export function getHostShopMouSections(program: HostShopMouProgram): MouSection[] {
  return buildSections(program);
}
