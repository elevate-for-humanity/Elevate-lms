import { logger } from '@/lib/logger';
/**
 * IRS ATS (Assurance Testing System) Test Runner
 * Submits test scenarios end-to-end and collects evidence artifacts
 * 
 * Usage: npx tsx lib/tax-software/testing/ats-runner.ts [--real] [--scenario=ID]
 */

import * as fs from 'fs';
import * as path from 'path';
import { TaxReturn } from '../types';
import { createMeFSubmission, generateMeFXML } from '../mef/xml-generator';
import { IRSSchemaValidator, createSchemaValidator } from '../schemas/schema-validator';
import { MeFSOAPClient, createSOAPClient, SOAPTransmitResponse } from '../mef/soap-client';
import { createCertificateHandler, CertificateStatus } from '../mef/certificate-handler';

// ATS Test Scenarios
interface ATSScenario {
  id: string;
  name: string;
  description: string;
  taxReturn: TaxReturn;
  expectedOutcome: 'accept' | 'reject';
  expectedErrors?: string[];
}

interface ATSRunResult {
  scenarioId: string;
  scenarioName: string;
  timestamp: string;
  
  // Input
  inputJson: string;
  
  // XML Generation
  xmlGenerated: boolean;
  xmlContent?: string;
  xmlHash?: string;
  
  // Schema Validation
  schemaValidated: boolean;
  schemaErrors: string[];
  schemaWarnings: string[];
  
  // Transmission
  transmitted: boolean;
  transmissionMode: 'real' | 'simulated';
  submissionId?: string;
  receiptId?: string;
  transmissionError?: string;
  
  // Acknowledgment
  ackReceived: boolean;
  ackStatus?: 'accepted' | 'rejected' | 'pending';
  dcn?: string;
  ackErrors?: string[];
  
  // Overall
  passed: boolean;
  matchesExpected: boolean;
  duration: number;
}

interface ATSRunReport {
  runId: string;
  timestamp: string;
  environment: string;
  transmissionMode: 'real' | 'simulated';
  certificateStatus: CertificateStatus;
  
  totalScenarios: number;
  passed: number;
  failed: number;
  
  results: ATSRunResult[];
  
  evidencePath: string;
}

