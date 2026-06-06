import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export interface EtplAlignmentProfile {
  programId: string;
  label: string;
  // Is this program on ETPL currently?
  onETPL: boolean;
  etplProgramName?: string;
  etplProviderId?: string;
  // State / federal alignment flags
  wrgEligible: boolean;
  wioaAdultEligible: boolean;
  wioaYouthEligible: boolean;
  jriIntegrated: boolean;
  vitaRelated: boolean;
  apprenticeshipRelated: boolean;
  // Notes for staff
  internalNotes: string;
}

export const etplAlignmentProfiles: EtplAlignmentProfile[] = [
  {
    programId: 'prog-cna',
    label: 'CNA Training',
    onETPL: true,
    etplProgramName: 'Certified Nursing Assistant (CNA)',
    etplProviderId: '10000949',
    wrgEligible: true,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: false,
    internalNotes:
      'CNA is currently configured as a non-state-funded program in your notes. Treat this as employer-sponsored + philanthropy + payment plan. If ETPL status changes, update here.',
  },
  {
    programId: 'prog-barber',
    label: 'Barber Apprenticeship',
    onETPL: true,
    etplProgramName: 'Barber Apprenticeship (' + PLATFORM_DEFAULTS.orgName + ' CTI)',
    etplProviderId: 'ETPL-IND-XXXX-BARB',
    wrgEligible: false,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Barber is an apprenticeship-style program. Confirm apprenticeship registration number and attach in internal docs + ETPL file when final.',
  },
  {
    programId: 'prog-tax-vita',
    label: 'Tax & VITA Track',
    onETPL: false,
    wrgEligible: false,
    wioaAdultEligible: false,
    wioaYouthEligible: true,
    jriIntegrated: true,
    vitaRelated: true,
    apprenticeshipRelated: false,
    internalNotes:
      'JRI-aligned VITA track. Focus on youth and community volunteers; funding is usually grant-based rather than tuition-based. Use IRS Link & Learn + VITA resources.',
  },
  {
    programId: 'prog-hvac',
    label: 'HVAC Technician Pathway',
    onETPL: true,
    etplProgramName: 'HVAC Technician Pathway',
    etplProviderId: 'ETPL-IND-XXXX-HVAC',
    wrgEligible: true,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Core skilled trades program. Align closely with WRG/WIOA documentation and employer apprenticeships. Watch hours, credentials, and outcomes for renewals.',
  },
  {
    programId: 'prog-cdl',
    label: 'CDL Training Pathway',
    onETPL: true,
    etplProgramName: 'CDL Training (CDL-A/B)',
    etplProviderId: 'ETPL-IND-XXXX-CDL',
    wrgEligible: true,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: false,
    internalNotes:
      'CDL is usually WRG/WIOA aligned. Confirm provider-of-record for ETPL if using a partner school. Clearly define your role as training provider vs broker.',
  },
  {
    programId: 'prog-business-apprentice',
    label: 'Business Support Apprenticeship',
    onETPL: true,
    etplProgramName: 'Business Support Apprenticeship',
    etplProviderId: 'ETPL-IND-XXXX-BUS',
    wrgEligible: true,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: true,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Great for young adults and career-switchers. Combine soft skills, digital literacy, and on-the-job office roles. Track retention and wage growth.',
  },
  {
    programId: 'prog-ems-apprentice',
    label: 'EMS & Healthcare Support Apprenticeship',
    onETPL: true,
    etplProgramName: 'EMS & Healthcare Support Apprenticeship',
    etplProviderId: 'ETPL-IND-XXXX-EMS',
    wrgEligible: true,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Confirm alignment with any local EMS/hospital consortiums. Use National Drug / healthcare partners as credential backbone.',
  },
  {
    programId: 'prog-building-tech-apprentice',
    label: 'Building Maintenance & Technician Apprenticeship',
    onETPL: true,
    etplProgramName: 'Building Maintenance & Technician Apprenticeship',
    etplProviderId: 'ETPL-IND-XXXX-BLDG',
    wrgEligible: true,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Track employer partners across property management and facilities. Strong candidate for innovative WEX/OJT models under new DOL guidance.',
  },
  {
    programId: 'prog-culinary-apprentice',
    label: 'Culinary & Kitchen Apprenticeship',
    onETPL: false,
    wrgEligible: false,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Treat as apprenticeship with potential for future ETPL listing. Good pilot space for waivers and innovative models under TEGL 05-25.',
  },
  {
    programId: 'prog-esthetics-apprentice',
    label: 'Esthetics Apprenticeship',
    onETPL: false,
    wrgEligible: false,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Beauty programs often sit in gray areas of workforce funding. Use philanthropy + employer-pay + possible youth funds.',
  },
  {
    programId: 'prog-nails-apprentice',
    label: 'Nail Technician Apprenticeship',
    onETPL: false,
    wrgEligible: false,
    wioaAdultEligible: true,
    wioaYouthEligible: true,
    jriIntegrated: false,
    vitaRelated: false,
    apprenticeshipRelated: true,
    internalNotes:
      'Similar handling to esthetics. Strong story for entrepreneurship + small business pipelines.',
  },
];
