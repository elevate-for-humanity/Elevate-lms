/**
 * lib/lms/simulations/hipaa-simulation.ts
 *
 * Privacy Scenario Lab — the hands-on scenario simulation for the HIPAA
 * Privacy & Security Awareness course, built on the generic scenario
 * engine (lib/lms/scenario-simulation.ts) to the manifold gauge /
 * forklift lab contract: authored config in the lesson's
 * content_json.experience.simulation, int-encoded responses, server-side
 * scoring through the learner interactions API, results recorded in
 * interaction_progress.
 *
 * The scenarios are the course's own: permitted uses and the minimum
 * necessary standard (with the provider-to-provider treatment exception),
 * role-based access and the three-part check, confidential conversations,
 * and incident recognition and reporting. They are shaped to the domains
 * national healthcare certification testing examines (privacy, safeguards,
 * incident response), per the course's healthcare-simulation standard.
 *
 * Hard fails mirror the lessons exactly: disclosing PHI to an unverified
 * caller, and concealing a wrong-recipient incident or deciding on your
 * own that no notice is required — the lessons require prompt reporting
 * and forbid both.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const HIPAA_PRIVACY_SCENARIO_SIM_ID = 'hipaa-privacy-scenario-lab';

export const HIPAA_PRIVACY_SCENARIO_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: HIPAA_PRIVACY_SCENARIO_SIM_ID,
  title: 'Privacy Scenario Lab — Disclosures, Access, and Incidents',
  description:
    'Work a shift of privacy decisions the way the course teaches them: verify before you disclose, apply minimum necessary where it applies (and recognize where it does not), run the three-part access check, keep conversations confidential, and report an incident the right way. The lab is scored against the course lessons.',
  setting:
    'You are on front-desk and records duty at a community clinic for the day. Requests, callers, and one mistake are all coming your way.',
  badges: ['HIPAA Privacy Rule', 'Minimum necessary', 'Incident reporting'],
  objectives: [
    'Permitted uses and disclosures',
    'Minimum necessary judgment',
    'Role-based access',
    'Confidential communication',
    'Incident recognition and reporting',
  ],
  instructions: [
    'Two choices in this lab score 0 outright: giving PHI to a caller whose identity and entitlement you have not verified, and concealing an incident (or deciding yourself that no notice is required). The course rule is prompt, honest reporting to the privacy or security contact — the same day whenever possible.',
    'Before any access or disclosure, run the course\'s three-part check: purpose, authorization, recipient. If any part fails, stop and ask the privacy contact.',
  ],
  steps: [
    {
      kind: 'decide',
      id: 'unverified-caller',
      title: 'The caller who says she is family',
      prompt:
        'A caller says she is a patient\'s sister and asks for the patient\'s diagnosis and last lab results "for the family." You do not recognize the voice, and there is no authorization on file naming her. What do you do?',
      objective: 'Permitted uses and disclosures',
      options: [
        'Do not disclose: verify identity and entitlement first, and share only what a verified, entitled person may hear — refer the request to the privacy contact if you cannot establish both',
        'Share the results — she is family, and family involvement is part of care',
        'Share the appointment details but not the diagnosis, as a compromise',
      ],
      correct: 0,
      hardFailOptions: [1],
      hardFailMessage:
        'On the phone, you verify who you are speaking with before sharing information, and share only what that person is entitled to hear. A caller\'s claim of family relationship is not verification and not an authorization: most disclosures outside treatment, payment, and health care operations require a valid written authorization or another specific Privacy Rule permission. If you cannot name the permitted purpose, the recipient, and their role, pause and refer the request to the privacy contact. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'decide',
      id: 'minimum-necessary-billing',
      title: 'The billing request',
      prompt:
        'A billing specialist on your team asks you to send the patient\'s complete clinical chart so she can resolve an insurance claim. What does minimum necessary require?',
      objective: 'Minimum necessary judgment',
      options: [
        'Send the claim information her role needs for payment — dates, codes, and supporting documentation for the claim — not the entire chart',
        'Send the complete chart; she works here, so her access is covered',
        'Refuse entirely; billing may never see any clinical information',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'treatment-exception',
      title: 'The referral',
      prompt:
        'A clinician asks you to send the relevant records to a specialist she is referring the patient to. A coworker objects that "minimum necessary means we can only send a summary." Who is right?',
      objective: 'Minimum necessary judgment',
      options: [
        'Send what the specialist needs for treatment: provider-to-provider treatment disclosures are a recognized exception to the minimum necessary standard',
        'The coworker — minimum necessary caps every disclosure, including treatment referrals',
        'Neither — referrals always require the patient\'s written authorization first',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'inspect',
      id: 'workspace-check',
      title: 'Workspace privacy check',
      prompt:
        'Walk the front-desk area at midday. Flag every privacy defect you must act on; pass what meets the course standard.',
      objective: 'Confidential communication',
      pointsEach: 3,
      items: [
        {
          id: 'face-up-record',
          label: 'Intake counter',
          observation: 'A completed intake form sits face-up on the public counter while the clerk is at lunch.',
          defect: true,
        },
        {
          id: 'unlocked-screen',
          label: 'Check-in workstation',
          observation: 'The screen shows a patient list, unlocked, while the staff member is down the hall.',
          defect: true,
        },
        {
          id: 'waiting-room-names',
          label: 'Check-in conversation',
          observation: 'Staff call out full names and appointment reasons across a full waiting room.',
          defect: true,
        },
        {
          id: 'shred-bin',
          label: 'Disposal point',
          observation: 'Discarded printouts go into the locked shred bin beside the copier.',
          defect: false,
        },
        {
          id: 'private-area',
          label: 'Sensitive conversation',
          observation: 'A staff member moves a conversation about a patient\'s condition into the private consult room.',
          defect: false,
        },
        {
          id: 'printer',
          label: 'Shared printer',
          observation: 'Printed records are collected immediately by the person who printed them.',
          defect: false,
        },
      ],
    },
    {
      kind: 'decide',
      id: 'wrong-recipient',
      title: 'Your mistake',
      prompt:
        'You realize the summary you emailed ten minutes ago went to the wrong recipient — a similar name in the address book. What do you do?',
      objective: 'Incident recognition and reporting',
      options: [
        'Report it promptly to the designated privacy or security contact with what happened, when you discovered it, what information and which individuals were involved, and what you have done — and preserve the evidence',
        'Delete the sent email from your mailbox and say nothing; the recipient probably will not open it',
        'Decide yourself that it is minor and no notice is legally required, and move on',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'A wrong-recipient disclosure is a privacy incident, and the course rule for every suspected incident is the same first move: report promptly to the designated privacy or security contact, the same day whenever possible, because early reporting preserves evidence and starts any notification clocks that may apply. Do not delete messages or alter records to "fix" the problem, do not conceal an incident out of embarrassment, and never independently decide whether notice is legally required — that determination comes after assessment, by the people charged with it. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'decide',
      id: 'phishing-email',
      title: 'The urgent email',
      prompt:
        'An email styled like your IT department says your records-system password expires in one hour and directs you to a link to "verify" it. The sender address looks slightly off. What do you do?',
      objective: 'Incident recognition and reporting',
      options: [
        'Do not click or enter credentials; report the message through the organization\'s security channel so it can be assessed',
        'Use the link — an expired password would lock you out of patient records mid-shift',
        'Forward it to coworkers to warn them, link included',
      ],
      correct: 0,
      points: 10,
    },
  ],
  syllabusTopics: [
    {
      topic: 'Permitted uses, disclosures and minimum necessary',
      coverage: 'full',
      note: 'The caller, billing, and referral steps score permitted purposes, the minimum necessary standard, and its provider-to-provider treatment exception.',
    },
    {
      topic: 'Role-based access and confidential conversations',
      coverage: 'full',
      note: 'The workspace check and the three-part check (purpose, authorization, recipient) are exercised item by item.',
    },
    {
      topic: 'Individual privacy rights and respectful communication',
      coverage: 'applied',
      note: 'Verification before disclosure and waiting-room confidentiality carry the lesson\'s communication standard.',
    },
    {
      topic: 'Recognizing and reporting privacy incidents',
      coverage: 'full',
      note: 'The wrong-recipient step hard-fails concealment and self-adjudication, exactly as the lesson forbids both.',
    },
    {
      topic: 'Phishing, password hygiene and access control',
      coverage: 'applied',
      note: 'The phishing step scores the report-don\'t-click response the lesson teaches.',
    },
    {
      topic: 'Privacy scenarios in healthcare and community services',
      coverage: 'embedded',
      note: 'The lab is attached to this lesson and runs its scenario method end to end.',
    },
  ],
};
