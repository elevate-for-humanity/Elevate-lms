/**
 * Complete Digital Onboarding System
 * All forms, payroll, and documents fully digital
 */

export interface OnboardingData {
  // Personal Information
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string; // Encrypted in production

  // Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;

  // Employment
  employeeType: 'employee' | 'contractor' | 'partner' | 'program-holder';
  position: string;
  department: string;
  startDate: string;
  salary?: number;
  hourlyRate?: number;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;

  // Tax Information (W-4)
  filingStatus: 'single' | 'married-joint' | 'married-separate' | 'head-of-household';
  dependents: number;
  additionalWithholding?: number;
  claimExempt: boolean;

  // Direct Deposit
  bankName: string;
  accountType: 'checking' | 'savings';
  routingNumber: string;
  accountNumber: string;

  // I-9 Information
  citizenshipStatus: 'citizen' | 'permanent-resident' | 'authorized-alien';
  documentType: string;
  documentNumber: string;
  documentExpiration?: string;

  // Background Check
  backgroundCheckConsent: boolean;
  criminalHistory?: string;

  // Agreements
  ndaAccepted: boolean;
  nonCompeteAccepted: boolean;
  handbookAccepted: boolean;
  codeOfConductAccepted: boolean;

  // Signatures
  signature: string; // Base64 encoded signature
  signatureDate: string;
  ipAddress?: string;
}

export interface OnboardingPackage {
  forms: OnboardingForm[];
  documents: OnboardingDocument[];
  checklist: OnboardingChecklistItem[];
  status: OnboardingStatus;
}

export interface OnboardingForm {
  id: string;
  name: string;
  type:
    | 'w4'
    | 'i9'
    | 'direct-deposit'
    | 'emergency-contact'
    | 'nda'
    | 'background-check'
    | 'handbook';
  required: boolean;
  completed: boolean;
  data?: any;
  signedAt?: string;
  ipAddress?: string;
}

export interface OnboardingDocument {
  id: string;
  name: string;
  type: string;
  url?: string;
  content?: string;
  required: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  order: number;
}

export interface OnboardingStatus {
  overallProgress: number;
  formsCompleted: number;
  formsTotal: number;
  documentsAcknowledged: number;
  documentsTotal: number;
  checklistCompleted: number;
  checklistTotal: number;
  isComplete: boolean;
  canStartWork: boolean;
}

