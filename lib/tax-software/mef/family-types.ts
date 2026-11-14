export const DEPENDENT_RELATIONSHIPS = [
  'SON',
  'DAUGHTER',
  'STEPCHILD',
  'FOSTER CHILD',
  'BROTHER',
  'SISTER',
  'STEPBROTHER',
  'STEPSISTER',
  'HALF BROTHER',
  'HALF SISTER',
  'GRANDCHILD',
  'NIECE',
  'NEPHEW',
  'PARENT',
  'GRANDPARENT',
  'AUNT',
  'UNCLE',
  'OTHER',
  'NONE',
] as const;
export type TaxDependent = {
  firstName: string;
  lastName: string;
  ssn: string;
  birthDate: string;
  relationship: (typeof DEPENDENT_RELATIONSHIPS)[number];
  claimedAsDependent: boolean;
  qualifiesChildTaxCredit: boolean;
  qualifiesOtherDependentCredit: boolean;
  qualifiesEic: boolean;
  monthsLivedWithTaxpayer: number;
  livedInUsOverHalfYear: boolean;
  studentUnder24: boolean;
  permanentlyDisabled: boolean;
  identityProtectionPin?: string;
};
