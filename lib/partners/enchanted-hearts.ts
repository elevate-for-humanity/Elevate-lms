export const ENCHANTED_HEARTS = {
  programHolderId: 'ac01769d-c1d9-496c-981e-f7963e6d0f48',
  name: 'Enchanted Hearts Training Institute',
  homeCareName: 'Enchanted Hearts Home Care',
  trainingUrl: 'https://enchantedheartstraining.com/',
  homeCareUrl: 'https://enchantedheartsllc.com/',
  logoUrl:
    'https://enchantedheartstraining.com/wp-content/uploads/2025/11/EH-Training-Institute-Logo.png',
  programs: [
    {
      slug: 'cna',
      title: 'Certified Nurse Aide (CNA) Training',
      duration: '4 weeks · 105 hours',
      providerShareCents: 110_000,
      retailPriceCents: 180_000,
      summary: 'Classroom, lab, and clinical preparation for the Indiana CNA examination.',
    },
    {
      slug: 'enchanted-hearts-cna-fast-track',
      title: 'CNA Fast-Track',
      duration: '16 hours',
      providerShareCents: 40_000,
      retailPriceCents: 70_000,
      summary: 'Accelerated CNA preparation for qualifying nursing students.',
    },
    {
      slug: 'home-health-aide',
      title: 'Home Health Aide (HHA) Training',
      duration: '2 weeks · 75 hours',
      providerShareCents: 39_900,
      retailPriceCents: 69_900,
      summary: 'Home-care and private-duty preparation that builds on foundational care skills.',
    },
    {
      slug: 'qma',
      title: 'Qualified Medication Aide (QMA)',
      duration: '4 weeks · 60 classroom/lab hours plus clinical requirements',
      providerShareCents: 110_000,
      retailPriceCents: 180_000,
      summary: 'Medication-aide education for eligible CNAs preparing for certification.',
    },
    {
      slug: 'enchanted-hearts-qma-insulin',
      title: 'QMA Insulin Administration Certification',
      duration: '1–2 days · 6–12 hours',
      providerShareCents: 27_500,
      retailPriceCents: 47_500,
      summary: 'Focused insulin-administration training for qualified medication aides.',
    },
    {
      slug: 'enchanted-hearts-cna-qma-remediation',
      title: 'CNA / QMA Remediation',
      duration: '1–2 weeks · 6–16 hours',
      providerShareCents: 25_000,
      retailPriceCents: 45_000,
      summary: 'Targeted skills refresh and readiness support.',
    },
    {
      slug: 'enchanted-hearts-cpr-certification',
      title: 'CPR Certification',
      duration: 'One 4-hour in-person session',
      providerShareCents: 7_500,
      retailPriceCents: 12_500,
      summary: 'Instructor-led CPR certification training.',
    },
    {
      slug: 'enchanted-hearts-cpr-instructor',
      title: 'CPR Instructor Course',
      duration: 'One day after the required online module',
      providerShareCents: 45_000,
      retailPriceCents: 75_000,
      summary: 'Instructor preparation aligned to CPR/BLS teaching requirements.',
    },
    {
      slug: 'enchanted-hearts-tb-validation',
      title: 'TB Validation',
      duration: 'Appointment or small-group session',
      providerShareCents: 15_000,
      retailPriceCents: 25_000,
      summary: 'Skills validation for approved tuberculosis testing procedures.',
    },
    {
      slug: 'enchanted-hearts-skills-lab',
      title: 'Skills & Lab Practice',
      duration: 'Up to 3 hours',
      providerShareCents: 3_500,
      retailPriceCents: 7_500,
      summary: 'Supervised practice time for healthcare skills and remediation.',
    },
  ],
} as const;

export function getEnchantedHeartsProgram(slug: string) {
  return ENCHANTED_HEARTS.programs.find((program) => program.slug === slug) ?? null;
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