export function generateCompleteOnboardingPackage(
  data: Partial<OnboardingData>,
): OnboardingPackage {
  const forms: OnboardingForm[] = [
    {
      id: 'w4',
      name: 'W-4 Tax Withholding Form',
      type: 'w4',
      required: true,
      completed: !!(data.filingStatus && data.dependents !== undefined),
    },
    {
      id: 'i9',
      name: 'I-9 Employment Eligibility Verification',
      type: 'i9',
      required: true,
      completed: !!(data.citizenshipStatus && data.documentType),
    },
    {
      id: 'direct-deposit',
      name: 'Direct Deposit Authorization',
      type: 'direct-deposit',
      required: true,
      completed: !!(data.bankName && data.routingNumber && data.accountNumber),
    },
    {
      id: 'emergency-contact',
      name: 'Emergency Contact Information',
      type: 'emergency-contact',
      required: true,
      completed: !!(data.emergencyContactName && data.emergencyContactPhone),
    },
    {
      id: 'nda',
      name: 'NDA and Non-Compete Agreement',
      type: 'nda',
      required: true,
      completed: !!data.ndaAccepted && data.nonCompeteAccepted,
    },
    {
      id: 'background-check',
      name: 'Background Check Authorization',
      type: 'background-check',
      required: true,
      completed: data.backgroundCheckConsent === true,
    },
    {
      id: 'handbook',
      name: 'Employee Handbook Acknowledgment',
      type: 'handbook',
      required: true,
      completed: data.handbookAccepted === true,
    },
  ];

  const documents: OnboardingDocument[] = [
    {
      id: 'nda-doc',
      name: 'NDA and Non-Compete Agreement',
      type: 'legal',
      required: true,
      acknowledged: data.ndaAccepted || false,
    },
    {
      id: 'handbook-doc',
      name: 'Employee Handbook',
      type: 'policy',
      required: true,
      acknowledged: data.handbookAccepted || false,
    },
    {
      id: 'code-of-conduct',
      name: 'Code of Conduct',
      type: 'policy',
      required: true,
      acknowledged: data.codeOfConductAccepted || false,
    },
    {
      id: 'confidentiality-policy',
      name: 'Confidentiality Policy',
      type: 'policy',
      required: true,
      acknowledged: false,
    },
    {
      id: 'data-protection-policy',
      name: 'Data Protection Policy',
      type: 'policy',
      required: true,
      acknowledged: false,
    },
    {
      id: 'acceptable-use-policy',
      name: 'Acceptable Use Policy',
      type: 'policy',
      required: true,
      acknowledged: false,
    },
    {
      id: 'benefits-guide',
      name: 'Benefits Guide',
      type: 'information',
      required: false,
      acknowledged: false,
    },
    {
      id: 'payroll-schedule',
      name: 'Payroll Schedule',
      type: 'information',
      required: false,
      acknowledged: false,
    },
  ];

  const checklist: OnboardingChecklistItem[] = [
    {
      id: 'personal-info',
      title: 'Complete Personal Information',
      description: 'Provide your full name, contact details, and address',
      required: true,
      completed: !!(data.firstName && data.lastName && data.email && data.phone),
      order: 1,
    },
    {
      id: 'tax-forms',
      title: 'Complete Tax Forms (W-4)',
      description: 'Fill out federal and state tax withholding forms',
      required: true,
      completed: !!(data.filingStatus && data.dependents !== undefined),
      order: 2,
    },
    {
      id: 'i9-verification',
      title: 'Complete I-9 Verification',
      description: 'Verify employment eligibility with required documents',
      required: true,
      completed: !!(data.citizenshipStatus && data.documentType),
      order: 3,
    },
    {
      id: 'direct-deposit',
      title: 'Set Up Direct Deposit',
      description: 'Provide bank account information for payroll',
      required: true,
      completed: !!(data.bankName && data.routingNumber && data.accountNumber),
      order: 4,
    },
    {
      id: 'emergency-contact',
      title: 'Add Emergency Contact',
      description: 'Provide emergency contact information',
      required: true,
      completed: !!(data.emergencyContactName && data.emergencyContactPhone),
      order: 5,
    },
    {
      id: 'sign-nda',
      title: 'Sign NDA and Non-Compete',
      description: 'Review and digitally sign confidentiality agreements',
      required: true,
      completed: !!data.ndaAccepted && data.nonCompeteAccepted,
      order: 6,
    },
    {
      id: 'background-check',
      title: 'Authorize Background Check',
      description: 'Consent to background check screening',
      required: true,
      completed: data.backgroundCheckConsent === true,
      order: 7,
    },
    {
      id: 'review-handbook',
      title: 'Review Employee Handbook',
      description: 'Read and acknowledge employee handbook',
      required: true,
      completed: data.handbookAccepted === true,
      order: 8,
    },
    {
      id: 'review-policies',
      title: 'Review Company Policies',
      description: 'Acknowledge code of conduct and company policies',
      required: true,
      completed: data.codeOfConductAccepted === true,
      order: 9,
    },
    {
      id: 'system-access',
      title: 'Set Up System Access',
      description: 'Create accounts and access credentials',
      required: true,
      completed: false,
      order: 10,
    },
    {
      id: 'training-modules',
      title: 'Complete Required Training',
      description: 'Finish mandatory training modules',
      required: true,
      completed: false,
      order: 11,
    },
    {
      id: 'final-signature',
      title: 'Final Signature',
      description: 'Digitally sign to complete onboarding',
      required: true,
      completed: !!(data.signature && data.signatureDate),
      order: 12,
    },
  ];

  const formsCompleted = forms.filter((f) => f.completed).length;
  const documentsAcknowledged = documents.filter((d) => d.acknowledged).length;
  const checklistCompleted = checklist.filter((c) => c.completed).length;

  const requiredFormsCompleted = forms.filter((f) => f.required && f.completed).length;
  const requiredFormsTotal = forms.filter((f) => f.required).length;
  const requiredDocsAcknowledged = documents.filter((d) => d.required && d.acknowledged).length;
  const requiredDocsTotal = documents.filter((d) => d.required).length;
  const requiredChecklistCompleted = checklist.filter((c) => c.required && c.completed).length;
  const requiredChecklistTotal = checklist.filter((c) => c.required).length;

  const overallProgress = Math.round(
    ((formsCompleted + documentsAcknowledged + checklistCompleted) /
      (forms.length + documents.length + checklist.length)) *
      100,
  );

  const isComplete =
    requiredFormsCompleted === requiredFormsTotal &&
    requiredDocsAcknowledged === requiredDocsTotal &&
    requiredChecklistCompleted === requiredChecklistTotal;

  const canStartWork =
    requiredFormsCompleted === requiredFormsTotal &&
    !!data.ndaAccepted &&
    !!data.backgroundCheckConsent &&
    !!data.signature;

  return {
    forms,
    documents,
    checklist,
    status: {
      overallProgress,
      formsCompleted,
      formsTotal: forms.length,
      documentsAcknowledged,
      documentsTotal: documents.length,
      checklistCompleted,
      checklistTotal: checklist.length,
      isComplete,
      canStartWork,
    },
  };
}

