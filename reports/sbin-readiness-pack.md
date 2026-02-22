# SBIN / MeF Readiness Evidence Pack v2
## Elevate Tax Software - Self-Prep Platform

**Generated:** 2026-01-24  
**Version:** 2.0.0  
**EFIN:** 358459  
**Status:** MeF-TESTABLE (Simulated) | Awaiting Certificates for Real Transmission

---

## A) SYSTEM OVERVIEW

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  /tax-self-prep/start     │  /dashboard/diy-taxes    │  /supersonic-fast-cash│
│  (TaxPrepForm.tsx)        │  (page.tsx)              │  /diy-taxes           │
└──────────────┬────────────┴───────────┬──────────────┴───────────────────────┘
               │                        │
               ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/tax/calculate   │  /api/tax/validate   │  /api/tax/submit             │
│  /api/tax/status      │  /api/tax/file-return                               │
└──────────────┬────────┴──────────┬───────────┴──────────────────────────────┘
               │                   │
               ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TAX LOGIC LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  lib/tax-software/forms/form-1040.ts    - Tax calculations                  │
│  lib/tax-software/validation/irs-rules.ts - IRS validation                  │
│  lib/tax-software/types.ts              - Type definitions                  │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SCHEMA VALIDATION (NEW)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  lib/tax-software/schemas/schema-validator.ts - XML validation              │
│  lib/tax-software/schemas/2024/              - IRS schema files (TBD)       │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           XML GENERATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  lib/tax-software/mef/xml-generator.ts  - MeF XML generation                │
│  Target Schema: 2024v1.0                                                    │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MeF SOAP TRANSMISSION (NEW)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  lib/tax-software/mef/soap-client.ts    - Real SOAP client                  │
│  lib/tax-software/mef/certificate-handler.ts - mTLS certificates            │
│  lib/tax-software/mef/transmission.ts   - Transmission orchestration        │
│  Status: IMPLEMENTED - Awaiting IRS certificates                            │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ACK HANDLER + DATABASE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  lib/tax-software/mef/acknowledgment.ts - ACK processing                    │
│  supabase/migrations/20260124150000_tax_software_tables.sql                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Locations (Updated)

| Module | Path | Lines | Status |
|--------|------|-------|--------|
| Types/Interfaces | `lib/tax-software/types.ts` | 322 | ✅ Complete |
| Form 1040 Calculator | `lib/tax-software/forms/form-1040.ts` | 395 | ✅ Complete |
| IRS Validation | `lib/tax-software/validation/irs-rules.ts` | 285 | ✅ Complete |
| **Schema Validator** | `lib/tax-software/schemas/schema-validator.ts` | 520 | ✅ NEW |
| XML Generator | `lib/tax-software/mef/xml-generator.ts` | 384 | ✅ Complete |
| **SOAP Client** | `lib/tax-software/mef/soap-client.ts` | 380 | ✅ NEW |
| **Certificate Handler** | `lib/tax-software/mef/certificate-handler.ts` | 220 | ✅ NEW |
| MeF Transmission | `lib/tax-software/mef/transmission.ts` | 386 | ✅ Updated |
| ACK Handler | `lib/tax-software/mef/acknowledgment.ts` | 366 | ✅ Complete |
| **ATS Test Runner** | `lib/tax-software/testing/ats-runner.ts` | 680 | ✅ NEW |
| Certification Tests | `lib/tax-software/testing/irs-certification.ts` | 446 | ✅ Complete |

---

## B) SCHEMA VALIDATION EVIDENCE

### Implementation

**File:** `lib/tax-software/schemas/schema-validator.ts`

**Features:**
- Structural XML validation (always runs)
- Full XSD validation (when schemas downloaded)
- Validates: Return structure, header, SSN/EIN formats, amounts, dates
- Stores validation errors with XPath locations
- Version-aware (supports multiple tax years)

### Schema Download Status

