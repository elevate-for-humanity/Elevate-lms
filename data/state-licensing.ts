/**
 * State licensing requirements for CNA and Phlebotomy programs.
 *
 * Indiana is the base state — Elevate is licensed to train and test here.
 * Other states are listed with their requirements and official links.
 * States marked available=false cannot be licensed from Indiana.
 */

export interface StateLicensingInfo {
  state: string;
  code: string;
  available: boolean;
  /** Why unavailable — shown to applicant */
  unavailableReason?: string;
  requirementsUrl: string;
  boardName: string;
  notes: string;
}

export const CNA_STATE_LICENSING: StateLicensingInfo[] = [
  {
    state: 'Indiana',
    code: 'IN',
    available: true,
    requirementsUrl: 'https://www.in.gov/isdh/27072.htm',
    boardName: 'Indiana State Department of Health (ISDH)',
    notes: 'Elevate is an approved Indiana CNA training program. Exam proctored on-site. 105 hours required (75 classroom + 30 clinical).',
  },
  {
    state: 'Illinois',
    code: 'IL',
    available: false,
    unavailableReason: 'Illinois requires CNA training programs to be approved by the Illinois Department of Public Health. Elevate is not yet approved in Illinois.',
    requirementsUrl: 'https://dph.illinois.gov/topics-services/health-care-regulation/nursing-home-hfs-surveyor-training/nurse-aide-training.html',
    boardName: 'Illinois Department of Public Health',
    notes: 'Must complete an Illinois-approved program. Out-of-state training not accepted without reciprocity.',
  },
  {
    state: 'Ohio',
    code: 'OH',
    available: false,
    unavailableReason: 'Ohio requires CNA training to be completed at an Ohio-approved facility. Reciprocity available if you hold an active Indiana CNA license.',
    requirementsUrl: 'https://odh.ohio.gov/know-our-programs/nurse-aide-registry/nurse-aide-registry',
    boardName: 'Ohio Department of Health — Nurse Aide Registry',
    notes: 'Indiana CNA holders may apply for Ohio reciprocity without retesting if license is active and in good standing.',
  },
  {
    state: 'Michigan',
    code: 'MI',
    available: false,
    unavailableReason: 'Michigan requires training at a Michigan-approved program. Reciprocity available for active Indiana CNA license holders.',
    requirementsUrl: 'https://www.michigan.gov/lara/bureau-list/bpl/occ/health-professions/nurse-aide',
    boardName: 'Michigan Department of Licensing and Regulatory Affairs',
    notes: 'Active Indiana CNA license holders may apply for Michigan endorsement.',
  },
  {
    state: 'Kentucky',
    code: 'KY',
    available: false,
    unavailableReason: 'Kentucky requires training at a Kentucky-approved program. Reciprocity available for active Indiana CNA license holders.',
    requirementsUrl: 'https://chfs.ky.gov/agencies/os/oig/hcb/Pages/nurseaideregistry.aspx',
    boardName: 'Kentucky Cabinet for Health and Family Services',
    notes: 'Active Indiana CNA license holders may apply for Kentucky reciprocity.',
  },
  {
    state: 'Tennessee',
    code: 'TN',
    available: false,
    unavailableReason: 'Tennessee requires training at a Tennessee-approved program. Reciprocity available for active Indiana CNA license holders.',
    requirementsUrl: 'https://www.tn.gov/health/health-program-areas/health-professional-boards/nurse-aide-registry.html',
    boardName: 'Tennessee Department of Health — Nurse Aide Registry',
    notes: 'Active Indiana CNA license holders may apply for Tennessee reciprocity.',
  },
  {
    state: 'Wisconsin',
    code: 'WI',
    available: false,
    unavailableReason: 'Wisconsin requires training at a Wisconsin-approved program.',
    requirementsUrl: 'https://www.dhs.wisconsin.gov/caregiver/nurse-aide.htm',
    boardName: 'Wisconsin Department of Health Services',
    notes: 'Active Indiana CNA license holders may apply for Wisconsin reciprocity.',
  },
  {
    state: 'Missouri',
    code: 'MO',
    available: false,
    unavailableReason: 'Missouri requires training at a Missouri-approved program.',
    requirementsUrl: 'https://health.mo.gov/safety/natp/',
    boardName: 'Missouri Department of Health and Senior Services',
    notes: 'Active Indiana CNA license holders may apply for Missouri reciprocity.',
  },
  {
    state: 'Florida',
    code: 'FL',
    available: false,
    unavailableReason: 'Florida has its own CNA training and testing requirements. Out-of-state training not accepted without Florida approval.',
    requirementsUrl: 'https://ahca.myflorida.com/Medicaid/Long_Term_Care/Nurse_Aide_Registry/',
    boardName: 'Florida Agency for Health Care Administration',
    notes: 'Florida does not accept reciprocity from Indiana. Must complete a Florida-approved program.',
  },
  {
    state: 'Texas',
    code: 'TX',
    available: false,
    unavailableReason: 'Texas requires training at a Texas-approved program. No reciprocity with Indiana.',
    requirementsUrl: 'https://www.hhs.texas.gov/providers/long-term-care-providers/nurse-aide-training-competency-evaluation-program-natcep',
    boardName: 'Texas Health and Human Services',
    notes: 'Texas does not accept out-of-state CNA training. Must complete a Texas-approved program.',
  },
  {
    state: 'California',
    code: 'CA',
    available: false,
    unavailableReason: 'California has its own CNA certification requirements and does not accept Indiana training.',
    requirementsUrl: 'https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/AIDE.aspx',
    boardName: 'California Department of Public Health',
    notes: 'California requires 160 hours of training at a California-approved program.',
  },
  {
    state: 'New York',
    code: 'NY',
    available: false,
    unavailableReason: 'New York requires training at a New York State-approved program.',
    requirementsUrl: 'https://www.health.ny.gov/facilities/nursing/nurse_aide/',
    boardName: 'New York State Department of Health',
    notes: 'Active Indiana CNA license holders may apply for New York reciprocity if license is current.',
  },
];

