export type PartnerSystem =
  | 'MILADY'
  | 'CAREERSAFE'
  | 'HSI'
  | 'RISE'
  | 'CERTIPORT'
  | 'NATIONAL_DRUG'
  | 'JRI';

export interface PartnerCourse {
  id: string; // internal ID
  partnerSystem: PartnerSystem; // which partner
  partnerCode: string; // their catalog code / course id
  title: string;
  description?: string;
  hours: number;
  baseCost: number; // what it costs EFH per learner
}