```
IRS schemas not yet downloaded.
Location: lib/tax-software/schemas/2024/

Required files:
- efile1040x_2024v1.0.xsd
- IRS1040_2024v1.0.xsd
- efileTypes_2024v1.0.xsd
- IRSW2_2024v1.0.xsd
- IRS1040ScheduleC_2024v1.0.xsd

Download from: IRS e-Services → MeF → Software Developer Resources
```

### Validation Output Sample

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "code": "SCHEMAS_NOT_DOWNLOADED",
      "message": "IRS schemas not found. Download from IRS e-Services.",
      "severity": "warning"
    }
  ],
  "schemaVersion": "2024v1.0 (structural only)",
  "validatedAt": "2026-01-24T22:35:26.201Z",
  "xmlHash": "f507b17aea2bcac1"
}
```

---

## C) SOAP TRANSMISSION EVIDENCE

### Implementation

**File:** `lib/tax-software/mef/soap-client.ts`

**Class:** `MeFSOAPClient`

**Endpoints Configured:**
```typescript
const MEF_ENDPOINTS = {
  production: {
    transmit: 'https://la.www4.irs.gov/a2a/mef/transmitter/TransmitterService',
    ack: 'https://la.www4.irs.gov/a2a/mef/transmitter/AcknowledgementService',
    status: 'https://la.www4.irs.gov/a2a/mef/transmitter/StatusService'
  },
  test: {
    transmit: 'https://la.www4.irs.gov/a2a/mef/test/transmitter/TransmitterService',
    ack: 'https://la.www4.irs.gov/a2a/mef/test/transmitter/AcknowledgementService',
    status: 'https://la.www4.irs.gov/a2a/mef/test/transmitter/StatusService'
  }
};
```

**Features:**
- Real SOAP 1.1 envelope construction
- Mutual TLS (mTLS) support
- Base64 XML encoding for transmission
- ACK parsing with error extraction
- Configurable timeout
- TEST vs PRODUCTION environment separation

### SOAP Envelope Sample (Redacted)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:mef="http://www.irs.gov/a2a/mef/MeFTransmitterService.xsd">
  <soap:Header>
    <mef:MeFHeader>
      <mef:EFIN>358459</mef:EFIN>
      <mef:SoftwareId>ELEVATE001</mef:SoftwareId>
      <mef:SessionIndicator>Y</mef:SessionIndicator>
      <mef:TestIndicator>T</mef:TestIndicator>
      <mef:Timestamp>2026-01-24T22:35:26.201Z</mef:Timestamp>
    </mef:MeFHeader>
  </soap:Header>
  <soap:Body>
    <mef:TransmitRequest>
      <mef:TransmissionHeader>
        <mef:TransmissionId>ATS-001-MKSW1H1D</mef:TransmissionId>
        <mef:Timestamp>2026-01-24T22:35:26.201Z</mef:Timestamp>
        <mef:TransmissionCount>1</mef:TransmissionCount>
      </mef:TransmissionHeader>
      <mef:ReturnDataList>
        <mef:ReturnData>
          <mef:SubmissionId>ATS-001-MKSW1H1D</mef:SubmissionId>
          <mef:TaxYear>2024</mef:TaxYear>
          <mef:ReturnType>1040</mef:ReturnType>
        </mef:ReturnData>
      </mef:ReturnDataList>
      <mef:BinaryAttachmentList>
        <mef:BinaryAttachment>
          <mef:ContentId>attachment</mef:ContentId>
          <mef:ContentType>application/xml</mef:ContentType>
          <mef:BinaryContent>[BASE64_ENCODED_RETURN_XML]</mef:BinaryContent>
        </mef:BinaryAttachment>
      </mef:BinaryAttachmentList>
    </mef:TransmitRequest>
  </soap:Body>
</soap:Envelope>
```

---

## D) CERTIFICATE HANDLING EVIDENCE

### Implementation

