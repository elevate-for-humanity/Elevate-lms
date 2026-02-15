/**
 * IRS Software Certification Testing Module
 * Validates software against IRS Assurance Testing System (ATS) requirements
 */

import { TaxReturn, W2Income, Dependent } from '../types';
import { validateTaxReturn } from '../validation/irs-rules';
import { generateForm1040, generateMeFXML } from '../mef/xml-generator';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  taxReturn: Partial<TaxReturn>;
  expectedResults: {
    agi?: number;
    taxableIncome?: number;
    totalTax?: number;
    refund?: number;
    amountOwed?: number;
  };
}

export interface TestResult {
  scenarioId: string;
  passed: boolean;
  errors: string[];
  calculatedValues: Record<string, number>;
  expectedValues: Record<string, number>;
}

export interface CertificationReport {
  timestamp: Date;
  softwareVersion: string;
  totalScenarios: number;
  passed: number;
  failed: number;
  results: TestResult[];
  readyForSubmission: boolean;
}

// Helper to create W2 income
function createW2(data: Partial<W2Income>): W2Income {
  return {
    employerEIN: data.employerEIN || '12-3456789',
    employerName: data.employerName || 'Test Employer',
    employerAddress: data.employerAddress || {
      street: '123 Business St',
      city: 'Anytown',
      state: 'VA',
      zip: '22030'
    },
    wages: data.wages || 0,
    federalWithholding: data.federalWithholding || 0,
    socialSecurityWages: data.socialSecurityWages || data.wages || 0,
    socialSecurityTax: data.socialSecurityTax || (data.wages || 0) * 0.062,
    medicareWages: data.medicareWages || data.wages || 0,
    medicareTax: data.medicareTax || (data.wages || 0) * 0.0145,
    stateWages: data.stateWages,
    stateWithholding: data.stateWithholding,
    stateCode: data.stateCode
  };
}

// Helper to create dependent
function createDependent(data: Partial<Dependent>): Dependent {
  return {
    firstName: data.firstName || 'Child',
    lastName: data.lastName || 'Test',
    ssn: data.ssn || '400-00-0000',
    relationship: data.relationship || 'son',
    dateOfBirth: data.dateOfBirth || '2015-01-01',
    monthsLivedWithYou: data.monthsLivedWithYou ?? 12,
    childTaxCredit: data.childTaxCredit ?? false,
    otherDependentCredit: data.otherDependentCredit ?? false
  };
}

