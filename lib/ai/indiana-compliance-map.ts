/**
 * Indiana CNA compliance map.
 *
 * Source: Indiana State Department of Health (ISDH) Nurse Aide Training
 * and Competency Evaluation Program (NATCEP) requirements.
 * Reference: 410 IAC 17 (Indiana Administrative Code, Title 410, Article 17)
 * Last reviewed: 2026
 *
 * ⚠️  IMPORTANT: This map encodes known ISDH requirements but has NOT been
 * verified against the current ISDH NATCEP curriculum guide by a licensed
 * healthcare educator. All AI-generated course output using this map must
 * carry compliance_status = "draft_for_human_review" until a qualified
 * reviewer confirms alignment.
 *
 * Do not remove the draft label or set compliance_status = "verified"
 * without documented sign-off from a licensed Indiana CNA instructor or
 * ISDH-approved training program director.
 */

export interface ComplianceDomain {
  /** Machine key used in exam domain_blueprint */
  key: string;
  /** Human-readable domain name */
  name: string;
  /** Minimum hours required by ISDH for this domain */
  min_hours: number;
  /** Core competencies that must be covered */
  required_competencies: string[];
  /** Indiana-specific notes */
  indiana_notes: string;
}

export interface ComplianceMap {
  program: string;
  state: string;
  governing_body: string;
  regulation_cite: string;
  total_min_hours: number;
  clinical_min_hours: number;
  written_exam_questions: number;
  skills_exam_count: number;
  pass_threshold_written: number;
  pass_threshold_skills: number;
  domains: ComplianceDomain[];
  exam_eligibility_requirements: string[];
  draft_notice: string;
}