**File:** `lib/tax-software/mef/certificate-handler.ts`

**Features:**
- Separate TEST and PRODUCTION certificate paths
- Environment variable configuration
- Certificate loading and validation
- Fingerprint generation
- Setup instructions generator

### Environment Variables

```bash
# TEST Environment
IRS_TEST_CERT_PATH=/path/to/test/client.crt
IRS_TEST_KEY_PATH=/path/to/test/client.key
IRS_TEST_CA_PATH=/path/to/test/ca.crt
IRS_TEST_CERT_PASSPHRASE=<passphrase>

# PRODUCTION Environment
IRS_PROD_CERT_PATH=/path/to/prod/client.crt
IRS_PROD_KEY_PATH=/path/to/prod/client.key
IRS_PROD_CA_PATH=/path/to/prod/ca.crt
IRS_PROD_CERT_PASSPHRASE=<passphrase>
```

### Certificate Status

```
TEST Environment:
  ✗ Certificates not loaded
  Error: Missing certificates: Client certificate, Private key, CA certificate

PRODUCTION Environment:
  ✗ Certificates not loaded
  Error: Missing certificates: Client certificate, Private key, CA certificate
```

### Verification Script

```bash
npx tsx lib/tax-software/testing/verify-certificates.ts
```

---

## E) ATS TEST RUNNER EVIDENCE

### Implementation

**File:** `lib/tax-software/testing/ats-runner.ts`

**Features:**
- 4 ATS test scenarios implemented
- End-to-end testing: Input → XML → Validate → Transmit → ACK
- Evidence artifact persistence
- Markdown and JSON reports
- Simulated and real transmission modes

### Latest Test Run

**Run ID:** ATS-MKSW1H14  
**Timestamp:** 2026-01-24T22:35:26.200Z  
**Mode:** Simulated  
**Result:** 4/4 PASSED (100%)

| Scenario | Name | Schema | Transmitted | ACK | Status |
|----------|------|--------|-------------|-----|--------|
| ATS-001 | Single Filer - W-2 Only | ✓ | ✓ | accepted | **PASS** |
| ATS-002 | MFJ with Dependents | ✓ | ✓ | accepted | **PASS** |
| ATS-003 | Self-Employment Income | ✓ | ✓ | accepted | **PASS** |
| ATS-004 | EITC Eligible | ✓ | ✓ | accepted | **PASS** |

### Evidence Location

```
reports/ats-evidence/ATS-MKSW1H14/
├── ATS-001/
│   ├── input.json      # Tax return input data
│   ├── return.xml      # Generated MeF XML
│   └── result.json     # Test result details
├── ATS-002/
│   └── ...
├── ATS-003/
│   └── ...
├── ATS-004/
│   └── ...
├── report.json         # Full JSON report
└── report.md           # Markdown report
```

### Running ATS Tests

```bash
# Simulated mode (no IRS connection)
npx tsx lib/tax-software/testing/ats-runner.ts

# Real transmission mode (requires certificates)
npx tsx lib/tax-software/testing/ats-runner.ts --real

# Single scenario
npx tsx lib/tax-software/testing/ats-runner.ts --scenario=ATS-001
```

---

## F) SAMPLE XML OUTPUT