// IRS ATS Test Scenarios (simplified versions)
const ATS_SCENARIOS: TestScenario[] = [
  {
    id: 'ATS-001',
    name: 'Single Filer - W-2 Only',
    description: 'Basic single filer with W-2 income, standard deduction',
    taxReturn: {
      taxYear: 2024,
      filingStatus: 'single',
      taxpayer: {
        firstName: 'John',
        lastName: 'Testcase',
        ssn: '400-00-0001',
        dateOfBirth: '1980-01-15'
      },
      address: {
        street: '123 Test St',
        city: 'Anytown',
        state: 'VA',
        zip: '22030'
      },
      w2Income: [createW2({
        employerEIN: '12-3456789',
        employerName: 'Test Corp',
        wages: 50000,
        federalWithholding: 5000,
        stateCode: 'VA',
        stateWages: 50000,
        stateWithholding: 2500
      })],
      deductionType: 'standard',
      dependents: []
    },
    expectedResults: {
      agi: 50000,
      taxableIncome: 35400
    }
  },
  {
    id: 'ATS-002',
    name: 'MFJ with Dependents',
    description: 'Married filing jointly with two children, child tax credit',
    taxReturn: {
      taxYear: 2024,
      filingStatus: 'married_filing_jointly',
      taxpayer: {
        firstName: 'Jane',
        lastName: 'Testcase',
        ssn: '400-00-0002',
        dateOfBirth: '1982-06-20'
      },
      address: {
        street: '456 Test Ave',
        city: 'Anytown',
        state: 'MD',
        zip: '20850'
      },
      spouse: {
        firstName: 'Bob',
        lastName: 'Testcase',
        ssn: '400-00-0003',
        dateOfBirth: '1981-03-10'
      },
      dependents: [
        createDependent({
          firstName: 'Child',
          lastName: 'One',
          ssn: '400-00-0004',
          relationship: 'son',
          dateOfBirth: '2015-05-01',
          childTaxCredit: true
        }),
        createDependent({
          firstName: 'Child',
          lastName: 'Two',
          ssn: '400-00-0005',
          relationship: 'daughter',
          dateOfBirth: '2018-08-15',
          childTaxCredit: true
        })
      ],
      w2Income: [createW2({
        employerEIN: '98-7654321',
        employerName: 'Employer One',
        wages: 75000,
        federalWithholding: 8000,
        stateCode: 'MD',
        stateWages: 75000,
        stateWithholding: 3750
      })],
      deductionType: 'standard'
    },
    expectedResults: {
      agi: 75000,
      taxableIncome: 45800
    }
  },
  {
    id: 'ATS-003',
    name: 'Self-Employment Income',
    description: 'Single filer with Schedule C business income',
    taxReturn: {
      taxYear: 2024,
      filingStatus: 'single',
      taxpayer: {
        firstName: 'Sam',
        lastName: 'Freelance',
        ssn: '400-00-0006',
        dateOfBirth: '1975-11-30'
      },
      address: {
        street: '789 Contractor Ln',
        city: 'Anytown',
        state: 'CA',
        zip: '90210'
      },
      scheduleCBusiness: [{
        businessName: 'Freelance Services',
        businessCode: '541990',
        accountingMethod: 'cash',
        grossReceipts: 100000,
        grossProfit: 100000,
        expenses: {
          advertising: 2000,
          officeExpense: 5000,
          supplies: 3000,
          utilities: 2000,
          otherExpenses: 8000
        },
        netProfit: 80000
      }],
      deductionType: 'standard',
      dependents: [],
      w2Income: []
    },
    expectedResults: {
      agi: 80000,
      taxableIncome: 65400
    }
  },
  {
    id: 'ATS-004',
    name: 'EITC Eligible',
    description: 'Head of household with EITC eligibility',
    taxReturn: {
      taxYear: 2024,
      filingStatus: 'head_of_household',
      taxpayer: {
        firstName: 'Maria',
        lastName: 'Worker',
        ssn: '400-00-0007',
        dateOfBirth: '1990-04-22'
      },
      address: {
        street: '321 Main St',
        city: 'Anytown',
        state: 'TX',
        zip: '75001'
      },
      dependents: [createDependent({
        firstName: 'Junior',
        lastName: 'Worker',
        ssn: '400-00-0008',
        relationship: 'son',
        dateOfBirth: '2016-09-10',
        childTaxCredit: true
      })],
      w2Income: [createW2({
        employerEIN: '11-2233445',
        employerName: 'Local Store',
        wages: 25000,
        federalWithholding: 1500,
        stateCode: 'TX',
        stateWages: 25000,
        stateWithholding: 0
      })],
      deductionType: 'standard'
    },
    expectedResults: {
      agi: 25000,
      taxableIncome: 3100
    }
  }
];

export class IRSCertificationTester {
  private scenarios: TestScenario[] = ATS_SCENARIOS;
  
  runAllTests(): CertificationReport {
    const results: TestResult[] = [];
    
    for (const scenario of this.scenarios) {
      results.push(this.runScenario(scenario));
    }
    
    const passed = results.filter(r => r.passed).length;
    
    return {
      timestamp: new Date(),
      softwareVersion: '1.0.0',
      totalScenarios: this.scenarios.length,
      passed,
      failed: this.scenarios.length - passed,
      results,
      readyForSubmission: passed === this.scenarios.length
    };
  }
  