export const INDIANA_CNA_COMPLIANCE: ComplianceMap = {
  program: 'Certified Nursing Assistant (CNA)',
  state: 'Indiana',
  governing_body: 'Indiana State Department of Health (ISDH)',
  regulation_cite: '410 IAC 17',
  total_min_hours: 75,
  clinical_min_hours: 16,
  written_exam_questions: 70,
  skills_exam_count: 5,
  pass_threshold_written: 70,
  pass_threshold_skills: 100, // All 5 skills must be demonstrated correctly
  domains: [
    {
      key: 'patient_care',
      name: 'Patient Care and Activities of Daily Living',
      min_hours: 20,
      required_competencies: [
        'Assist with bathing, grooming, and oral hygiene',
        'Assist with dressing and undressing',
        'Assist with ambulation and transfers using proper body mechanics',
        'Provide perineal care',
        'Assist with feeding and hydration monitoring',
        'Measure and record intake and output',
        'Provide range-of-motion exercises',
        'Position and reposition patients to prevent pressure injuries',
        'Apply and remove non-sterile dressings under nurse supervision',
        'Assist with elimination: bedpan, urinal, commode',
      ],
      indiana_notes:
        'Indiana requires demonstration of at least 5 ADL skills during the clinical skills exam. Bed bath and transfer are consistently tested.',
    },
    {
      key: 'safety',
      name: 'Safety and Emergency Procedures',
      min_hours: 12,
      required_competencies: [
        'Identify and report fall risks',
        'Apply restraints only under nurse direction per ISDH policy',
        'Perform Heimlich maneuver on conscious adult',
        'Perform CPR (BLS level)',
        'Use fire safety procedures (RACE/PASS)',
        'Recognize and respond to medical emergencies',
        'Apply standard precautions for sharps and biohazard disposal',
        'Operate call light systems and emergency response',
        'Identify abuse, neglect, and exploitation — mandatory reporting',
        'Understand resident rights under Indiana law',
      ],
      indiana_notes:
        'Indiana mandates abuse/neglect recognition and mandatory reporting training per 410 IAC 17-10. Restraint use requires specific documentation.',
    },
    {
      key: 'infection_control',
      name: 'Infection Control',
      min_hours: 10,
      required_competencies: [
        'Perform proper handwashing technique (WHO 5-moment method)',
        'Don and doff PPE correctly (gloves, gown, mask, eye protection)',
        'Implement contact, droplet, and airborne isolation precautions',
        'Handle and dispose of contaminated linens and waste',
        'Understand chain of infection and how to break it',
        'Recognize signs of healthcare-associated infections (HAIs)',
        'Follow OSHA Bloodborne Pathogen Standard',
        'Perform sterile technique for wound care under supervision',
      ],
      indiana_notes:
        'Handwashing is a required skills exam task in Indiana. PPE donning/doffing is frequently tested. OSHA BBP training must be documented.',
    },
    {
      key: 'communication',
      name: 'Communication and Interpersonal Skills',
      min_hours: 8,
      required_competencies: [
        'Use therapeutic communication techniques with residents',
        'Document observations accurately in medical records',
        'Report changes in resident condition to charge nurse immediately',
        'Communicate with residents with cognitive impairment (dementia care)',
        'Understand and apply HIPAA privacy requirements',
        'Work effectively within the nursing team hierarchy',
        'Communicate with families within scope of practice',
        'Recognize and respond to non-verbal communication cues',
      ],
      indiana_notes:
        'Indiana requires dementia-specific communication training. Documentation accuracy is tested in the written exam.',
    },
    {
      key: 'legal_ethical',
      name: 'Legal and Ethical Responsibilities',
      min_hours: 8,
      required_competencies: [
        'Understand Indiana CNA scope of practice boundaries',
        'Apply resident rights under OBRA 1987 and Indiana law',
        'Recognize and report abuse, neglect, and misappropriation',
        'Understand advance directives and DNR orders',
        'Maintain professional boundaries with residents and families',
        'Understand consequences of CNA registry violations in Indiana',
      ],
      indiana_notes:
        'Indiana CNA registry (maintained by ISDH) records substantiated abuse findings. CNAs must understand registry implications.',
    },
    {
      key: 'clinical_practicum',
      name: 'Clinical Practicum',
      min_hours: 16,
      required_competencies: [
        'Perform all ADL skills in a live clinical setting',
        'Demonstrate infection control in real patient care',
        'Document care accurately in facility records',
        'Communicate with supervising RN/LPN during clinical',
        'Complete minimum 16 hours in an ISDH-approved clinical site',
      ],
      indiana_notes:
        'Indiana requires a minimum of 16 clinical hours in an approved long-term care or acute care facility. Clinical must be supervised by an RN.',
    },
  ],
  exam_eligibility_requirements: [
    'Complete all 75 required training hours (minimum 16 clinical)',
    'Pass all 3 module checkpoints with score ≥75%',
    'No unresolved attendance or conduct issues',
    'Instructor sign-off on clinical skills competency checklist',
    'Valid government-issued photo ID',
    'No disqualifying criminal history per Indiana background check requirements',
  ],
  draft_notice:
    'DRAFT FOR HUMAN REVIEW — This compliance map is based on 410 IAC 17 and ISDH NATCEP requirements as understood at time of generation. It has not been verified by a licensed Indiana CNA instructor or ISDH-approved program director. Do not use for regulatory submissions without qualified review.',
};

/**
 * Returns the system prompt fragment that instructs GPT-4o to align
 * output to Indiana NATCEP requirements. Injected into the route's
 * system message — not the user prompt.
 */
export function buildIndianaCompliancePromptFragment(): string {
  const map = INDIANA_CNA_COMPLIANCE;
  const domainList = map.domains
    .map((d) => `  - ${d.name} (min ${d.min_hours}h): ${d.required_competencies.slice(0, 3).join('; ')}`)
    .join('\n');

  return `
INDIANA NATCEP COMPLIANCE REQUIREMENTS (410 IAC 17):
- Total minimum hours: ${map.total_min_hours} (clinical minimum: ${map.clinical_min_hours})
- Written exam: ${map.written_exam_questions} questions, pass threshold ${map.pass_threshold_written}%
- Skills exam: ${map.skills_exam_count} skills demonstrated, all must pass
- Governing body: ${map.governing_body}

Required training domains and minimum hours:
${domainList}

Exam eligibility criteria to include verbatim:
${map.exam_eligibility_requirements.map((r) => `  - ${r}`).join('\n')}

MANDATORY: Set compliance_status = "draft_for_human_review" on the course object.
MANDATORY: Use these exact domain keys in exam domain_blueprint: ${map.domains.map((d) => d.key).join(', ')}.
MANDATORY: All lesson content must reference specific Indiana NATCEP competencies, not generic nursing theory.
`.trim();
}
