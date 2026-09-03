import type { PartnerCourse } from '@/types/partnerCourse';

// Example partner course definitions.
// Replace baseCost & descriptions with your real data from your repository.

export const partnerCourses: PartnerCourse[] = [
  // CNA
  {
    id: 'hsi-cna-main',
    partnerSystem: 'HSI',
    partnerCode: 'HSI-CNA-CORE',
    title: 'HSI / Choice Medical CNA Core Training',
    description: 'Core CNA theory and skills preparation aligned to Indiana CNA exam.',
    hours: 80,
    baseCost: 300,
  },
  {
    id: 'nationaldrug-basic',
    partnerSystem: 'NATIONAL_DRUG',
    partnerCode: 'ND-DFW-HEALTH',
    title: 'Drug-Free Workplace Training for Healthcare',
    description: 'Drug-free workplace & compliance module for healthcare roles.',
    hours: 4,
    baseCost: 40,
  },
  {
    id: 'careersafe-cna-safety',
    partnerSystem: 'CAREERSAFE',
    partnerCode: 'CS-HEALTH-SAFETY',
    title: 'CareerSafe Healthcare Safety Basics',
    description: 'OSHA basics, infection control, and patient safety concepts.',
    hours: 8,
    baseCost: 60,
  },

  // Barber
  {
    id: 'milady-barber-theory',
    partnerSystem: 'MILADY',
    partnerCode: 'MILADY-BARBER-ONLINE',
    title: 'Milady Barbering Online Theory',
    description: 'Core barber theory content delivered through Milady.',
    hours: 150,
    baseCost: 250,
  },
  {
    id: 'nationaldrug-barber',
    partnerSystem: 'NATIONAL_DRUG',
    partnerCode: 'ND-DFW-BEAUTY',
    title: 'Drug-Free Workplace Training for Barber/Beauty',
    description: 'Drug-free workplace module geared toward salon/barber environments.',
    hours: 2,
    baseCost: 35,
  },

  // HVAC / Building Tech
  {
    id: 'careersafe-hvac-osha',
    partnerSystem: 'CAREERSAFE',
    partnerCode: 'CS-HVAC-OSHA',
    title: 'CareerSafe OSHA & Safety for HVAC / Building Tech',
    description: 'Safety fundamentals for HVAC, building maintenance, and facilities tech roles.',
    hours: 10,
    baseCost: 70,
  },
  {
    id: 'nationaldrug-hvac',
    partnerSystem: 'NATIONAL_DRUG',
    partnerCode: 'ND-DFW-TRADES',
    title: 'Drug-Free Workplace Training for Skilled Trades',
    description: 'Drug-free workplace training for HVAC and building trades environments.',
    hours: 2,
    baseCost: 35,
  },

  // CDL / Transportation
  {
    id: 'nationaldrug-cdl',
    partnerSystem: 'NATIONAL_DRUG',
    partnerCode: 'ND-DOT-CDL',
    title: 'DOT / CDL Drug & Alcohol Awareness',
    description: 'DOT-compliant drug and alcohol awareness training for CDL candidates.',
    hours: 3,
    baseCost: 45,
  },
  {
    id: 'careersafe-cdl-safety',
    partnerSystem: 'CAREERSAFE',
    partnerCode: 'CS-TRANSPORT-SAFETY',
    title: 'CareerSafe Transportation & Roadway Safety',
    description: 'Safety concepts for commercial driving and transportation roles.',
    hours: 6,
    baseCost: 60,
  },

  // Customer Service / Office
  {
    id: 'rise-customer-service',
    partnerSystem: 'RISE',
    partnerCode: 'RISE-CUST-SVC',
    title: 'Rise Customer Service Fundamentals',
    description: 'Customer service and communication modules delivered through Rise.',
    hours: 10,
    baseCost: 60,
  },
  {
    id: 'certiport-customer-service',
    partnerSystem: 'CERTIPORT',
    partnerCode: 'CERTI-CUST-SVC',
    title: 'Certiport Customer Service Certification Prep',
    description: 'Exam preparation content for a customer service credential.',
    hours: 15,
    baseCost: 90,
  },

  // IT Support
  {
    id: 'certiport-it-specialist-core',
    partnerSystem: 'CERTIPORT',
    partnerCode: 'CERTI-IT-SPECIALIST-CORE',
    title: 'Certiport IT Specialist – Core',
    description: 'Foundational IT support concepts including devices, OS, basic troubleshooting.',
    hours: 25,
    baseCost: 120,
  },
  {
    id: 'certiport-it-networking',
    partnerSystem: 'CERTIPORT',
    partnerCode: 'CERTI-IT-NETWORKING',
    title: 'Certiport IT Specialist – Networking',
    description: 'Intro to networking concepts, protocols, and support skills.',
    hours: 20,
    baseCost: 110,
  },

  // Entrepreneurship
  {
    id: 'certiport-esb',
    partnerSystem: 'CERTIPORT',
    partnerCode: 'CERTI-ESB',
    title: 'Certiport Entrepreneurship and Small Business (ESB)',
    description: 'Entrepreneurship and small business basics for starting or growing a business.',
    hours: 20,
    baseCost: 110,
  },

  // Building Maintenance / Facilities
  {
    id: 'careersafe-building-safety',
    partnerSystem: 'CAREERSAFE',
    partnerCode: 'CS-BUILDING-SAFETY',
    title: 'CareerSafe Building & Facilities Safety',
    description: 'Safety and hazard awareness for building maintenance roles.',
    hours: 8,
    baseCost: 70,
  },
  {
    id: 'nationaldrug-building',
    partnerSystem: 'NATIONAL_DRUG',
    partnerCode: 'ND-DFW-MAINT',
    title: 'Drug-Free Workplace Training for Building Maintenance',
    description: 'Drug-free workplace training for facilities and maintenance staff.',
    hours: 2,
    baseCost: 35,
  },

  // Tax Preparation / VITA
  {
    id: 'irs-vita-training',
    partnerSystem: 'RISE',
    partnerCode: 'IRS-VITA-CORE',
    title: 'IRS VITA Tax Preparation Training',
    description:
      'IRS Volunteer Income Tax Assistance training covering tax law basics, ethics, and return preparation.',
    hours: 30,
    baseCost: 350,
  },
  {
    id: 'rise-tax-customer-service',
    partnerSystem: 'RISE',
    partnerCode: 'RISE-TAX-CS',
    title: 'Rise Customer Service for Tax Professionals',
    description: 'Client communication and service skills for tax preparation environments.',
    hours: 8,
    baseCost: 50,
  },
];

export function getPartnerCourseById(id: string): PartnerCourse | undefined {
  return partnerCourses.find((c) => c.id === id);
}
