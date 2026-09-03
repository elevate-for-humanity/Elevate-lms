import type { Program, ProgramWithPartners } from '@/types/program';
import { partnerCourses, getPartnerCourseById } from './partners/sample-partners';

function computeSalePrice(partnerIds: string[], markupMultiplier: number): number {
  const base = partnerIds.reduce((sum, id) => {
    const pc = getPartnerCourseById(id);
    return sum + (pc?.baseCost ?? 0);
  }, 0);
  return Math.round(base * markupMultiplier);
}

// ===== CNA =====
const cnaPartnerIds = ['hsi-cna-main', 'nationaldrug-basic', 'careersafe-cna-safety'];

const cnaProgram: Program = {
  id: 'prog-cna',
  slug: 'cna',
  title: 'Certified Nursing Assistant (CNA)',
  subtitle: 'Approved CNA training pathway',
  description:
    'Gain hands-on healthcare experience and prepare for Indiana CNA certification. This pathway blends HSI/Choice Medical CNA core training with CareerSafe healthcare safety basics and National Drug workplace training, plus soft skills support tied to local healthcare employers.',
  deliveryEngine: 'NATIVE',
  salePrice: computeSalePrice(cnaPartnerIds, 1.5),
  partnerRequirements: cnaPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'CNA tuition is self-pay or employer-pay. Students may still qualify for paid Work Experience (WEX), JRI stipends, and OJT-supported employment after training.',
  visiblePublic: true,
};

// ===== BARBER (APPRENTICESHIP) =====
const barberPartnerIds = ['milady-barber-theory', 'nationaldrug-barber'];

const barberProgram: Program = {
  id: 'prog-barber',
  slug: 'barber-apprenticeship',
  title: 'Barber Apprenticeship',
  subtitle: 'FREE Earn-While-You-Learn barber apprenticeship program',
  description:
    'Milady barber theory plus in-shop apprenticeship hours under licensed barbers. Learners build real client experience, sanitation skills, and business habits while moving toward licensure. This pathway combines Milady barbering online theory with National Drug workplace training for barber/beauty environments. This apprenticeship program is FREE - you earn while you learn.',
  deliveryEngine: 'NATIVE',
  salePrice: 0,
  partnerRequirements: barberPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Paid shop hours while completing training and building apprenticeship hours toward licensure. Employers may also choose to reimburse or cover tuition.',
  visiblePublic: true,
};

// ===== HVAC / BUILDING TECH =====
const hvacPartnerIds = ['careersafe-hvac-osha', 'nationaldrug-hvac'];

const hvacProgram: Program = {
  id: 'prog-hvac',
  slug: 'hvac-tech',
  title: 'HVAC & Building Technician Career Pathway',
  subtitle: 'Heating, ventilation, and air conditioning training aligned with employers.',
  description:
    'This pathway introduces learners to residential and light commercial HVAC systems, safety, tools, troubleshooting, and customer interaction. It combines CareerSafe OSHA training with drug-free workplace standards and can connect to employer partners for entry-level helper roles or OJT.',
  deliveryEngine: 'NATIVE',
  salePrice: computeSalePrice(hvacPartnerIds, 1.5),
  partnerRequirements: hvacPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Learners may transition into helper or apprentice roles with employer partners while completing training, with opportunities for WEX placements and OJT-supported employment.',
  visiblePublic: true,
};

// ===== CDL / TRANSPORTATION =====
const cdlPartnerIds = ['nationaldrug-cdl', 'careersafe-cdl-safety'];

const cdlProgram: Program = {
  id: 'prog-cdl',
  slug: 'cdl',
  title: 'CDL & Transportation Support Pathway',
  subtitle: 'Prep and support for CDL training and transportation careers.',
  description:
    'This pathway focuses on CDL test prep, DOT drug & alcohol awareness, transportation safety, trip planning, and soft skills for transportation careers. It includes National Drug DOT compliance training and CareerSafe transportation safety, and can connect learners to third-party CDL schools and employers needing drivers or support roles.',
  deliveryEngine: 'NATIVE',
  salePrice: computeSalePrice(cdlPartnerIds, 1.5),
  partnerRequirements: cdlPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Some learners may be eligible for WEX/OJT or employer-sponsored training while moving into transportation roles.',
  visiblePublic: true,
};

// ===== CUSTOMER SERVICE PRO =====
const customerServicePartnerIds = ['rise-customer-service', 'certiport-customer-service'];

const customerServiceProgram: Program = {
  id: 'prog-customer-service',
  slug: 'customer-service-pro',
  title: 'Customer Service & Contact Center',
  subtitle: 'Customer care, call center, and front-line service skills.',
  description:
    'This pathway builds communication, de-escalation, documentation, and system navigation skills needed for contact center, front desk, or customer-facing roles in multiple industries. It combines Rise customer service fundamentals with Certiport certification prep and professional communication training.',
  deliveryEngine: 'NATIVE',
  salePrice: computeSalePrice(customerServicePartnerIds, 1.5),
  partnerRequirements: customerServicePartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Ideal for WEX/OJT placements with employers needing reliable customer service talent.',
  visiblePublic: true,
};