export const PHLEBOTOMY_STATE_LICENSING: StateLicensingInfo[] = [
  {
    state: 'Indiana',
    code: 'IN',
    available: true,
    requirementsUrl: 'https://www.in.gov/isdh/',
    boardName: 'Indiana State Department of Health',
    notes: 'Indiana does not require state licensure for phlebotomists. National certification (NHA CPT, ASCP PBT, or AMT RPT) is accepted by employers. Elevate prepares students for NHA CPT exam.',
  },
  {
    state: 'California',
    code: 'CA',
    available: false,
    unavailableReason: 'California is the only state that requires phlebotomists to hold a state-issued license (CPT I or CPT II). Training must be completed at a California-approved program.',
    requirementsUrl: 'https://www.cdph.ca.gov/Programs/OSPHLD/LFS/Pages/PhlebotomyTechnician.aspx',
    boardName: 'California Department of Public Health — Laboratory Field Services',
    notes: 'California CPT license requires 40 hours classroom + 40 hours clinical at a CA-approved site. Indiana training does not qualify.',
  },
  {
    state: 'Louisiana',
    code: 'LA',
    available: false,
    unavailableReason: 'Louisiana requires phlebotomists to be licensed by the Louisiana State Board of Medical Examiners.',
    requirementsUrl: 'https://www.lsbme.la.gov/',
    boardName: 'Louisiana State Board of Medical Examiners',
    notes: 'Louisiana requires state licensure. National certification alone is not sufficient.',
  },
  {
    state: 'Nevada',
    code: 'NV',
    available: false,
    unavailableReason: 'Nevada requires phlebotomists to hold a state license issued by the Nevada State Board of Health.',
    requirementsUrl: 'https://dpbh.nv.gov/',
    boardName: 'Nevada Division of Public and Behavioral Health',
    notes: 'Nevada requires state licensure in addition to national certification.',
  },
  {
    state: 'Washington',
    code: 'WA',
    available: false,
    unavailableReason: 'Washington State requires phlebotomists to hold a state credential issued by the Department of Health.',
    requirementsUrl: 'https://www.doh.wa.gov/LicensesPermitsandCertificates/ProfessionsNewReneworUpdate/MedicalTestSitesClinicalLaboratories',
    boardName: 'Washington State Department of Health',
    notes: 'Washington requires state certification. National certification alone is not sufficient.',
  },
  {
    state: 'Illinois',
    code: 'IL',
    available: true,
    requirementsUrl: 'https://idfpr.illinois.gov/',
    boardName: 'Illinois Department of Financial and Professional Regulation',
    notes: 'Illinois does not require state licensure for phlebotomists. National certification (NHA CPT, ASCP PBT) accepted by employers.',
  },
  {
    state: 'Ohio',
    code: 'OH',
    available: true,
    requirementsUrl: 'https://odh.ohio.gov/',
    boardName: 'Ohio Department of Health',
    notes: 'Ohio does not require state licensure for phlebotomists. National certification accepted by employers.',
  },
  {
    state: 'Michigan',
    code: 'MI',
    available: true,
    requirementsUrl: 'https://www.michigan.gov/lara',
    boardName: 'Michigan Department of Licensing and Regulatory Affairs',
    notes: 'Michigan does not require state licensure for phlebotomists. National certification accepted by employers.',
  },
  {
    state: 'Kentucky',
    code: 'KY',
    available: true,
    requirementsUrl: 'https://chfs.ky.gov/',
    boardName: 'Kentucky Cabinet for Health and Family Services',
    notes: 'Kentucky does not require state licensure for phlebotomists. National certification accepted by employers.',
  },
  {
    state: 'Tennessee',
    code: 'TN',
    available: true,
    requirementsUrl: 'https://www.tn.gov/health.html',
    boardName: 'Tennessee Department of Health',
    notes: 'Tennessee does not require state licensure for phlebotomists. National certification accepted by employers.',
  },
  {
    state: 'Florida',
    code: 'FL',
    available: true,
    requirementsUrl: 'https://ahca.myflorida.com/',
    boardName: 'Florida Agency for Health Care Administration',
    notes: 'Florida does not require state licensure for phlebotomists. National certification accepted by employers.',
  },
  {
    state: 'Texas',
    code: 'TX',
    available: true,
    requirementsUrl: 'https://www.hhs.texas.gov/',
    boardName: 'Texas Health and Human Services',
    notes: 'Texas does not require state licensure for phlebotomists. National certification accepted by employers.',
  },
  {
    state: 'New York',
    code: 'NY',
    available: true,
    requirementsUrl: 'https://www.health.ny.gov/',
    boardName: 'New York State Department of Health',
    notes: 'New York does not require state licensure for phlebotomists. National certification accepted by employers.',
  },
];