### ATS-001: Single Filer (Redacted)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Return xmlns="http://www.irs.gov/efile" returnVersion="2024v1.0">
  <ReturnHeader binaryAttachmentCnt="0">
    <ReturnTs>2026-01-24T22:35:26.201Z</ReturnTs>
    <TaxYr>2024</TaxYr>
    <TaxPeriodBeginDt>2024-01-01</TaxPeriodBeginDt>
    <TaxPeriodEndDt>2024-12-31</TaxPeriodEndDt>
    <SoftwareId>ELEVATE001</SoftwareId>
    <SoftwareVersionNum>2.0.0</SoftwareVersionNum>
    <OriginatorGrp>
      <EFIN>358459</EFIN>
      <OriginatorTypeCd>OnlineFiler</OriginatorTypeCd>
    </OriginatorGrp>
    <PINTypeCd>Self-Select On-Line</PINTypeCd>
    <JuratDisclosureCd>Online Self Select PIN</JuratDisclosureCd>
    <PrimaryPINEnteredByCd>Taxpayer</PrimaryPINEnteredByCd>
    <PrimarySignaturePIN>12345</PrimarySignaturePIN>
    <PrimarySignatureDt>2025-02-15</PrimarySignatureDt>
    <ReturnTypeCd>1040</ReturnTypeCd>
    <Filer>
      <PrimarySSN>400000001</PrimarySSN>
      <NameLine1Txt>JOHN TESTCASE</NameLine1Txt>
      <PrimaryNameControlTxt>TEST</PrimaryNameControlTxt>
      <USAddress>
        <AddressLine1Txt>123 TEST STREET</AddressLine1Txt>
        <CityNm>INDIANAPOLIS</CityNm>
        <StateAbbreviationCd>IN</StateAbbreviationCd>
        <ZIPCd>46201</ZIPCd>
      </USAddress>
    </Filer>
  </ReturnHeader>
  <ReturnData documentCnt="2">
    <IRS1040 documentId="IRS10400001">
      <IndividualReturnFilingStatusCd>1</IndividualReturnFilingStatusCd>
      <VirtualCurAcquiredDurTYInd>false</VirtualCurAcquiredDurTYInd>
      <TotalWagesAmt>50000</TotalWagesAmt>
      <WagesAmt>50000</WagesAmt>
      <TotalIncomeAmt>50000</TotalIncomeAmt>
      <AdjustedGrossIncomeAmt>50000</AdjustedGrossIncomeAmt>
      <TotalItemizedOrStandardDedAmt>14600</TotalItemizedOrStandardDedAmt>
      <TaxableIncomeAmt>35400</TaxableIncomeAmt>
      <TaxAmt>4012</TaxAmt>
      <TotalTaxBeforeCrAndOthTaxesAmt>4012</TotalTaxBeforeCrAndOthTaxesAmt>
      <TotalCreditsAmt>0</TotalCreditsAmt>
      <TotalTaxAmt>4012</TotalTaxAmt>
      <WithholdingTaxAmt>5000</WithholdingTaxAmt>
      <TotalPaymentsAmt>5000</TotalPaymentsAmt>
      <OverpaidAmt>988</OverpaidAmt>
      <RefundAmt>988</RefundAmt>
    </IRS1040>
    <IRSW2 documentId="IRSW20001">
      <EmployeeSSN>400000001</EmployeeSSN>
      <EmployerEIN>123456789</EmployerEIN>
      <EmployerNameControlTxt>TEST</EmployerNameControlTxt>
      <EmployerName>
        <BusinessNameLine1Txt>TEST CORPORATION</BusinessNameLine1Txt>
      </EmployerName>
      <WagesAmt>50000</WagesAmt>
      <WithholdingAmt>5000</WithholdingAmt>
      <SocialSecurityWagesAmt>50000</SocialSecurityWagesAmt>
      <SocialSecurityTaxAmt>3100</SocialSecurityTaxAmt>
      <MedicareWagesAndTipsAmt>50000</MedicareWagesAndTipsAmt>
      <MedicareTaxWithheldAmt>725</MedicareTaxWithheldAmt>
    </IRSW2>
  </ReturnData>
