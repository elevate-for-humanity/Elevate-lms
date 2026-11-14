// types/course.ts

export type FundingStream =
  | 'WIOA_ADULT'
  | 'WIOA_YOUTH'
  | 'WIOA_DW'
  | 'WRG'
  | 'JRI'
  | 'WEX'
  | 'APPRENTICESHIP'
  | 'SELF_PAY';

export type CredentialPartner = 'MILADY' | 'CHOICE_MEDICAL' | 'CERTIPORT' | 'NONE' | 'OTHER';

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'lab' | 'assignment';
  durationMinutes?: number;
  partnerRefCode?: string; // e.g., Milady chapter, Certiport objective code
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string; // used in URL: /courses/[slug]
  title: string;
  shortTitle?: string;
  credentialPartner: CredentialPartner;
  externalCredentialName?: string; // e.g. "CNA Certification", "Barber License"
  description: string;
  hoursTotal: number;
  deliveryMode: 'IN_PERSON' | 'HYBRID' | 'ONLINE';
  locationLabel?: string; // e.g. "Indianapolis Training Center"
  fundingEligible: FundingStream[];
  targetAudience: string[]; // e.g. ["Adults", "Justice-involved", "Youth (18–24)"]
  outcomes: string[]; // bullet list for marketing + compliance
  modules: Module[];
  // where to send them in LMS when they click "Start"
  lmsPath: string; // e.g. "/student/courses/cna-001"
  // optional: show on public site?
  isPublished: boolean;
}
