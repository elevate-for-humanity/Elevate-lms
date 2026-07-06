// lms-data/courses/index.ts

import type { Course } from '@/types/course';
import { cnaCourse } from './program-cna';
import { barberApprenticeshipCourse } from './program-barber-apprenticeship';
import { hvacCourse } from './program-hvac';
import { cdlCourse } from './program-cdl';
import { customerServiceCourse } from './program-customer-service';
import { itSupportCourse } from './program-it-support';
import { entrepreneurshipCourse } from './program-entrepreneurship';
import { behavioralHealthCourse } from './program-behavioral-health';
import { buildingMaintenanceCourse } from './program-building-maintenance';
import { cdlHazmatCourse } from './program-cdl-hazmat';
import { commercialCleaningCourse } from './program-commercial-cleaning';
import { constructionTradesCourse } from './program-construction-trades';
import { cosmetologyCourse } from './program-cosmetology';
import { cybersecurityCourse } from './program-cybersecurity';
import { dentalAssistantCourse } from './program-dental-assistant';
import { earlyChildhoodCourse } from './program-early-childhood';
import { ekgTechCourse } from './program-ekg-tech';
import { electricalCourse } from './program-electrical';
import { estheticsApprenticeshipCourse } from './program-esthetics-apprenticeship';
import { forkliftCourse } from './program-forklift';
import { hospitalityCourse } from './program-hospitality';
import { medicalAssistantCourse } from './program-medical-assistant';
import { medicalBillingCourse } from './program-medical-billing';
import { patientCareTechCourse } from './program-patient-care-tech';
import { pharmacyTechCourse } from './program-pharmacy-tech';
import { phlebotomyCourse } from './program-phlebotomy';
import { plumbingCourse } from './program-plumbing';
import { securityOfficerCourse } from './program-security-officer';
import { warehouseLogisticsCourse } from './program-warehouse-logistics';
import { weldingCourse } from './program-welding';

export const allCourses: Course[] = [
  cnaCourse,
  barberApprenticeshipCourse,
  hvacCourse,
  buildingTechCourse,
  cdlCourse,
  customerServiceCourse,
  itSupportCourse,
  entrepreneurshipCourse,
  behavioralHealthCourse,
  buildingMaintenanceCourse,
  cdlHazmatCourse,
  commercialCleaningCourse,
  constructionTradesCourse,
  cosmetologyCourse,
  cybersecurityCourse,
  dentalAssistantCourse,
  earlyChildhoodCourse,
  ekgTechCourse,
  electricalCourse,
  estheticsApprenticeshipCourse,
  forkliftCourse,
  hospitalityCourse,
  medicalAssistantCourse,
  medicalBillingCourse,
  patientCareTechCourse,
  pharmacyTechCourse,
  phlebotomyCourse,
  plumbingCourse,
  securityOfficerCourse,
  warehouseLogisticsCourse,
  weldingCourse,
];

export function getCourseBySlug(slug: string): Course | undefined {
  return allCourses.find((course) => course.slug === slug && course.isPublished);
}