  runScenario(scenario: TestScenario): TestResult {
    const errors: string[] = [];
    const calculatedValues: Record<string, number> = {};
    const expectedValues: Record<string, number> = {};
    
    try {
      // Build complete tax return from partial
      const taxReturn = this.buildTaxReturn(scenario.taxReturn);
      
      // Validate the return
      const validation = validateTaxReturn(taxReturn);
      if (!validation.valid) {
        errors.push(...validation.errors.map(e => `Validation: ${e.errorMessage}`));
      }
      
      // Generate Form 1040 XML
      const form1040Xml = generateForm1040(taxReturn);
      
      // Parse calculated values from XML (simplified)
      const agiMatch = form1040Xml.match(/<AdjustedGrossIncomeAmt>(\d+)<\/AdjustedGrossIncomeAmt>/);
      const taxableMatch = form1040Xml.match(/<TaxableIncomeAmt>(\d+)<\/TaxableIncomeAmt>/);
      
      if (agiMatch) calculatedValues.agi = parseInt(agiMatch[1]);
      if (taxableMatch) calculatedValues.taxableIncome = parseInt(taxableMatch[1]);
      
      // Compare with expected results
      const expected = scenario.expectedResults;
      
      if (expected.agi !== undefined) {
        expectedValues.agi = expected.agi;
        if (calculatedValues.agi && Math.abs(calculatedValues.agi - expected.agi) > 1) {
          errors.push(`AGI mismatch: expected ${expected.agi}, got ${calculatedValues.agi}`);
        }
      }
      
      if (expected.taxableIncome !== undefined) {
        expectedValues.taxableIncome = expected.taxableIncome;
        if (calculatedValues.taxableIncome && Math.abs(calculatedValues.taxableIncome - expected.taxableIncome) > 1) {
          errors.push(`Taxable income mismatch: expected ${expected.taxableIncome}, got ${calculatedValues.taxableIncome}`);
        }
      }
      
      // Validate XML generation
      try {
        const xml = generateMeFXML(taxReturn, 'TEST001');
        if (!xml.includes('<?xml')) {
          errors.push('XML generation failed: invalid XML output');
        }
      } catch (e) {
        errors.push(`XML generation error: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
      
    } catch (e) {
      errors.push(`Calculation error: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
    
    return {
      scenarioId: scenario.id,
      passed: errors.length === 0,
      errors,
      calculatedValues,
      expectedValues
    };
  }
  
  private buildTaxReturn(partial: Partial<TaxReturn>): TaxReturn {
    const defaultCredits = {
      childTaxCredit: 0,
      creditForOtherDependents: 0,
      earnedIncomeCredit: 0,
      additionalChildTaxCredit: 0
    };
    
    const needsSpouseSignature = partial.filingStatus === 'married_filing_jointly';
    
    return {
      taxYear: partial.taxYear || 2024,
      efin: partial.efin || '000000',
      returnId: partial.returnId || `TEST${Date.now()}`,
      filingStatus: partial.filingStatus || 'single',
      taxpayer: partial.taxpayer || {
        firstName: 'Test',
        lastName: 'User',
        ssn: '000-00-0000',
        dateOfBirth: '1980-01-01'
      },
      address: partial.address || {
        street: '123 Test St',
        city: 'Test City',
        state: 'VA',
        zip: '22030'
      },
      spouse: partial.spouse,
      dependents: partial.dependents || [],
      w2Income: partial.w2Income || [],
      form1099INT: partial.form1099INT,
      form1099DIV: partial.form1099DIV,
      form1099MISC: partial.form1099MISC,
      form1099NEC: partial.form1099NEC,
      scheduleCBusiness: partial.scheduleCBusiness,
      deductionType: partial.deductionType || 'standard',
      itemizedDeductions: partial.itemizedDeductions,
      adjustments: partial.adjustments,
      totalIncome: partial.totalIncome || 0,
      adjustedGrossIncome: partial.adjustedGrossIncome || 0,
      taxableIncome: partial.taxableIncome || 0,
      taxBeforeCredits: partial.taxBeforeCredits || 0,
      credits: partial.credits || defaultCredits,
      totalCredits: partial.totalCredits || 0,
      federalWithholding: partial.federalWithholding || 0,
      estimatedTaxPayments: partial.estimatedTaxPayments,
      totalTax: partial.totalTax || 0,
      totalPayments: partial.totalPayments || 0,
      refundAmount: partial.refundAmount,
      amountOwed: partial.amountOwed,
      otherIncome: partial.otherIncome,
      taxpayerSignature: partial.taxpayerSignature || {
        pin: '12345',
        signedDate: new Date().toISOString().split('T')[0]
      },
      spouseSignature: needsSpouseSignature ? (partial.spouseSignature || {
        pin: '54321',
        signedDate: new Date().toISOString().split('T')[0]
      }) : undefined
    };
  }
  
  addCustomScenario(scenario: TestScenario): void {
    this.scenarios.push(scenario);
  }
  
  getScenarios(): TestScenario[] {
    return [...this.scenarios];
  }
}

export function runCertificationTests(): CertificationReport {
  const tester = new IRSCertificationTester();
  return tester.runAllTests();
}

export function formatCertificationReport(report: CertificationReport): string {
  let output = `IRS Software Certification Report\n`;
  output += `================================\n\n`;
  output += `Timestamp: ${report.timestamp.toISOString()}\n`;
  output += `Software Version: ${report.softwareVersion}\n\n`;
  output += `Results: ${report.passed}/${report.totalScenarios} passed\n`;
  output += `Status: ${report.readyForSubmission ? 'READY FOR SUBMISSION' : 'NEEDS FIXES'}\n\n`;
  
  for (const result of report.results) {
    output += `\n${result.scenarioId}: ${result.passed ? 'PASS' : 'FAIL'}\n`;
    if (!result.passed) {
      for (const error of result.errors) {
        output += `  - ${error}\n`;
      }
    }
  }
  
  return output;
}
