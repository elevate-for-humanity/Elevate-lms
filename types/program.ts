import type { PartnerCourse } from "./partnerCourse";
export type { DeliveryModel, FundingType, EnrollmentType } from '@/lib/programs/program-schema';

export type DeliveryEngine = "NATIVE" | "SCORM";

export interface ProgramPartnerRequirement {
  partnerCourseId: string;   // ID from PartnerCourse.id
  required: boolean;
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  headlineBenefits?: string[];
  deliveryEngine: DeliveryEngine;
  salePrice: number;           // what student pays (after markup)
  stripeProductId?: string;    // set after you create in Stripe
  stripePriceId?: string;      // pay in full
  stripePriceIdPlan?: string;  // payment plan
  partnerRequirements: ProgramPartnerRequirement[];
  isStateTuitionFunded: boolean; // true only if WRG/WIOA actually covers tuition
  earnWhileYouLearnNotes?: string;
  visiblePublic: boolean;
}

export interface ProgramWithPartners extends Program {
  partners: PartnerCourse[];
}