// ===== IT SUPPORT HELPDESK =====
const itPartnerIds = ['certiport-it-specialist-core', 'certiport-it-networking'];

const itProgram: Program = {
  id: 'prog-it-support',
  slug: 'it-support-helpdesk',
  title: 'IT Support & Helpdesk',
  subtitle: 'Entry-level IT support skills for helpdesk and support roles.',
  description:
    'This pathway covers hardware basics, operating systems, troubleshooting, tickets, and customer support. It uses Certiport IT Specialist content for core IT and networking concepts, and can align with industry-recognized IT support certifications for remote or on-site helpdesk roles.',
  deliveryEngine: 'NATIVE',
  salePrice: computeSalePrice(itPartnerIds, 1.5),
  partnerRequirements: itPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Learners may qualify for earn-while-you-learn opportunities in IT support, especially through WEX/OJT or employer partnerships.',
  visiblePublic: true,
};

// ===== ENTREPRENEURSHIP =====
const entrepreneurshipPartnerIds = ['certiport-esb'];

const entrepreneurshipProgram: Program = {
  id: 'prog-entrepreneurship',
  slug: 'entrepreneurship-small-business',
  title: 'Entrepreneurship & Small Business Pathway',
  subtitle: 'Certiport ESB plus EFH coaching for learners who want to start or grow a business.',
  description:
    'This pathway is for learners who want to turn ideas into income. It combines Certiport ESB content with Elevate coaching around planning, marketing, money management, and execution.',
  deliveryEngine: 'NATIVE',
  salePrice: computeSalePrice(entrepreneurshipPartnerIds, 1.5),
  partnerRequirements: entrepreneurshipPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Learners may continue to work in other roles while building their business, and may qualify for WEX or OJT if entrepreneurship pathways include employer-based roles.',
  visiblePublic: true,
};

// ===== BUILDING MAINTENANCE / FACILITIES =====
const buildingMaintPartnerIds = ['careersafe-building-safety', 'nationaldrug-building'];

const buildingMaintenanceProgram: Program = {
  id: 'prog-building-maintenance',
  slug: 'building-tech',
  title: 'Building Maintenance Technician Apprenticeship',
  subtitle: 'FREE facilities and building systems apprenticeship program.',
  description:
    'This pathway prepares learners for building and facilities maintenance roles. Topics include basic electrical, plumbing, painting, safety checks, and work order systems while working alongside experienced maintenance staff. It combines CareerSafe building safety training with drug-free workplace standards. This apprenticeship program is FREE - you earn while you learn.',
  deliveryEngine: 'NATIVE',
  salePrice: 0,
  partnerRequirements: buildingMaintPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Apprentices support real properties and facilities while earning wages and building experience.',
  visiblePublic: true,
};

// ===== TAX PREPARATION / VITA =====
const taxPartnerIds = ['irs-vita-training', 'rise-tax-customer-service'];

const taxProgram: Program = {
  id: 'prog-tax-vita',
  slug: 'tax-vita',
  title: 'Tax Preparation & IRS VITA Pathway',
  subtitle: 'Serve the community and build tax preparation skills for seasonal or year-round work.',
  description:
    'This pathway trains learners to support free tax preparation through IRS VITA/TCE standards and basic individual tax prep. It blends IRS Link & Learn training, ethics, intake/interview skills, and practice with real returns in a supervised environment. Includes IRS VITA certification training and Rise customer service for tax professionals.',
  deliveryEngine: 'NATIVE',
  salePrice: computeSalePrice(taxPartnerIds, 1.5),
  partnerRequirements: taxPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Learners may support community members during tax season and can transition into paid seasonal or year-round tax preparation roles.',
  visiblePublic: true,
};

// ===== BUSINESS EMS APPRENTICESHIP =====
const businessEmsPartnerIds = ['rise-customer-service', 'certiport-customer-service'];

const businessEmsProgram: Program = {
  id: 'prog-business-ems-apprenticeship',
  slug: 'business-ems-apprenticeship',
  title: 'Business EMS Apprenticeship',
  subtitle: 'FREE business and operations apprenticeship in emergency/health services.',
  description:
    'This apprenticeship pathway focuses on business, office, scheduling, and customer service skills in environments that support emergency or health-related services. Learners gain experience in documentation, communication, and coordination while working alongside experienced staff. This apprenticeship program is FREE - you earn while you learn.',
  deliveryEngine: 'NATIVE',
  salePrice: 0,
  partnerRequirements: businessEmsPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Apprentices can earn wages while learning front-office, dispatch, and coordination skills in real service environments.',
  visiblePublic: true,
};

