/**
 * NDA and Non-Compete Template for Onboarding
 * Standalone agreement for employees, contractors, and partners
 */

export interface NDAData {
  recipientName: string;
  recipientType: 'employee' | 'contractor' | 'partner' | 'program-holder';
  companyName?: string;
  effectiveDate: string;
  recipientEmail?: string;
  recipientAddress?: string;
}

export function generateNDAText(data: NDAData): string {
  const recipientTypeLabel = {
    'employee': 'Employee',
    'contractor': 'Independent Contractor',
    'partner': 'Partner',
    'program-holder': 'Program Holder / Training Provider'
  }[data.recipientType];

  return `ELEVATE FOR HUMANITY CAREER & TECHNICAL INSTITUTE
NON-DISCLOSURE AND NON-COMPETE AGREEMENT

This Non-Disclosure and Non-Compete Agreement ("Agreement") is entered into as of ${data.effectiveDate} by and between:

ELEVATE FOR HUMANITY CAREER & TECHNICAL INSTITUTE
("Elevate", "EFH", or "Company")

and

${data.recipientName}
${data.companyName ? `on behalf of ${data.companyName}` : ''}
("Recipient" or "${recipientTypeLabel}")

RECITALS

WHEREAS, Recipient will have access to confidential and proprietary information of Elevate in connection with their ${data.recipientType === 'employee' ? 'employment' : 'business relationship'} with Elevate;

WHEREAS, Elevate has invested significant time, effort, and resources in developing its business, training programs, curricula, participant relationships, and funding source partnerships;

WHEREAS, the parties wish to protect Elevate's confidential information and legitimate business interests;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:

1. CONFIDENTIAL INFORMATION

1.1 Definition

"Confidential Information" means any and all information, whether written, oral, electronic, or visual, disclosed by Elevate to Recipient, including but not limited to:

a. PARTICIPANT INFORMATION
   • Names, contact information, social security numbers
   • Employment history, criminal background, health information
   • Educational records, training progress, assessment results
   • Personal circumstances, barriers to employment, case notes
   • Any other personally identifiable information (PII)

b. BUSINESS INFORMATION
   • Business strategies, plans, forecasts, and projections
   • Financial information, pricing, revenue models, and compensation structures
   • Marketing strategies, sales data, and customer lists
   • Funding source relationships and grant applications
   • Partnership agreements and vendor relationships

c. TECHNICAL INFORMATION
   • Training curricula, course materials, and assessments
   • Software, databases, algorithms, and source code
   • Technology systems, platforms, and integrations
   • Proprietary methodologies and processes
   • Research, development, and innovation projects

d. OPERATIONAL INFORMATION
   • Standard operating procedures and workflows
   • Compliance documentation and audit materials
   • Employee information and organizational structure
   • Trade secrets and know-how
   • Any information marked as "Confidential" or "Proprietary"

1.2 Exclusions

Confidential Information does not include information that:

a. Is or becomes publicly available through no breach of this Agreement
b. Was rightfully in Recipient's possession prior to disclosure by Elevate
c. Is independently developed by Recipient without use of Confidential Information
d. Is rightfully received from a third party without breach of confidentiality
e. Must be disclosed pursuant to law, court order, or government regulation (with prior written notice to Elevate when legally permissible)

2. OBLIGATIONS OF RECIPIENT

2.1 Confidentiality

Recipient agrees to:

a. Hold all Confidential Information in strict confidence
b. Not disclose Confidential Information to any third party without Elevate's prior written consent
c. Use Confidential Information solely for the purposes of their ${data.recipientType === 'employee' ? 'employment' : 'business relationship'} with Elevate
d. Take all reasonable precautions to prevent unauthorized disclosure
e. Limit access to Confidential Information to those with a legitimate need to know
f. Implement appropriate security measures to protect Confidential Information
g. Immediately notify Elevate of any unauthorized disclosure or suspected breach

2.2 Return of Materials

Upon termination of ${data.recipientType === 'employee' ? 'employment' : 'this Agreement'} or upon Elevate's request, Recipient shall:

a. Immediately return all Confidential Information in any form
b. Delete all electronic copies of Confidential Information
c. Destroy all notes, summaries, or derivative works containing Confidential Information
d. Provide written certification of compliance with these requirements

2.3 Data Protection Compliance

Recipient acknowledges that participant information may be protected under:

a. FERPA (Family Educational Rights and Privacy Act)
b. HIPAA (Health Insurance Portability and Accountability Act)
c. State and federal privacy laws
d. Workforce program confidentiality requirements

Recipient agrees to comply with all applicable privacy laws and regulations.

3. NON-COMPETE AGREEMENT

3.1 Competitive Activities Prohibited

During ${data.recipientType === 'employee' ? 'employment' : 'the term of this Agreement'} and for a period of TWO (2) YEARS following termination, Recipient agrees not to:

a. DIRECT COMPETITION
   • Establish, own, operate, or have any financial interest in any business that directly competes with Elevate's workforce development, training, or apprenticeship programs
   • Partner with, consult for, or provide services to any competing WIOA training provider, workforce development organization, or apprenticeship sponsor
   • Use Elevate's Confidential Information to establish or support a competing business

b. FUNDING SOURCE COMPETITION
   • Solicit or accept funding from Elevate's existing funding sources (WRG, WIOA, JRI, EmployIndy, DOL, etc.) for competing programs
   • Interfere with Elevate's relationships with workforce boards, government agencies, or funding entities
   • Encourage or induce any funding source to terminate or reduce their relationship with Elevate

c. GEOGRAPHIC AND MARKET RESTRICTIONS
   • The non-compete restrictions apply to the following geographic areas where Elevate operates:
     * Indiana (statewide)
     * Any other state where Elevate has active programs or funding relationships
   • The restrictions apply to the following market segments:
     * WIOA-funded workforce development programs
     * DOL-registered apprenticeship programs
     * Justice-involved reentry training programs
     * Any other workforce development programs serving similar populations

3.2 Permitted Activities

The non-compete provisions do NOT prohibit Recipient from:

a. Working in industries or roles that do not directly compete with Elevate's workforce development programs
b. Providing general consulting or training services that do not compete with Elevate's specific programs
c. Operating a business in geographic areas or market segments not served by Elevate
d. Accepting employment with an organization that has some overlap with Elevate, provided Recipient does not work on competing programs

4. NON-SOLICITATION

4.1 Participants

During ${data.recipientType === 'employee' ? 'employment' : 'the term of this Agreement'} and for TWO (2) YEARS following termination, Recipient agrees not to:

a. Solicit, recruit, or enroll any Elevate participant into a competing training program
b. Encourage or induce any Elevate participant to leave their current program
c. Use participant contact information for any purpose other than Elevate's business
d. Directly or indirectly contact Elevate participants for competitive purposes

4.2 Employees and Contractors

During ${data.recipientType === 'employee' ? 'employment' : 'the term of this Agreement'} and for ONE (1) YEAR following termination, Recipient agrees not to:

a. Solicit, recruit, or hire any Elevate employee or contractor
b. Encourage or induce any Elevate employee to terminate their employment
c. Interfere with Elevate's relationships with its workforce

4.3 Partners and Vendors

During ${data.recipientType === 'employee' ? 'employment' : 'the term of this Agreement'} and for ONE (1) YEAR following termination, Recipient agrees not to:

a. Solicit or encourage any Elevate partner, vendor, or service provider to terminate their relationship with Elevate
b. Interfere with Elevate's business relationships
c. Use knowledge of Elevate's partnerships to gain competitive advantage

5. INTELLECTUAL PROPERTY

5.1 Ownership

All training materials, curricula, software, content, branding, trademarks, and intellectual property created by or for Elevate remain the exclusive property of Elevate.

5.2 Work Product

Any work product, materials, or intellectual property created by Recipient during ${data.recipientType === 'employee' ? 'employment' : 'the term of this Agreement'} that relates to Elevate's business shall be deemed "work made for hire" and shall be the exclusive property of Elevate.

5.3 Assignment

To the extent any work product does not qualify as "work made for hire," Recipient hereby assigns all right, title, and interest in such work product to Elevate.

6. TERM AND TERMINATION

6.1 Term

This Agreement becomes effective on ${data.effectiveDate} and continues:

a. For employees: During employment and for the periods specified in Sections 3 and 4 following termination
b. For contractors/partners: During the business relationship and for the periods specified in Sections 3 and 4 following termination

6.2 Survival

The following provisions survive termination of ${data.recipientType === 'employee' ? 'employment' : 'this Agreement'}:

a. Confidentiality obligations (Section 2): Five (5) years, or indefinitely for trade secrets and participant PII
b. Non-compete obligations (Section 3): Two (2) years
c. Non-solicitation obligations (Section 4): One (1) to two (2) years as specified
d. Intellectual property provisions (Section 5): Indefinitely

7. REMEDIES

7.1 Irreparable Harm

Recipient acknowledges that breach of this Agreement would cause irreparable harm to Elevate that cannot be adequately compensated by monetary damages alone.

7.2 Injunctive Relief

In the event of breach or threatened breach, Elevate shall be entitled to:

a. Immediate injunctive relief without the necessity of posting bond
b. Specific performance of this Agreement
c. Any other equitable relief deemed appropriate by a court

7.3 Monetary Damages

In addition to injunctive relief, Elevate shall be entitled to:

a. Recovery of all actual damages, including lost revenue, lost funding, and lost business opportunities
b. Recovery of all costs and expenses, including reasonable attorney's fees
c. Any other damages available at law or in equity

7.4 No Waiver

Elevate's failure to enforce any provision of this Agreement shall not constitute a waiver of that provision or any other provision.

8. REASONABLENESS

8.1 Acknowledgment

Recipient acknowledges and agrees that:

a. The restrictions in this Agreement are reasonable in scope, duration, and geographic area
b. The restrictions are necessary to protect Elevate's legitimate business interests
c. The restrictions do not impose an undue hardship on Recipient
d. Recipient has had the opportunity to review this Agreement and seek legal counsel

8.2 Severability

If any provision of this Agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect. If any restriction is found to be unreasonable, it shall be modified to the minimum extent necessary to make it enforceable.

9. GENERAL PROVISIONS

9.1 Governing Law

This Agreement shall be governed by and construed in accordance with the laws of the State of Indiana, without regard to conflicts of law principles.

9.2 Jurisdiction

Any legal action arising out of this Agreement shall be brought exclusively in the state or federal courts located in Marion County, Indiana.

9.3 Entire Agreement

This Agreement constitutes the entire agreement between the parties regarding confidentiality, non-compete, and non-solicitation matters and supersedes all prior agreements and understandings.

9.4 Amendment

This Agreement may only be amended in writing signed by both parties.

9.5 Assignment

Recipient may not assign this Agreement without Elevate's prior written consent. Elevate may assign this Agreement to any successor or affiliate.

9.6 Notices

All notices under this Agreement shall be in writing and delivered to:

Elevate For Humanity Career & Technical Institute
${data.recipientEmail ? `Recipient: ${data.recipientEmail}` : 'Recipient: [Email on file]'}

10. ACKNOWLEDGMENT

By signing below, Recipient acknowledges that they have:

a. Read and understood this Agreement in its entirety
b. Had the opportunity to seek legal counsel
c. Voluntarily agreed to all terms and conditions
d. Received adequate consideration for entering into this Agreement

SIGNATURES

ELEVATE FOR HUMANITY CAREER & TECHNICAL INSTITUTE

By: _______________________________
Name: _____________________________
Title: ______________________________
Date: ______________________________

RECIPIENT

Name: ${data.recipientName}
${data.companyName ? `Company: ${data.companyName}` : ''}
Signature: _______________________________
Date: ${data.effectiveDate}
${data.recipientEmail ? `Email: ${data.recipientEmail}` : ''}
${data.recipientAddress ? `Address: ${data.recipientAddress}` : ''}

---

This Agreement was generated on ${data.effectiveDate} via the Elevate for Humanity Onboarding System.
For questions or concerns, contact: legal@www.elevateforhumanity.org

IMPORTANT NOTICE: This is a legally binding agreement. By signing, you agree to be bound by all terms and conditions. If you have questions or concerns, please seek legal counsel before signing.
`;
}

export function generateOnboardingPackageWithNDA(data: NDAData & { includeHandbook?: boolean }): {
  nda: string;
  checklist: string[];
  documents: string[];
} {
  return {
    nda: generateNDAText(data),
    checklist: [
      '✅ Review and sign NDA and Non-Compete Agreement',
      '✅ Complete I-9 Employment Eligibility Verification',
      '✅ Provide government-issued photo ID',
      '✅ Complete W-4 Tax Withholding Form',
      '✅ Review Employee Handbook (if applicable)',
      '✅ Complete background check authorization',
      '✅ Set up direct deposit',
      '✅ Complete benefits enrollment (if applicable)',
      '✅ Review confidentiality and data protection policies',
      '✅ Complete required training modules',
      '✅ Acknowledge receipt of company policies',
      '✅ Set up email and system access',
    ],
    documents: [
      'NDA and Non-Compete Agreement',
      'I-9 Form',
      'W-4 Form',
      data.includeHandbook ? 'Employee Handbook' : null,
      'Background Check Authorization',
      'Direct Deposit Form',
      'Confidentiality Policy',
      'Data Protection Policy',
      'Code of Conduct',
      'Acceptable Use Policy',
    ].filter(Boolean) as string[],
  };
}