</Return>
```

---

## G) GO / NO-GO READINESS SUMMARY

| Item | Status | Evidence | Next Action |
|------|--------|----------|-------------|
| **Schema Validation** | ✅ Yes | `schema-validator.ts` - structural validation working | Download IRS XSD schemas |
| **XML Generation** | ✅ Yes | 4/4 scenarios generate valid XML | None |
| **SOAP Client** | ✅ Yes | `soap-client.ts` - full implementation | Test with real endpoint |
| **Certificate Handler** | ✅ Yes | `certificate-handler.ts` - TEST/PROD separation | Obtain IRS certificates |
| **ATS Test Runner** | ✅ Yes | 4/4 scenarios pass in simulated mode | Run with real transmission |
| **ACK Handling** | ✅ Yes | `acknowledgment.ts` - parses accepts/rejects | Test with real ACKs |
| **MeF Transmission** | ⚠️ Partial | Code complete, awaiting certificates | Obtain certificates |
| **EFIN Verified** | ❓ Unknown | Using 358459 | Verify in IRS e-Services |
| **Software ID** | ❌ No | Using placeholder ELEVATE001 | Apply through IRS |
| **IRS Certificates** | ❌ No | Not obtained | Obtain from IRS/IdenTrust |

### Readiness Status

```
┌─────────────────────────────────────────────────────────────┐
│                    MeF READINESS STATUS                      │
├─────────────────────────────────────────────────────────────┤
│  Code Complete:        ✅ YES                                │
│  Schema Validation:    ✅ YES (structural)                   │
│  SOAP Transmission:    ✅ YES (code ready)                   │
│  Certificate Support:  ✅ YES (code ready)                   │
│  ATS Scenarios:        ✅ 4/4 PASS (simulated)               │
│                                                              │
│  BLOCKING ITEMS:                                             │
│  ❌ IRS Certificates not obtained                            │
│  ❌ Software ID not assigned                                 │
│  ❓ EFIN status unverified                                   │
│                                                              │
│  OVERALL: READY FOR IRS TESTING (pending certificates)       │
└─────────────────────────────────────────────────────────────┘
```

---

## H) IMMEDIATE NEXT STEPS

### This Week (You)

1. **Log into IRS e-Services** (ID.me)
   - URL: https://www.irs.gov/e-file-providers/e-services-online-tools
   - Verify EFIN 358459 status
   - Update application to add Software Developer role

2. **Start Certificate Procurement**
   - Contact IdenTrust or other IRS-approved provider
   - Request TEST environment certificates first

### This Week (Engineering)

1. **Download IRS Schemas**
   - After e-Services access, download from MeF resources
   - Place in `lib/tax-software/schemas/2024/`

2. **Test Real Connection**
   - Once certificates obtained:
   ```bash
   npx tsx lib/tax-software/testing/ats-runner.ts --real
   ```

### After Certificate Approval

1. Run full ATS test suite with real transmission
2. Collect ACK evidence
3. Submit for Software ID approval
4. Complete IRS ATS certification

---

## I) FILE MANIFEST

```
lib/tax-software/
├── index.ts                           # Module exports
├── types.ts                           # TypeScript interfaces
├── forms/
│   └── form-1040.ts                   # Tax calculations
├── validation/
│   └── irs-rules.ts                   # IRS validation rules
├── schemas/
│   ├── schema-validator.ts            # XML schema validation
│   └── 2024/                          # IRS schemas (TBD)
├── mef/
│   ├── xml-generator.ts               # MeF XML generation
│   ├── soap-client.ts                 # SOAP transmission
│   ├── certificate-handler.ts         # Certificate management
│   ├── transmission.ts                # Transmission orchestration
│   └── acknowledgment.ts              # ACK handling
└── testing/
    ├── ats-runner.ts                  # ATS test runner
    ├── irs-certification.ts           # Certification tests
    ├── run-tests.ts                   # Quick test runner
    └── verify-certificates.ts         # Certificate verification

reports/
├── sbin-readiness-pack.md             # This document
└── ats-evidence/                      # ATS test evidence
    └── ATS-MKSW1H14/                  # Latest run
        ├── report.md
        ├── report.json
        └── ATS-00X/                   # Per-scenario evidence
```

---

**Report Generated By:** Elevate Tax Software System v2.0.0  
**Contact:** support@elevateforhumanity.org
