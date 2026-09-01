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
    totalHours: 2000,
    hoursLabel: '2,000 hours',
    ojtDescription:
      'Work in a licensed barbershop under a mentor barber. Learn real skills with real clients.',
    rtiDescription:
      'Complete Prestige Elevation Barber Curriculum online through Elevate LMS. Learn sanitation, anatomy, and business skills.',
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
    programTitle: 'Cosmetology Apprenticeship',
    licenseTitle: 'Indiana Cosmetology License',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    salaryRange: '$30,000 - $65,000+',
    totalHours: 2000,
    hoursLabel: '2,000 hours',
    ojtDescription:
      'Work in a licensed salon under a supervising cosmetologist. Perform real services on real clients while earning a wage from day one.',
    rtiDescription:
      'Complete Milady theory courses online through the Elevate LMS. Covers hair, skin, nail techniques, sanitation, infection control, and salon business skills.',
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
    totalHours: 450,
    hoursLabel: '450 hours',
    ojtDescription:
      'Work in a licensed nail salon under a supervising nail technician. Perform real services on real clients while earning a wage from day one.',
    rtiDescription:
      'Complete theory courses online through the Elevate LMS. Covers nail anatomy, sanitation, manicuring, pedicuring, nail enhancements, and Indiana nail tech law.',
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
    totalHours: 450,
    hoursLabel: '450 hours',
    ojtDescription:
      'Work in a licensed salon under a mentor. Practice manicures, pedicures, and nail art with real clients.',
    rtiDescription:
      'Complete theory courses online. Learn nail anatomy, sanitation, and business skills.',
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
