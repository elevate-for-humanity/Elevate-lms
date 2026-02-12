/**
 * MOU Template Generator
 * Generates a Memorandum of Understanding for Training Providers
 */

export interface MOUData {
  programHolderName: string;
  payoutShare: number;
  contactName?: string;
  contactEmail?: string;
  date: string;
}

export function generateMOUText(data: MOUData): string {
  const payoutPercent = (data.payoutShare * 100).toFixed(1);

  return `ELEVATE FOR HUMANITY CAREER & TECHNICAL INSTITUTE
PROGRAM HOLDER / TRAINING PROVIDER
MEMORANDUM OF UNDERSTANDING (MOU)

This Memorandum of Understanding ("MOU") outlines the collaborative partnership between:

Elevate for Humanity Career & Technical Institute
("Elevate", "EFH", or "Training Sponsor")

and

${data.programHolderName}
("Program Holder" or "Training Provider")

together referred to as the "Parties."

NATURE OF RELATIONSHIP:

This MOU establishes a collaborative partnership where both parties work together to deliver high-quality workforce training. This is NOT an employer-employee relationship, franchise, or subordinate arrangement. Instead, this is a partnership of equals working toward shared goals:

• Elevate provides the infrastructure, compliance framework, funding coordination, and wraparound services
• Program Holder provides the hands-on training, facility, instruction, and day-to-day student support
• Both parties collaborate to ensure student success and program quality
• Both parties share in the revenue generated from successful student outcomes

This collaborative model allows Program Holders to focus on what they do best (training) while Elevate handles the administrative complexity of workforce development programs.

1. PURPOSE OF THIS MOU

The purpose of this MOU is to establish a clear, written understanding of how Elevate and the Program Holder will work together to deliver workforce training programs (for example: WRG, WIOA, JRI, EmployIndy, DOL-registered apprenticeships, and other aligned initiatives) and how revenue will be shared for eligible, funded participants who complete training and/or earn credentials.

2. ROLES AND RESPONSIBILITIES

2.1 Elevate for Humanity will:

a. Serve as the primary training sponsor and system of record for the programs listed in this MOU.

b. Provide and maintain the Elevate Learning Management System (LMS), participant portal, case notes, certificates, and reporting tools.

c. Coordinate with state and local workforce agencies, credentialing partners, and funding sources to keep programs compliant and in good standing.

d. Enroll participants into approved training tracks and track participation, training hours, completions, and certifications.

e. Manage collection of funds from workforce programs and other funders.

f. Calculate and issue revenue share payments to Program Holder according to the compensation structure described in Section 4.

2.2 Program Holder will:

a. Provide a safe, professional training environment for participants, including physical space and day-to-day supervision at the worksite or classroom.

b. Deliver hands-on training, coaching, and supervision consistent with the curriculum, scope of work, and compliance requirements provided by Elevate and/or credentialing partners.

c. Maintain reasonable attendance expectations, sign-in procedures, and communication with participants.

d. Enter case notes, progress updates, and follow-up information into the Elevate portal as requested.

e. Notify Elevate promptly of any issues that may impact a participant's participation, safety, or eligibility.

f. Comply with all applicable laws, policies, and regulations relating to workplace safety, nondiscrimination, confidentiality, and workforce programs.

3. PROGRAMS COVERED

This MOU may cover one or more training tracks, including but not limited to:

• Barber / Beauty Apprenticeship
• CNA / Patient Care / Home Health
• HVAC / Building Technician / Construction
• Peer Support / Recovery Coach
• Financial Literacy / Tax Training
• Other industry-recognized credential programs

Specific programs, credentials, and funding streams (WRG, WIOA, JRI, EmployIndy, DOL, etc.) may be added or updated in writing (email or signed addendum) without rewriting the entire MOU.

4. COMPENSATION AND REVENUE SHARE

4.1 Definition of Net Program Revenue

For each funded participant, Elevate may receive program revenue from one or more sources (for example: WRG, WIOA, JRI, EmployIndy, DOL, employer contributions, or tuition). For the purpose of this agreement, Net Program Revenue means:

Total eligible training revenue actually received by Elevate for that participant
MINUS direct, required program costs including:
• Credentialing partner fees (testing, licensing, third-party exam vendors)
• Required background checks, drug screens, or clearances
• Approved learner toolkits and required equipment (kits, books, scrubs, PPE, basic tools)
• Platform, processing, and compliance fees directly tied to that participant or that training program

Net Program Revenue is calculated at the participant/program level or in reasonable grouped batches, using documentation maintained by Elevate.

4.2 Program Holder Share (Universal 1/3 Model - PER STUDENT)

For EACH INDIVIDUAL STUDENT who is officially enrolled, funded, and started training under this MOU, the Program Holder will receive:

ONE-THIRD (1/3 or 33.33%) of the Net Program Revenue associated with THAT SPECIFIC STUDENT's training track.

IMPORTANT: This is calculated and paid PER STUDENT, not as a lump sum. Each student generates their own separate payment to the Program Holder.

This universal rate applies to all Program Holders and all programs to ensure fairness and consistency across the network.

PAYMENT STRUCTURE - TWO INCREMENTS PER STUDENT:

Payment 1 (50% of Program Holder Share PER STUDENT):
• Paid at mid-enrollment milestone FOR EACH STUDENT
• When that specific student reaches 50% completion of training hours
• After enrollment verified and mid-point progress documented
• Approximately 16.67% of Net Program Revenue FOR THAT STUDENT

Payment 2 (50% of Program Holder Share PER STUDENT):
• Paid upon successful completion FOR EACH STUDENT
• When that specific student completes training and earns credential
• After completion verified and credential issued
• Approximately 16.67% of Net Program Revenue FOR THAT STUDENT

Total Program Holder Share PER STUDENT: 33.33% of Net Program Revenue (1/3)
Elevate Retains PER STUDENT: 66.67% of Net Program Revenue (2/3)

EXAMPLE: If you have 10 students enrolled:
• You receive payments for each of the 10 students individually
• Each student's funding generates separate Payment 1 and Payment 2
• More students = more total revenue for Program Holder

Elevate retains the remaining Net Program Revenue to cover administrative, platform, staffing, compliance, coordination costs, and to support wraparound services for participants including:
• Case management and support services
• Career counseling and job placement
• Transportation and childcare assistance
• Emergency financial assistance
• Mental health and substance abuse support
• Technology and equipment loans
• Tutoring and academic support

4.3 Timing of Payments

a. Payments to Program Holder will generally be issued on a monthly cycle, once funds have been received and reconciled by Elevate.

b. Mid-enrollment payments (Payment 1) will be processed within 30 days of participant reaching 50% completion milestone.

c. Completion payments (Payment 2) will be processed within 30 days of credential issuance and final verification.

d. A summary statement will be provided showing:
   • Number of participants
   • Funding source(s)
   • Gross revenue, direct program expenses, and Net Program Revenue
   • Amount payable to Program Holder (1/3 share split into two payments)
   • Payment 1 status (mid-enrollment)
   • Payment 2 status (completion)

4.4 Non-Funded / Free Participants

Some participants may be served under free, pilot, scholarship, or fully internally funded initiatives. Elevate may elect to include or exclude those participants from the revenue share. Any such exceptions will be clarified in writing (email or addendum) for transparency.

5. DATA, REPORTING, AND CASE NOTES

a. Elevate will provide Program Holder with secure access to the delegate portal to enter case notes, statuses (On Track, At Risk, Not Engaged), and follow-up dates for participants they host.

b. Program Holder agrees to record reasonable case notes and updates to support compliance with workforce program documentation and audits.

c. Elevate will maintain training records, certificates, and participation reports and may share aggregated or participant-level reports with agencies, funders, and employers as required by program rules and privacy laws.

6. TERM AND TERMINATION

a. MONTH-TO-MONTH AGREEMENT: This MOU becomes effective on the date of the last signature below and operates on a month-to-month basis. There is no long-term commitment required from either party.

IMPORTANT: By signing this MOU, the Program Holder is APPROVED to enroll students and begin training operations immediately. The signature of this agreement confirms that:
• All required documents have been submitted and approved
• Background checks have been completed
• Facility inspections have passed
• Instructor credentials have been verified
• Insurance coverage is in place
• The Program Holder is authorized to operate under this partnership

b. TERMINATION WITH NOTICE: Either party may terminate this MOU at any time with 30 days' written notice. Notice may be provided via email to the contact addresses listed in this agreement.

c. IMMEDIATE TERMINATION: Elevate may suspend or terminate this agreement immediately, without the 30-day notice period, in cases of:
   • Serious non-compliance with WIOA, FERPA, or other regulatory requirements
   • Safety concerns or violations
   • Fraud, misrepresentation, or falsification of records
   • Material breach of confidentiality or non-compete provisions
   • Misuse of funds or participant information

d. PAYMENT UPON TERMINATION: Upon termination, Elevate will pay any amounts already earned and due to Program Holder for participants who were properly enrolled and funded prior to the termination date, following the normal reconciliation process. This includes:
   • Payment 1 (mid-enrollment) for participants who reached 50% completion before termination
   • Payment 2 (completion) for participants who completed training before termination
   • No payment will be made for participants who did not reach payment milestones

e. TRANSITION PERIOD: Upon termination, Program Holder agrees to cooperate with Elevate to ensure smooth transition of any active participants to alternative training arrangements, if applicable.

7. COLLABORATIVE PARTNERSHIP - INDEPENDENT CONTRACTOR RELATIONSHIP

The Parties agree that this is a COLLABORATIVE PARTNERSHIP where both parties work together as equals toward shared goals. Program Holder is an independent contractor and business partner, NOT an employee or subordinate of Elevate.

KEY POINTS:
• This MOU does not create an employment relationship
• This is NOT a franchise or licensing arrangement
• This is NOT a subordinate or hierarchical relationship
• This IS a partnership of equals with complementary roles
• Program Holder maintains full independence in business operations
• Program Holder is responsible for its own employees, taxes, insurance, and business operations
• Both parties collaborate and support each other's success

COLLABORATIVE NATURE:
• Elevate and Program Holder work together as partners
• Decisions are made collaboratively when possible
• Both parties respect each other's expertise and autonomy
• Communication is open, transparent, and respectful
• Success is shared, challenges are addressed together

8. NON-EXCLUSIVITY

This MOU is non-exclusive. Elevate may partner with other Program Holders, and Program Holder may work with other training sponsors, as long as such relationships do not violate program rules or confidentiality obligations.

9. CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT (NDA)

9.1 Confidential Information

Both Parties acknowledge that during the course of this partnership, they may have access to confidential and proprietary information including, but not limited to:

a. Participant personal information (names, contact details, social security numbers, employment history, criminal background, health information, and other personally identifiable information)
b. Training curricula, materials, assessments, and proprietary content
c. Business strategies, financial information, pricing structures, and revenue data
d. Funding source relationships, grant applications, and program compliance documentation
e. Technology systems, software, databases, and intellectual property
f. Trade secrets, business methods, and operational procedures

9.2 Obligations

Both Parties agree to:

a. Maintain strict confidentiality of all Confidential Information
b. Use Confidential Information solely for the purposes outlined in this MOU
c. Not disclose Confidential Information to any third party without prior written consent
d. Implement reasonable security measures to protect Confidential Information
e. Limit access to Confidential Information to employees and contractors who have a legitimate need to know
f. Return or destroy all Confidential Information upon termination of this MOU

9.3 Exceptions

Confidential Information does not include information that:
a. Is or becomes publicly available through no breach of this agreement
b. Was rightfully in the receiving party's possession prior to disclosure
c. Is independently developed without use of Confidential Information
d. Must be disclosed pursuant to law, court order, or government regulation (with prior notice to the disclosing party when legally permissible)

9.4 Data Protection and FERPA/HIPAA Compliance

Program Holder acknowledges that participant information may be protected under federal laws including FERPA (Family Educational Rights and Privacy Act), HIPAA (Health Insurance Portability and Accountability Act), and other privacy regulations. Program Holder agrees to:

a. Comply with all applicable federal, state, and local privacy laws
b. Implement appropriate administrative, physical, and technical safeguards
c. Report any data breach or unauthorized disclosure immediately to Elevate
d. Cooperate fully with any investigation or remediation efforts

9.5 Duration of Confidentiality

The confidentiality obligations under this section shall survive termination of this MOU and continue for a period of five (5) years from the date of disclosure, or indefinitely for trade secrets and participant personal information.

10. NON-COMPETE AND NON-SOLICITATION

10.1 Non-Compete Agreement

During the term of this MOU and for a period of two (2) years following termination, Program Holder agrees not to:

a. Directly compete with Elevate by establishing, operating, or partnering with another WIOA training provider, workforce development program, or apprenticeship sponsor that serves the same geographic area and target population as Elevate

b. Use Elevate's proprietary training materials, curricula, business methods, or operational procedures to establish a competing training program

c. Solicit or accept funding from Elevate's existing funding sources (including but not limited to WRG, WIOA, JRI, EmployIndy, DOL) for competing training programs without Elevate's prior written consent

10.2 Non-Solicitation of Participants

During the term of this MOU and for a period of two (2) years following termination, Program Holder agrees not to:

a. Directly solicit, recruit, or enroll any participant who was referred by Elevate or enrolled in an Elevate program into a competing training program

b. Encourage or induce any Elevate participant to leave their current training program to join a competing program

c. Use participant contact information obtained through this partnership for any purpose other than the training services outlined in this MOU

10.3 Non-Solicitation of Staff and Partners

During the term of this MOU and for a period of one (1) year following termination, Program Holder agrees not to:

a. Solicit, recruit, or hire any Elevate employee, contractor, or consultant who worked on programs covered by this MOU

b. Interfere with Elevate's relationships with other Program Holders, credentialing partners, or funding sources

c. Encourage or induce any Elevate partner or vendor to terminate their relationship with Elevate

10.4 Reasonable Scope

The Parties acknowledge that the restrictions in this section are reasonable in scope, duration, and geographic area, and are necessary to protect Elevate's legitimate business interests, including:

a. Protection of confidential and proprietary information
b. Preservation of funding source relationships
c. Maintenance of program integrity and participant continuity
d. Protection of investments in training infrastructure and partnerships

10.5 Exceptions

The non-compete provisions do not prohibit Program Holder from:

a. Operating their existing business in areas that do not directly compete with Elevate's workforce development programs
b. Accepting participants who independently seek out Program Holder's services without solicitation
c. Providing training services in geographic areas or industry sectors not served by Elevate
d. Partnering with Elevate on new programs or initiatives with mutual written agreement

10.6 Remedies

The Parties agree that violation of the non-compete or non-solicitation provisions would cause irreparable harm to Elevate. In the event of a breach, Elevate shall be entitled to:

a. Immediate injunctive relief without the necessity of posting bond
b. Recovery of all damages, including lost revenue and funding
c. Recovery of reasonable attorney's fees and costs
d. Any other remedies available at law or in equity

11. INTELLECTUAL PROPERTY

11.1 Elevate Property

Program Holder acknowledges that all training materials, curricula, assessments, software, branding, trademarks, and content provided by Elevate remain the exclusive property of Elevate. Program Holder receives a limited, non-exclusive, non-transferable license to use such materials solely for the purposes outlined in this MOU.

11.2 Program Holder Property

Any pre-existing intellectual property owned by Program Holder prior to this MOU remains the property of Program Holder. However, any modifications, adaptations, or derivative works created using Elevate's materials shall be jointly owned or licensed back to Elevate as mutually agreed in writing.

11.3 Participant Work Product

Any work product, projects, or materials created by participants during training shall be owned by the participants, with Elevate retaining the right to use such materials for promotional, educational, and reporting purposes with appropriate attribution.

12. ENTIRE UNDERSTANDING AND AMENDMENTS

This MOU represents the current understanding between the Parties regarding the subject matter described here. It may be updated or amended in writing (including email confirmation) agreed to by both Parties.

By signing below, the Parties acknowledge that they have read and understood this MOU and agree to its terms.

ELEVATE FOR HUMANITY CAREER & TECHNICAL INSTITUTE

By: _______________________________
Name: _____________________________
Title: ______________________________
Date: ______________________________

PROGRAM HOLDER / TRAINING PROVIDER

Organization: ${data.programHolderName}
By: _______________________________
Name: ${data.contactName || '_____________________________'}
Title: ______________________________
Date: ${data.date}

---

This MOU was generated on ${data.date} via the Elevate for Humanity Training Provider Portal.
For questions or to request modifications, contact: admin@www.elevateforhumanity.org
`;
}