// ===== NAIL TECHNICIAN APPRENTICESHIP =====
const nailsPartnerIds = ['milady-barber-theory', 'nationaldrug-barber'];

const nailsProgram: Program = {
  id: 'prog-nail-technician-apprenticeship',
  slug: 'nail-technician-apprenticeship',
  title: 'Nail Technician Apprenticeship',
  subtitle: 'FREE nail technology apprenticeship with real clients and shop hours.',
  description:
    'This pathway blends nail technology theory with in-salon apprenticeship hours. Learners practice manicures, pedicures, nail art, sanitation, and customer experience while preparing for state board requirements and building a client base. This apprenticeship program is FREE - you earn while you learn.',
  deliveryEngine: 'NATIVE',
  salePrice: 0,
  partnerRequirements: nailsPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Apprentices can earn while learning, taking clients under supervision and building hours toward licensure.',
  visiblePublic: true,
};

// ===== ESTHETICIAN APPRENTICESHIP =====
const estheticianPartnerIds = ['milady-barber-theory', 'nationaldrug-barber'];

const estheticianProgram: Program = {
  id: 'prog-esthetician-apprenticeship',
  slug: 'esthetician-apprenticeship',
  title: 'Esthetician Apprenticeship',
  subtitle: 'FREE skin care and spa services apprenticeship program.',
  description:
    'This apprenticeship pathway focuses on facials, skin analysis, basic treatments, and spa customer service. Learners combine esthetics theory with supervised spa hours to prepare for state board and real-world employment. This apprenticeship program is FREE - you earn while you learn.',
  deliveryEngine: 'NATIVE',
  salePrice: 0,
  partnerRequirements: estheticianPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Apprentices gain paid experience providing supervised services while completing required training hours.',
  visiblePublic: true,
};

// ===== CULINARY APPRENTICESHIP =====
const culinaryPartnerIds = ['careersafe-building-safety', 'nationaldrug-building'];

const culinaryProgram: Program = {
  id: 'prog-culinary-apprenticeship',
  slug: 'culinary-apprenticeship',
  title: 'Culinary Apprenticeship',
  subtitle: 'FREE culinary and kitchen operations apprenticeship program.',
  description:
    'This pathway prepares learners for culinary and food service roles by combining kitchen safety, prep, line work, and service skills with real restaurant or institutional kitchen experience. This apprenticeship program is FREE - you earn while you learn.',
  deliveryEngine: 'NATIVE',
  salePrice: 0,
  partnerRequirements: culinaryPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Apprentices can earn wages in kitchens while training, with a focus on building reliable, promotable staff for employers.',
  visiblePublic: true,
};

// ===== BUSINESS TECHNICIAN APPRENTICESHIP =====
const businessTechPartnerIds = ['certiport-it-specialist-core', 'rise-customer-service'];

const businessTechProgram: Program = {
  id: 'prog-business-technician-apprenticeship',
  slug: 'business-technician-apprenticeship',
  title: 'Business Technician Apprenticeship',
  subtitle: 'FREE office technology and business operations apprenticeship.',
  description:
    'This apprenticeship pathway combines digital tools, office systems, scheduling, customer support, and basic data/reporting. Learners support real businesses while building skills that apply to admin, coordinator, and support roles. This apprenticeship program is FREE - you earn while you learn.',
  deliveryEngine: 'NATIVE',
  salePrice: 0,
  partnerRequirements: businessTechPartnerIds.map((id) => ({
    partnerCourseId: id,
    required: true,
  })),
  isStateTuitionFunded: false,
  earnWhileYouLearnNotes:
    'Apprentices can earn while they learn in office environments, supporting day-to-day operations and customer interactions.',
  visiblePublic: true,
};

export const allPrograms: Program[] = [
  cnaProgram,
  barberProgram,
  hvacProgram,
  cdlProgram,
  customerServiceProgram,
  itProgram,
  entrepreneurshipProgram,
  buildingMaintenanceProgram,
  taxProgram,
  businessEmsProgram,
  nailsProgram,
  estheticianProgram,
  culinaryProgram,
  businessTechProgram,
];

export function getProgramBySlug(slug: string): ProgramWithPartners | undefined {
  const prog = allPrograms.find((p) => p.slug === slug);
  if (!prog) return undefined;
  const partners = prog.partnerRequirements
    .map((req) => getPartnerCourseById(req.partnerCourseId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  return { ...prog, partners };
}

export function getProgramById(id: string): ProgramWithPartners | undefined {
  const prog = allPrograms.find((p) => p.id === id);
  if (!prog) return undefined;
  const partners = prog.partnerRequirements
    .map((req) => getPartnerCourseById(req.partnerCourseId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  return { ...prog, partners };
}