// Define ATS test scenarios
const ATS_SCENARIOS: ATSScenario[] = [
  {
    id: 'ATS-001',
    name: 'Single Filer - W-2 Only',
    description: 'Basic single filer with W-2 income, standard deduction',
    expectedOutcome: 'accept',
    taxReturn: {
      taxYear: 2024,
      efin: process.env.IRS_EFIN || '358459',
      returnId: 'ATS001',
      filingStatus: 'single',
      taxpayer: {
        firstName: 'JOHN',
        lastName: 'TESTCASE',
        ssn: '400-00-0001',
        dateOfBirth: '1980-01-15'
      },
      address: {
        street: '123 TEST STREET',
        city: 'INDIANAPOLIS',
        state: 'IN',
        zip: '46201'
      },
      dependents: [],
      w2Income: [{
        employerEIN: '12-3456789',
        employerName: 'TEST CORPORATION',
        employerAddress: { street: '456 BUSINESS AVE', city: 'CHICAGO', state: 'IL', zip: '60601' },
        wages: 50000,
        federalWithholding: 5000,
        socialSecurityWages: 50000,
        socialSecurityTax: 3100,
        medicareWages: 50000,
        medicareTax: 725
      }],
      deductionType: 'standard',
      totalIncome: 50000,
      adjustedGrossIncome: 50000,
      taxableIncome: 35400,
      taxBeforeCredits: 4012,
      credits: { childTaxCredit: 0, creditForOtherDependents: 0, earnedIncomeCredit: 0, additionalChildTaxCredit: 0 },
      totalCredits: 0,
      federalWithholding: 5000,
      totalTax: 4012,
      totalPayments: 5000,
      refundAmount: 988,
      taxpayerSignature: { pin: '12345', signedDate: '2025-02-15' }
    }
  },
  {
    id: 'ATS-002',
    name: 'MFJ with Dependents',
    description: 'Married filing jointly with two children, child tax credit',
    expectedOutcome: 'accept',
    taxReturn: {
      taxYear: 2024,
      efin: process.env.IRS_EFIN || '358459',
      returnId: 'ATS002',
      filingStatus: 'married_filing_jointly',
      taxpayer: {
        firstName: 'JANE',
        lastName: 'TESTCASE',
        ssn: '400-00-0002',
        dateOfBirth: '1982-06-20'
      },
      spouse: {
        firstName: 'BOB',
        lastName: 'TESTCASE',
        ssn: '400-00-0003',
        dateOfBirth: '1981-03-10'
      },
      address: {
        street: '456 TEST AVENUE',
        city: 'INDIANAPOLIS',
        state: 'IN',
        zip: '46202'
      },
      dependents: [
        {
          firstName: 'CHILD',
          lastName: 'ONE',
          ssn: '400-00-0004',
          relationship: 'son',
          dateOfBirth: '2015-05-01',
          monthsLivedWithYou: 12,
          childTaxCredit: true,
          otherDependentCredit: false
        },
        {
          firstName: 'CHILD',
          lastName: 'TWO',
          ssn: '400-00-0005',
          relationship: 'daughter',
          dateOfBirth: '2018-08-15',
          monthsLivedWithYou: 12,
          childTaxCredit: true,
          otherDependentCredit: false
        }
      ],
      w2Income: [{
        employerEIN: '98-7654321',
        employerName: 'EMPLOYER ONE INC',
        employerAddress: { street: '789 WORK BLVD', city: 'INDIANAPOLIS', state: 'IN', zip: '46203' },
        wages: 75000,
        federalWithholding: 8000,
        socialSecurityWages: 75000,
        socialSecurityTax: 4650,
        medicareWages: 75000,
        medicareTax: 1087.50
      }],
      deductionType: 'standard',
      totalIncome: 75000,
      adjustedGrossIncome: 75000,
      taxableIncome: 45800,
      taxBeforeCredits: 5016,
      credits: { childTaxCredit: 4000, creditForOtherDependents: 0, earnedIncomeCredit: 0, additionalChildTaxCredit: 0 },
      totalCredits: 4000,
      federalWithholding: 8000,
      totalTax: 1016,
      totalPayments: 8000,
      refundAmount: 6984,
      taxpayerSignature: { pin: '12345', signedDate: '2025-02-15' },
      spouseSignature: { pin: '54321', signedDate: '2025-02-15' }
    }
  },
  {
    id: 'ATS-003',
    name: 'Self-Employment Income',
    description: 'Single filer with Schedule C business income',
    expectedOutcome: 'accept',
    taxReturn: {
      taxYear: 2024,
      efin: process.env.IRS_EFIN || '358459',
      returnId: 'ATS003',
      filingStatus: 'single',
      taxpayer: {
        firstName: 'SAM',
        lastName: 'FREELANCE',
        ssn: '400-00-0006',
        dateOfBirth: '1975-11-30'
      },
      address: {
        street: '789 CONTRACTOR LANE',
        city: 'INDIANAPOLIS',
        state: 'IN',
        zip: '46204'
      },
      dependents: [],
      w2Income: [],
      scheduleCBusiness: [{
        businessName: 'FREELANCE SERVICES',
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
      totalIncome: 80000,
      adjustedGrossIncome: 80000,
      taxableIncome: 65400,
      taxBeforeCredits: 10268,
      credits: { childTaxCredit: 0, creditForOtherDependents: 0, earnedIncomeCredit: 0, additionalChildTaxCredit: 0 },
      totalCredits: 0,
      federalWithholding: 0,
      totalTax: 10268,
      totalPayments: 0,
      amountOwed: 10268,
      taxpayerSignature: { pin: '12345', signedDate: '2025-02-15' }
    }
  },
  {
    id: 'ATS-004',
    name: 'EITC Eligible',
    description: 'Head of household with EITC eligibility',
    expectedOutcome: 'accept',
    taxReturn: {
      taxYear: 2024,
      efin: process.env.IRS_EFIN || '358459',
      returnId: 'ATS004',
      filingStatus: 'head_of_household',
      taxpayer: {
        firstName: 'MARIA',
        lastName: 'WORKER',
        ssn: '400-00-0007',
        dateOfBirth: '1990-04-22'
      },
      address: {
        street: '321 MAIN STREET',
        city: 'INDIANAPOLIS',
        state: 'IN',
        zip: '46205'
      },
      dependents: [{
        firstName: 'JUNIOR',
        lastName: 'WORKER',
        ssn: '400-00-0008',
        relationship: 'son',
        dateOfBirth: '2016-09-10',
        monthsLivedWithYou: 12,
        childTaxCredit: true,
        otherDependentCredit: false
      }],
      w2Income: [{
        employerEIN: '11-2233445',
        employerName: 'LOCAL STORE LLC',
        employerAddress: { street: '100 RETAIL WAY', city: 'INDIANAPOLIS', state: 'IN', zip: '46206' },
        wages: 25000,
        federalWithholding: 1500,
        socialSecurityWages: 25000,
        socialSecurityTax: 1550,
        medicareWages: 25000,
        medicareTax: 362.50
      }],
      deductionType: 'standard',
      totalIncome: 25000,
      adjustedGrossIncome: 25000,
      taxableIncome: 3100,
      taxBeforeCredits: 310,
      credits: { childTaxCredit: 310, creditForOtherDependents: 0, earnedIncomeCredit: 3995, additionalChildTaxCredit: 1690 },
      totalCredits: 5995,
      federalWithholding: 1500,
      totalTax: 0,
      totalPayments: 7185,
      refundAmount: 7185,
      taxpayerSignature: { pin: '12345', signedDate: '2025-02-15' }
    }
  }
];

// Export scenarios for external use
export { ATS_SCENARIOS };

/**
 * ATS Test Runner
 */
export class ATSTestRunner {
  private scenarios: ATSScenario[] = ATS_SCENARIOS;
  private validator: IRSSchemaValidator;
  private soapClient: MeFSOAPClient | null = null;
  private useRealTransmission: boolean = false;
  private evidenceDir: string;
  private runId: string;

  constructor(options: { useRealTransmission?: boolean } = {}) {
    this.useRealTransmission = options.useRealTransmission || false;
    this.validator = createSchemaValidator(2024);
    this.runId = `ATS-${Date.now().toString(36).toUpperCase()}`;
    this.evidenceDir = path.join(process.cwd(), 'reports', 'ats-evidence', this.runId);
    
    if (this.useRealTransmission) {
      this.soapClient = createSOAPClient();
    }
  }

  /**
   * Run all ATS scenarios
   */
  async runAll(): Promise<ATSRunReport> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    // Create evidence directory
    await fs.promises.mkdir(this.evidenceDir, { recursive: true });
    
    // Check certificate status
    const certHandler = createCertificateHandler();
    const certStatus = await certHandler.loadCertificates();
    
    const results: ATSRunResult[] = [];
    
    for (const scenario of this.scenarios) {
      logger.info(`\n[ATS] Running scenario: ${scenario.id} - ${scenario.name}`);
      const result = await this.runScenario(scenario);
      results.push(result);
      
      // Save individual result
      await this.saveScenarioEvidence(result);
    }
    
    const passed = results.filter(r => r.passed).length;
    
    const report: ATSRunReport = {
      runId: this.runId,
      timestamp,
      environment: process.env.IRS_ENVIRONMENT || 'test',
      transmissionMode: this.useRealTransmission ? 'real' : 'simulated',
      certificateStatus: certStatus,
      totalScenarios: this.scenarios.length,
      passed,
      failed: this.scenarios.length - passed,
      results,
      evidencePath: this.evidenceDir
    };
    
    // Save full report
    await this.saveReport(report);
    
    logger.info(`\n[ATS] Run complete: ${passed}/${this.scenarios.length} passed`);
    logger.info(`[ATS] Evidence saved to: ${this.evidenceDir}`);
    
    return report;
  }

  /**
   * Run a single scenario
   */
  async runScenario(scenario: ATSScenario): Promise<ATSRunResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    const result: ATSRunResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      timestamp,
      inputJson: JSON.stringify(scenario.taxReturn, null, 2),
      xmlGenerated: false,
      schemaValidated: false,
      schemaErrors: [],
      schemaWarnings: [],
      transmitted: false,
      transmissionMode: this.useRealTransmission ? 'real' : 'simulated',
      ackReceived: false,
      passed: false,
      matchesExpected: false,
      duration: 0
    };

    try {
      // Step 1: Generate XML
      logger.info(`  [1/4] Generating XML...`);
      const softwareId = process.env.IRS_SOFTWARE_ID || 'ELEVATE001';
      const xml = generateMeFXML(scenario.taxReturn, softwareId);
      result.xmlGenerated = true;
      result.xmlContent = xml;
      const crypto = await import('crypto');
      result.xmlHash = crypto.createHash('sha256').update(xml).digest('hex').substring(0, 16);
      
      // Step 2: Schema Validation
      logger.info(`  [2/4] Validating against schema...`);
      const validationResult = await this.validator.validate(xml);
      result.schemaValidated = validationResult.valid;
      result.schemaErrors = validationResult.errors.map(e => `${e.code}: ${e.message}`);
      result.schemaWarnings = validationResult.warnings.map(e => `${e.code}: ${e.message}`);
      
      if (!validationResult.valid) {
        logger.info(`  [!] Schema validation failed: ${result.schemaErrors.length} errors`);
        result.duration = Date.now() - startTime;
        return result;
      }
      
      // Step 3: Transmission
      logger.info(`  [3/4] ${this.useRealTransmission ? 'Transmitting to IRS...' : 'Simulating transmission...'}`);
      const submissionId = `${scenario.id}-${Date.now().toString(36)}`.toUpperCase();
      result.submissionId = submissionId;
      
      if (this.useRealTransmission && this.soapClient) {
        // Real transmission
        const transmitResult = await this.soapClient.transmit({
          submissionId,
          taxYear: scenario.taxReturn.taxYear,
          xmlContent: xml
        });
        
        result.transmitted = transmitResult.success || transmitResult.error === undefined;
        result.receiptId = transmitResult.receiptId;
        result.transmissionError = transmitResult.error;
        
        if (transmitResult.acknowledgment) {
          result.ackReceived = true;
          result.ackStatus = transmitResult.acknowledgment.status;
          result.dcn = transmitResult.acknowledgment.dcn;
          result.ackErrors = transmitResult.acknowledgment.errors?.map(e => `${e.errorCode}: ${e.errorMessage}`);
        }
      } else {
        // Simulated transmission
        result.transmitted = true;
        result.receiptId = `SIM-${Date.now().toString(36).toUpperCase()}`;
        
        // Simulate ACK based on expected outcome
        result.ackReceived = true;
        result.ackStatus = scenario.expectedOutcome === 'accept' ? 'accepted' : 'rejected';
        if (result.ackStatus === 'accepted') {
          result.dcn = `${Date.now()}`.slice(-14);
        }
      }
      
      // Step 4: Verify outcome
      logger.info(`  [4/4] Verifying outcome...`);
      result.matchesExpected = result.ackStatus === (scenario.expectedOutcome === 'accept' ? 'accepted' : 'rejected');
      result.passed = result.schemaValidated && result.transmitted && result.matchesExpected;
      
    } catch (err) {
      result.transmissionError = err instanceof Error ? err.message : 'Unknown error';
    }
    
    result.duration = Date.now() - startTime;
    logger.info(`  [${result.passed ? '✓' : '✗'}] ${scenario.id}: ${result.passed ? 'PASSED' : 'FAILED'} (${result.duration}ms)`);
    
    return result;
  }

  /**
   * Save scenario evidence to file
   */
  private async saveScenarioEvidence(result: ATSRunResult): Promise<void> {
    const scenarioDir = path.join(this.evidenceDir, result.scenarioId);
    await fs.promises.mkdir(scenarioDir, { recursive: true });
    
    // Save input JSON
    await fs.promises.writeFile(
      path.join(scenarioDir, 'input.json'),
      result.inputJson
    );
    
    // Save generated XML
    if (result.xmlContent) {
      await fs.promises.writeFile(
        path.join(scenarioDir, 'return.xml'),
        result.xmlContent
      );
    }
    
    // Save result summary
    await fs.promises.writeFile(
      path.join(scenarioDir, 'result.json'),
      JSON.stringify({
        ...result,
        xmlContent: result.xmlContent ? '[saved to return.xml]' : undefined,
        inputJson: '[saved to input.json]'
      }, null, 2)
    );
  }

  /**
   * Save full report
   */
  private async saveReport(report: ATSRunReport): Promise<void> {
    // Save JSON report
    await fs.promises.writeFile(
      path.join(this.evidenceDir, 'report.json'),
      JSON.stringify({
        ...report,
        results: report.results.map(r => ({
          ...r,
          xmlContent: r.xmlContent ? `[see ${r.scenarioId}/return.xml]` : undefined,
          inputJson: `[see ${r.scenarioId}/input.json]`
        }))
      }, null, 2)
    );
    
    // Save markdown report
    const markdown = this.generateMarkdownReport(report);
    await fs.promises.writeFile(
      path.join(this.evidenceDir, 'report.md'),
      markdown
    );
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(report: ATSRunReport): string {
    let md = `# ATS Test Run Report

**Run ID:** ${report.runId}  
**Timestamp:** ${report.timestamp}  
**Environment:** ${report.environment}  
**Transmission Mode:** ${report.transmissionMode}  

## Summary

| Metric | Value |
|--------|-------|
| Total Scenarios | ${report.totalScenarios} |
| Passed | ${report.passed} |
| Failed | ${report.failed} |
| Pass Rate | ${((report.passed / report.totalScenarios) * 100).toFixed(1)}% |

## Certificate Status

- **Loaded:** ${report.certificateStatus.loaded ? 'Yes' : 'No'}
- **Environment:** ${report.certificateStatus.environment}
${report.certificateStatus.error ? `- **Error:** ${report.certificateStatus.error}` : ''}

## Results

| Scenario | Name | Schema | Transmitted | ACK | Status | Duration |
|----------|------|--------|-------------|-----|--------|----------|
`;

    for (const result of report.results) {
      md += `| ${result.scenarioId} | ${result.scenarioName} | ${result.schemaValidated ? '✓' : '✗'} | ${result.transmitted ? '✓' : '✗'} | ${result.ackStatus || 'N/A'} | ${result.passed ? '**PASS**' : '**FAIL**'} | ${result.duration}ms |\n`;
    }

    md += `\n## Detailed Results\n\n`;

    for (const result of report.results) {
      md += `### ${result.scenarioId}: ${result.scenarioName}

- **Timestamp:** ${result.timestamp}
- **Submission ID:** ${result.submissionId || 'N/A'}
- **Receipt ID:** ${result.receiptId || 'N/A'}
- **DCN:** ${result.dcn || 'N/A'}
- **XML Hash:** ${result.xmlHash || 'N/A'}

**Schema Validation:**
- Valid: ${result.schemaValidated ? 'Yes' : 'No'}
${result.schemaErrors.length > 0 ? `- Errors:\n${result.schemaErrors.map(e => `  - ${e}`).join('\n')}` : ''}
${result.schemaWarnings.length > 0 ? `- Warnings:\n${result.schemaWarnings.map(e => `  - ${e}`).join('\n')}` : ''}

**Transmission:**
- Mode: ${result.transmissionMode}
- Success: ${result.transmitted ? 'Yes' : 'No'}
${result.transmissionError ? `- Error: ${result.transmissionError}` : ''}

**Acknowledgment:**
- Received: ${result.ackReceived ? 'Yes' : 'No'}
- Status: ${result.ackStatus || 'N/A'}
${result.ackErrors && result.ackErrors.length > 0 ? `- Errors:\n${result.ackErrors.map(e => `  - ${e}`).join('\n')}` : ''}

---

`;
    }

    md += `\n## Evidence Files

All evidence artifacts are stored in: \`${report.evidencePath}\`

Each scenario folder contains:
- \`input.json\` - Tax return input data
- \`return.xml\` - Generated MeF XML
- \`result.json\` - Detailed result data
`;

    return md;
  }

  /**
   * Run specific scenario by ID
   */
  async runById(scenarioId: string): Promise<ATSRunResult | null> {
    const scenario = this.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      logger.error(`Scenario ${scenarioId} not found`);
      return null;
    }
    
    await fs.promises.mkdir(this.evidenceDir, { recursive: true });
    const result = await this.runScenario(scenario);
    await this.saveScenarioEvidence(result);
    
    return result;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const useReal = args.includes('--real');
  const scenarioArg = args.find(a => a.startsWith('--scenario='));
  const scenarioId = scenarioArg?.split('=')[1];

  logger.info('='.repeat(60));
  logger.info('IRS ATS Test Runner');
  logger.info('='.repeat(60));
  logger.info(`Mode: ${useReal ? 'REAL TRANSMISSION' : 'SIMULATED'}`);
  logger.info(`Environment: ${process.env.IRS_ENVIRONMENT || 'test'}`);
  logger.info('='.repeat(60));

  const runner = new ATSTestRunner({ useRealTransmission: useReal });

  if (scenarioId) {
    const result = await runner.runById(scenarioId);
    if (result) {
      logger.info(`\nResult: ${result.passed ? 'PASSED' : 'FAILED'}`);
    }
  } else {
    const report = await runner.runAll();
    logger.info(`\nFinal Result: ${report.passed}/${report.totalScenarios} passed`);
    process.exit(report.failed > 0 ? 1 : 0);
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('ats-runner.ts');
if (isMainModule) {
  main().catch(console.error);
}