// W-4 Form Generator
export function generateW4Form(data: OnboardingData): string {
  return `FORM W-4 (Digital)
Employee's Withholding Certificate

Employee Information:
Name: ${data.firstName} ${data.middleName || ''} ${data.lastName}
Social Security Number: ${data.ssn}
Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}

Step 1: Filing Status
☐ Single or Married filing separately
☐ Married filing jointly
☐ Head of household
Selected: ${data.filingStatus}

Step 2: Multiple Jobs or Spouse Works
Number of dependents: ${data.dependents}

Step 3: Claim Dependents
Total dependents claimed: ${data.dependents}

Step 4: Other Adjustments
Additional withholding: $${data.additionalWithholding || 0}

Step 5: Sign Here
I certify that I am entitled to the number of withholding allowances claimed on this certificate.

Signature: ${data.signature ? '[Digitally Signed]' : '[Not Signed]'}
Date: ${data.signatureDate}
IP Address: ${data.ipAddress || 'N/A'}

Employer Information:
Elevate For Humanity Career & Technical Institute
EIN: [Company EIN]
`;
}

// I-9 Form Generator
export function generateI9Form(data: OnboardingData): string {
  return `FORM I-9 (Digital)
Employment Eligibility Verification

Section 1: Employee Information and Attestation

Last Name: ${data.lastName}
First Name: ${data.firstName}
Middle Initial: ${data.middleName?.[0] || ''}

Address: ${data.streetAddress}
City: ${data.city}
State: ${data.state}
ZIP Code: ${data.zipCode}

Date of Birth: ${data.dateOfBirth}
Social Security Number: ${data.ssn}
Email: ${data.email}
Phone: ${data.phone}

Citizenship/Immigration Status:
${data.citizenshipStatus === 'citizen' ? '☑' : '☐'} A citizen of the United States
${data.citizenshipStatus === 'permanent-resident' ? '☑' : '☐'} A noncitizen national of the United States
${data.citizenshipStatus === 'authorized-alien' ? '☑' : '☐'} A lawful permanent resident
☐ An alien authorized to work

Employee Attestation:
I attest, under penalty of perjury, that I am (check one):
- ${data.citizenshipStatus}

Signature: ${data.signature ? '[Digitally Signed]' : '[Not Signed]'}
Date: ${data.signatureDate}
IP Address: ${data.ipAddress || 'N/A'}

Section 2: Employer Review and Verification

Document Type: ${data.documentType}
Document Number: ${data.documentNumber}
Expiration Date: ${data.documentExpiration || 'N/A'}

Employer Certification:
I attest, under penalty of perjury, that I have examined the document(s) presented by the above-named employee, and they appear to be genuine and relate to the employee named.

Employer Name: Elevate For Humanity Career & Technical Institute
Signature: [To be completed by HR]
Date: [To be completed by HR]
`;
}

