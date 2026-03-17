import type { Return1040 } from '@/lib/tax/domain/types';

/**
 * Maps the canonical Return1040 domain object to a flat XML-shape DTO.
 * Serializer consumes this — never the raw domain object directly.
 * This separation allows the domain model to evolve without breaking XML output.
 */
export type F1040XmlDto = {
  taxYear: number;
  filingStatus: string;
  taxpayer: {
    firstName: string;
    lastName: string;
    ssn: string;
    dob: string;
    ipPin?: string;
  };
  spouse?: {
    firstName: string;
    lastName: string;
    ssn: string;
    dob: string;
    ipPin?: string;
  };
  address: {
    street: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
  };
  dependents: Array<{
    firstName: string;
    lastName: string;
    ssn: string;
    relationship: string;
  }>;
  w2s: Array<{
    ein: string;
    employerName: string;
    wages: number;
    federalWithholding: number;
  }>;
  computed: {
    totalIncome: number;
    adjustedGrossIncome: number;
    taxableIncome: number;
    totalTax: number;
    totalPayments: number;
    refundAmount: number;
    amountOwed: number;
  };
  priorYearAGI: number;
  taxpayerPin: string;
  spousePin?: string;
  signedAt: string;
  preparer?: {
    ptin: string;
    name: string;
    firmName?: string;
    firmEIN?: string;
  };
  efin: string;
  softwareId: string;
};

export function mapReturn1040ToXmlDto(ret: Return1040): F1040XmlDto {
  const computed = ret.computed ?? {
    totalIncome: 0,
    adjustedGrossIncome: 0,
    taxableIncome: 0,
    totalTax: 0,
    totalPayments: 0,
    refundAmount: 0,
    amountOwed: 0,
    standardDeduction: 0,
    itemizedDeduction: 0,
    deductionUsed: 'standard' as const,
    taxBeforeCredits: 0,
    totalCredits: 0,
    selfEmploymentTax: 0,
  };

  return {
    taxYear: ret.taxYear,
    filingStatus: ret.filingStatus.toUpperCase(),
    taxpayer: {
      firstName: ret.taxpayer.firstName,
      lastName: ret.taxpayer.lastName,
      ssn: ret.taxpayer.ssn.replace(/\D/g, ''),
      dob: ret.taxpayer.dob,
      ipPin: ret.taxpayer.ipPin,
    },
    spouse: ret.spouse ? {
      firstName: ret.spouse.firstName,
      lastName: ret.spouse.lastName,
      ssn: ret.spouse.ssn.replace(/\D/g, ''),
      dob: ret.spouse.dob,
      ipPin: ret.spouse.ipPin,
    } : undefined,
    address: ret.address,
    dependents: ret.dependents.map(d => ({
      firstName: d.firstName,
      lastName: d.lastName,
      ssn: d.ssn.replace(/\D/g, ''),
      relationship: d.relationship,
    })),
    w2s: ret.w2s.map(w => ({
      ein: w.ein,
      employerName: w.employerName,
      wages: w.wages,
      federalWithholding: w.federalWithholding,
    })),
    computed: {
      totalIncome: computed.totalIncome,
      adjustedGrossIncome: computed.adjustedGrossIncome,
      taxableIncome: computed.taxableIncome,
      totalTax: computed.totalTax,
      totalPayments: computed.totalPayments,
      refundAmount: computed.refundAmount,
      amountOwed: computed.amountOwed,
    },
    priorYearAGI: ret.priorYearAGI ?? 0,
    taxpayerPin: ret.taxpayerSignature?.pin ?? '',
    spousePin: ret.spouseSignature?.pin,
    signedAt: ret.taxpayerSignature?.signedAt ?? new Date().toISOString().split('T')[0],
    preparer: ret.preparer && !ret.preparer.selfPrepared ? {
      ptin: ret.preparer.ptin,
      name: ret.preparer.name,
      firmName: ret.preparer.firmName,
      firmEIN: ret.preparer.firmEIN,
    } : undefined,
    efin: process.env.IRS_EFIN ?? '',
    softwareId: process.env.IRS_SOFTWARE_ID ?? 'PENDING',
  };
}
