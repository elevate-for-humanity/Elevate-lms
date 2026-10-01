/**
 * Orientation configuration for each program.
 * Contains program-specific details shown during the enrollment orientation flow.
 */

export interface OrientationProgramConfig {
  programSlug: string;
  programTitle: string;
  licenseTitle: string;
  licensingBody: string;
  salaryRange: string;
  totalHours: number;
  hoursLabel: string;
  ojtDescription: string;
  rtiDescription: string;
  tuition: {
    total: number;
    setupFeePercent: number;
    paymentFrequency: string;
    fundingNote: string;
  };
  accentColor: string;
  estimatedTime: string;
}

export const orientationConfigs: Record<string, OrientationProgramConfig> = {
  'barber-apprenticeship': {
    programSlug: 'barber-apprenticeship',
    programTitle: 'Barber Apprenticeship',
    licenseTitle: 'Indiana Barber License',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    salaryRange: '$35,000 - $75,000+',
    totalHours: 260,
    hoursLabel: '14 competencies + 260 RTI hours',
    ojtDescription:
      'Complete and document all 14 registered Appendix A competencies through supervised barbershop practice. Work hours are training evidence, not a fixed completion denominator.',
    rtiDescription:
      'Complete 260 verified hours of Related Technical Instruction. The 500-hour figure is the probationary period, not graduation.',
    tuition: {
      total: 4980,
      setupFeePercent: 35,
      paymentFrequency: 'Billed every Friday',
      fundingNote:
        'If you received funding approval (WRG, WIOA, employer sponsorship), your costs may be partially or fully covered. Check your enrollment confirmation for details.',
    },
    accentColor: 'blue',
    estimatedTime: '10-12 minutes',
  },
  'esthetician-apprenticeship': {
    programSlug: 'esthetician-apprenticeship',
    programTitle: 'Esthetician Apprenticeship Pathway',
    licenseTitle: 'Indiana Esthetician License',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    salaryRange: 'Varies by employer, experience, and service model',
    totalHours: 300,
    hoursLabel: '20 competencies plus 300 RTI hours',
    ojtDescription:
      'Complete supervised esthetics practice at an approved spa or salon site with documented client-care, sanitation, skin-analysis, treatment, and professional-practice activities.',
    rtiDescription:
      'Complete 300 hours of related esthetics instruction covering skin science, sanitation, safety, client consultation, documentation, and licensing preparation while demonstrating all 20 Appendix A competencies.',
    tuition: {
      total: 4980,
      setupFeePercent: 0,
      paymentFrequency: 'Options shown at checkout',
      fundingNote:
        'This pathway is published as self-pay. Any employer or workforce funding must be verified and authorized in writing for the individual participant before enrollment.',
    },
    accentColor: 'purple',
    estimatedTime: '8-10 minutes',
  },
  'cosmetology-apprenticeship': {
    programSlug: 'cosmetology-apprenticeship',
    programTitle: 'Hair Stylist / Cosmetology Apprenticeship',
    licenseTitle: 'Indiana Cosmetology License',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    salaryRange: '$30,000 - $65,000+',
    totalHours: 2000,
    hoursLabel: '2,000–2,500-hour hybrid term + 154 RTI hours',
    ojtDescription:
      'RAPIDS 0096HY V1 uses a hybrid 2,000–2,500-hour term with supervised salon work-process training. The 500-hour figure is probation, not graduation.',
    rtiDescription:
      'Complete 154 verified RTI hours alongside the registered hybrid work-process requirements.'
    tuition: {
      total: 0,
      setupFeePercent: 0,
      paymentFrequency: 'N/A — earn-while-you-learn apprenticeship',
      fundingNote:
        'This is a paid apprenticeship. You earn wages from your host salon throughout training. There is no tuition. Most apprentices also qualify for WIOA or Workforce Ready Grant support for tools and exam fees.',
    },
    accentColor: 'purple',
    estimatedTime: '10-12 minutes',
  },
  'nail-tech-apprenticeship': {
    programSlug: 'nail-tech-apprenticeship',
    programTitle: 'Nail Technician Apprenticeship',
    licenseTitle: 'Indiana Nail Technician License',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    salaryRange: '$28,000 - $55,000+',
    totalHours: 210,
    hoursLabel: '19 competencies + 210 RTI hours',
    ojtDescription:
      'Complete and document all 19 registered Appendix A competencies through supervised nail-salon practice. Work hours are training evidence, not a fixed completion denominator.'
    rtiDescription:
      'Complete 210 verified RTI hours covering the registered Manicurist instructional outline. The 500-hour figure is probation, not graduation.'
    tuition: {
      total: 2490,
      setupFeePercent: 35,
      paymentFrequency: 'Billed every Friday',
      fundingNote:
        'If you received funding approval (WRG, WIOA, employer sponsorship), your costs may be partially or fully covered. Check your enrollment confirmation for details.',
    },
    accentColor: 'pink',
    estimatedTime: '6-8 minutes',
  },
  'nail-technician-apprenticeship': {
    programSlug: 'nail-technician-apprenticeship',
    programTitle: 'Nail Technician Apprenticeship',
    licenseTitle: 'Indiana Nail Technician License',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    salaryRange: '$28,000 - $55,000+',
    totalHours: 210,
    hoursLabel: '19 competencies + 210 RTI hours',
    ojtDescription:
      'Complete and document all 19 registered Appendix A competencies through supervised nail-salon practice. Work hours are training evidence, not a fixed completion denominator.'
    rtiDescription:
      'Complete 210 verified RTI hours covering the registered Manicurist instructional outline. The 500-hour figure is probation, not graduation.'
    tuition: {
      total: 2500,
      setupFeePercent: 35,
      paymentFrequency: 'Billed every Friday',
      fundingNote:
        'If you received funding approval (WRG, WIOA, employer sponsorship), your costs may be partially or fully covered. Check your enrollment confirmation for details.',
    },
    accentColor: 'pink',
    estimatedTime: '8-10 minutes',
  },
};

export function getOrientationConfig(programSlug: string): OrientationProgramConfig | undefined {
  return orientationConfigs[programSlug];
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return 'FREE';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