// Direct Deposit Form Generator
export function generateDirectDepositForm(data: OnboardingData): string {
  return `DIRECT DEPOSIT AUTHORIZATION FORM

Employee Information:
Name: ${data.firstName} ${data.lastName}
Employee ID: [To be assigned]
Email: ${data.email}

Bank Information:
Bank Name: ${data.bankName}
Account Type: ${data.accountType === 'checking' ? '☑ Checking' : '☐ Checking'} ${data.accountType === 'savings' ? '☑ Savings' : '☐ Savings'}
Routing Number: ${data.routingNumber}
Account Number: ${data.accountNumber}

Authorization:
I hereby authorize Elevate For Humanity Career & Technical Institute to deposit my net pay directly into the account specified above. I understand that:

1. This authorization will remain in effect until I submit a written cancellation
2. I must provide at least one pay period notice to change or cancel this authorization
3. The company reserves the right to recover any overpayments through payroll deduction
4. I am responsible for notifying the company of any changes to my banking information

Signature: ${data.signature ? '[Digitally Signed]' : '[Not Signed]'}
Date: ${data.signatureDate}
IP Address: ${data.ipAddress || 'N/A'}

For Office Use Only:
Approved by: _______________
Date: _______________
Effective Pay Period: _______________
`;
}

// Emergency Contact Form Generator
export function generateEmergencyContactForm(data: OnboardingData): string {
  return `EMERGENCY CONTACT INFORMATION

Employee Information:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}

Emergency Contact:
Name: ${data.emergencyContactName}
Phone: ${data.emergencyContactPhone}
Relationship: ${data.emergencyContactRelationship}

I authorize Elevate For Humanity to contact the person listed above in case of emergency.

Signature: ${data.signature ? '[Digitally Signed]' : '[Not Signed]'}
Date: ${data.signatureDate}
`;
}

// Background Check Authorization
export function generateBackgroundCheckForm(data: OnboardingData): string {
  return `BACKGROUND CHECK AUTHORIZATION

Employee Information:
Name: ${data.firstName} ${data.middleName || ''} ${data.lastName}
Date of Birth: ${data.dateOfBirth}
Social Security Number: ${data.ssn}
Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}

Authorization:
I hereby authorize Elevate For Humanity Career & Technical Institute to conduct a background check, which may include:

☑ Criminal history check
☑ Employment verification
☑ Education verification
☑ Reference checks
☑ Credit check (if applicable to position)
☑ Driving record (if applicable to position)

I understand that:
1. The background check will be conducted by a third-party consumer reporting agency
2. I have the right to receive a copy of the report
3. I will be notified if adverse action is taken based on the report
4. I have the right to dispute any inaccurate information

Disclosure of Criminal History (if applicable):
${data.criminalHistory || 'None disclosed'}

Signature: ${data.signature ? '[Digitally Signed]' : '[Not Signed]'}
Date: ${data.signatureDate}
IP Address: ${data.ipAddress || 'N/A'}
`;
}

// Complete Onboarding Summary
export function generateOnboardingSummary(data: OnboardingData): string {
  const onboardingPackage = generateCompleteOnboardingPackage(data);

  return `ONBOARDING SUMMARY

Employee: ${data.firstName} ${data.lastName}
Position: ${data.position}
Department: ${data.department}
Start Date: ${data.startDate}

Overall Progress: ${onboardingPackage.status.overallProgress}%

Forms Completed: ${onboardingPackage.status.formsCompleted}/${onboardingPackage.status.formsTotal}
Documents Acknowledged: ${onboardingPackage.status.documentsAcknowledged}/${onboardingPackage.status.documentsTotal}
Checklist Items: ${onboardingPackage.status.checklistCompleted}/${onboardingPackage.status.checklistTotal}

Status: ${onboardingPackage.status.isComplete ? '✅ COMPLETE' : '⚠️ IN PROGRESS'}
Can Start Work: ${onboardingPackage.status.canStartWork ? '✅ YES' : '❌ NO'}

Completed Forms:
${onboardingPackage.forms
  .filter((f) => f.completed)
  .map((f) => `✅ ${f.name}`)
  .join('\n')}

Pending Forms:
${onboardingPackage.forms
  .filter((f) => !f.completed)
  .map((f) => `⚠️ ${f.name}`)
  .join('\n')}

Next Steps:
${onboardingPackage.checklist
  .filter((c) => !c.completed && c.required)
  .map((c) => `• ${c.title}`)
  .join('\n')}
`;
}
