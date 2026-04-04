/**
 * Apprenticeship Handbook Content
 * 
 * This defines the handbook sections for each apprenticeship program.
 * Students must acknowledge each section before completing enrollment.
 */

export interface HandbookSection {
  id: string;
  title: string;
  content: string;
  requiresAcknowledgment: boolean;
  acknowledgmentText?: string;
}

export interface ProgramHandbook {
  programSlug: string;
  programName: string;
  version: string;
  effectiveDate: string;
  sections: HandbookSection[];
}

export const BARBER_HANDBOOK: ProgramHandbook = {
  programSlug: 'barber-apprenticeship',
  programName: 'Registered Barber Apprenticeship Program',
  version: '2025.1',
  effectiveDate: 'January 1, 2025',
  sections: [
    {
      id: 'welcome',
      title: 'Welcome & Program Overview',
      requiresAcknowledgment: false,
      content: `
# Welcome to the Registered Barber Apprenticeship Program

Congratulations on taking the first step toward your career as a licensed barber! This handbook contains important information about your apprenticeship program, your responsibilities, and what you can expect during your training.

## Program Sponsor
**2Exclusive LLC-S** (Sponsor of Record)
DBA Elevate for Humanity Career & Technical Institute

## Program Registration
- **DOL RAPIDS Program Number:** ${process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || '2025-IN-132301'}
- **RTI Provider ID:** ${process.env.NEXT_PUBLIC_RTI_PROVIDER_ID || '208029'}
- **ETPL Approved:** Yes

## Program Duration
- **Total Hours Required:** 1,500 hours (Indiana IPLA requirement)
- **Estimated Duration:** 12-18 months (depending on hours worked per week)
- **RTI Hours:** Approximately 150 hours (10%)
- **OJT Hours:** Approximately 1,350 hours (90%)

## What This Program Provides
- DOL Registered Apprenticeship sponsorship and oversight
- Related Technical Instruction (RTI) via Elevate LMS
- Compliance reporting and RAPIDS registration
- Employer coordination and OJT verification
- Hour logging and progress tracking
- State board exam fee (included in tuition)
- Career support and job placement assistance

## What This Program Does NOT Provide
- This program is NOT a barber school
- This program does NOT issue state licensure hours directly
- Practical skills training is provided by your sponsoring barbershop
- You must work under a licensed barber at an approved shop
      `
    },
    {
      id: 'apprentice-responsibilities',
      title: 'Apprentice Responsibilities',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I have read and understand my responsibilities as an apprentice.',
      content: `
# Apprentice Responsibilities

As a registered apprentice, you have specific responsibilities that you must fulfill to successfully complete the program and obtain your barber license.

## Attendance & Punctuality
- Report to your assigned barbershop on time for all scheduled shifts
- Notify your supervisor AND Elevate if you will be absent or late
- Maintain a minimum of 20 hours per week of OJT (recommended)
- Complete RTI coursework on schedule

## Professional Conduct
- Dress professionally and maintain good personal hygiene
- Treat all clients, coworkers, and supervisors with respect
- Follow all shop rules and policies
- Maintain client confidentiality
- No use of alcohol or drugs during work hours
- No cell phone use during client services

## Training Requirements
- Complete all assigned Elevate LMS theory modules
- Practice skills as directed by your supervisor
- Ask questions when you don't understand something
- Accept constructive feedback professionally
- Log all training hours accurately and honestly

## Documentation
- Submit hour logs weekly (by Sunday at 11:59 PM)
- Keep copies of all training records
- Report any changes in contact information immediately
- Maintain required documents in your student file

## Safety & Sanitation
- Follow all Indiana State Board sanitation requirements
- Properly disinfect tools between each client
- Report any injuries or accidents immediately
- Complete bloodborne pathogen training
- Wear appropriate PPE when required

## Financial Obligations
- Make all tuition payments on time
- Notify Elevate immediately if you have payment difficulties
- Understand that non-payment may result in program suspension
      `
    },
    {
      id: 'sponsor-responsibilities',
      title: 'Sponsor/Employer Responsibilities',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I understand what my sponsoring barbershop is responsible for providing.',
      content: `
# Sponsor/Employer Responsibilities

Your sponsoring barbershop has agreed to provide the following as part of your apprenticeship:

## Training Environment
- Safe, clean, and professional work environment
- Access to all necessary tools and equipment for training
- Adequate client flow for skill development
- Compliance with all state and local regulations

## Supervision
- Assign a licensed barber as your direct supervisor/mentor
- Provide hands-on instruction in all required competencies
- Allow time for RTI coursework completion
- Conduct regular progress evaluations

## Compensation
- Pay at least minimum wage for all hours worked
- Provide clear pay schedule and expectations
- May offer commission or tips as skills develop
- Cannot charge apprentice for training or chair rental

## Documentation
- Verify and sign off on OJT hours
- Complete competency assessments
- Provide feedback to Elevate on apprentice progress
- Maintain required employment records

## What Sponsors Cannot Do
- Require apprentice to pay for training
- Use apprentice as unpaid labor
- Assign tasks outside the scope of barber training
- Discriminate based on protected characteristics
- Retaliate against apprentice for reporting concerns
      `
    },
    {
      id: 'hour-requirements',
      title: 'Hour Requirements & Logging',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I understand the hour requirements and agree to log hours accurately.',
      content: `
# Hour Requirements & Logging

## Indiana IPLA Requirements
To be eligible for the Indiana barber license examination, you must complete:
- **Total Hours:** 1,500 hours minimum
- **RTI (Theory):** Approximately 150 hours via Elevate LMS
- **OJT (Hands-on):** Approximately 1,350 hours at your shop

## Hour Types

### Related Technical Instruction (RTI)
- Elevate LMS theory coursework (online)
- Safety and sanitation training
- Business and professional development
- State board exam preparation

### On-the-Job Training (OJT)
- Haircuts (fades, tapers, scissors work)
- Shaving and facial hair services
- Client consultation and communication
- Sanitation and shop maintenance
- Business operations exposure

## Logging Requirements
- Log hours weekly through the student portal
- Include date, start time, end time, and activity type
- RTI hours: Reference the Elevate LMS module completed
- OJT hours: Brief description of activities performed
- Hours must be verified by your supervisor

## Hour Verification
- Supervisors will approve/reject submitted hours
- Rejected hours must be corrected and resubmitted
- Falsifying hours is grounds for immediate dismissal
- Random audits may be conducted

## Transfer Hours
- Prior barber school hours may be eligible for transfer
- Submit official transcripts for evaluation
- Transfer hours reduce time-in-program, NOT tuition
- Maximum transfer: 750 hours (50%)
      `
    },
    {
      id: 'program-completion',
      title: 'Program Completion & State Licensure',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I understand the requirements for program completion and state licensure.',
      content: `
# Program Completion & State Licensure

## Completion Requirements
To successfully complete this apprenticeship program, you must:

1. **Complete 1,500 Hours**
   - All hours logged and approved
   - Proper mix of RTI and OJT

2. **Complete LMS Theory**
   - All required modules completed
   - Passing scores on assessments

3. **Demonstrate Practical Competencies**
   - All required skills verified by mentor
   - Competency checklist completed

4. **Maintain Good Standing**
   - Tuition paid in full
   - No unresolved conduct issues
   - All required documents on file

## State Board Examination
After completing the program, you will:

1. **Receive Completion Certificate**
   - Elevate will provide completion documentation
   - RAPIDS completion will be recorded

2. **Apply for Exam**
   - Register with PSI Services
   - Exam fee is included in your tuition
   - Schedule written and practical exams

3. **Pass Both Exams**
   - Written: 100 questions, 75% to pass
   - Practical: Live demonstration

4. **Apply for License**
   - Submit application to Indiana IPLA
   - Pay license fee (not included in tuition)
   - Receive your Indiana Barber License!

## After Licensure
- You are now a licensed Indiana barber
- Can work at any licensed barbershop
- Can rent a chair or open your own shop
- Must renew license per IPLA requirements
      `
    },
    {
      id: 'policies-procedures',
      title: 'Policies & Procedures',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I have read and agree to follow all program policies and procedures.',
      content: `
# Policies & Procedures

## Attendance Policy
- Notify supervisor AND Elevate of any absence
- Three unexcused absences may result in probation
- Extended absence (2+ weeks) requires written approval
- Abandonment (no contact for 30 days) = automatic withdrawal

## Grievance Procedure
If you have a concern or complaint:
1. First, discuss with your direct supervisor
2. If unresolved, contact Elevate program coordinator
3. If still unresolved, submit written grievance
4. Formal review within 10 business days
5. Appeal process available if needed

## Disciplinary Policy
Violations may result in:
- Verbal warning
- Written warning
- Probation
- Suspension
- Dismissal from program

Immediate dismissal for:
- Falsifying records or hours
- Theft or dishonesty
- Violence or threats
- Drug/alcohol use at work
- Serious safety violations

## Withdrawal & Refund Policy
- Voluntary withdrawal: Submit written notice
- Refunds per enrollment agreement terms
- Re-enrollment may be possible (case by case)
- Hours completed remain on record

## Non-Discrimination Policy
Elevate does not discriminate based on:
- Race, color, national origin
- Sex, gender identity, sexual orientation
- Religion, age, disability
- Veteran status
- Any other protected characteristic

## Accommodation Requests
- Disability accommodations available
- Submit requests in writing
- Interactive process to determine solutions
- Confidentiality maintained
      `
    },
    {
      id: 'safety-agreement',
      title: 'Safety Agreement',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I agree to follow all safety protocols and understand the risks involved in barber training.',
      content: `
# Safety Agreement

## Acknowledgment of Risks
Barbering involves certain inherent risks including but not limited to:
- Cuts from razors and shears
- Exposure to bloodborne pathogens
- Chemical exposure (products, disinfectants)
- Repetitive motion injuries
- Standing for extended periods

## Safety Commitments
I agree to:

### Personal Safety
- Wear closed-toe shoes at all times
- Use proper body mechanics
- Take breaks as needed
- Report any injuries immediately
- Seek medical attention when necessary

### Tool Safety
- Inspect tools before each use
- Never use damaged equipment
- Store sharp tools properly
- Follow manufacturer guidelines
- Keep work area organized

### Sanitation & Infection Control
- Wash hands before and after each client
- Disinfect tools between clients
- Use fresh towels and capes
- Properly dispose of single-use items
- Follow bloodborne pathogen protocols

### Chemical Safety
- Read all product labels
- Use products as directed
- Ensure proper ventilation
- Store chemicals properly
- Know location of SDS sheets

### Emergency Procedures
- Know location of first aid kit
- Know emergency exit routes
- Know how to contact emergency services
- Report all incidents to supervisor

## Bloodborne Pathogen Protocol
In case of blood exposure:
1. Stop service immediately
2. Apply pressure to wound
3. Clean and bandage properly
4. Disinfect contaminated surfaces
5. Document the incident
6. Seek medical evaluation if needed
      `
    },
    {
      id: 'financial-agreement',
      title: 'Financial Agreement',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I understand and agree to the financial terms of this program.',
      content: `
# Financial Agreement

## Program Tuition
**Total Program Fee: $4,980** (Flat Fee)

This fee is the same regardless of:
- Transfer hours credited
- Time to complete program
- Number of hours logged

## What's Included
- DOL Registered Apprenticeship sponsorship
- RAPIDS registration and compliance
- Elevate LMS theory curriculum access
- Hour logging and tracking system
- Program monitoring and support
- Indiana IPLA exam fee ($50)
- AI instructor support
- Career services assistance

## What's NOT Included
- Barber tools and supplies (your responsibility)
- Additional exam retake fees (if needed)
- Indiana license application fee
- Transportation to shop/exams
- Personal protective equipment

## Payment Options
1. **Pay in Full:** $4,980 (card or bank transfer)
2. **Affirm/Klarna/Afterpay:** Split into payments (terms set by lender at checkout)
3. **Setup Fee + Weekly:** $1,743 setup fee at enrollment, remaining $3,237 paid weekly

## Payment Terms
- Full payment or BNPL selection made at checkout
- Weekly payment option: Invoices sent every Friday via email
- Weekly amount calculated based on your hours per week schedule
- Payment links included in invoice emails

## Refund Policy
- Within 3 days of enrollment: Full refund
- Within 30 days: 75% refund
- Within 60 days: 50% refund
- After 60 days: No refund
- Refunds processed within 14 business days

## Financial Hardship
If you experience financial difficulty:
- Contact us BEFORE missing a payment
- Payment plan modifications may be available
- Temporary suspension option (up to 90 days)
- We want you to succeed!
      `
    },
    {
      id: 'mou-agreement',
      title: 'Memorandum of Understanding',
      requiresAcknowledgment: true,
      acknowledgmentText: 'I have read, understand, and agree to all terms in this Memorandum of Understanding.',
      content: `
# Memorandum of Understanding (MOU)

## Parties to This Agreement
- **Apprentice:** (Your name as signed below)
- **Sponsor of Record:** 2Exclusive LLC-S (DBA Elevate for Humanity Career & Technical Institute)
- **Employer/Shop:** (Your sponsoring barbershop)

## Purpose
This MOU establishes the terms and conditions of the registered apprenticeship between the parties listed above, in accordance with:
- U.S. Department of Labor regulations (29 CFR Part 29)
- Indiana Professional Licensing Agency requirements
- DOL RAPIDS Program #2025-IN-132301

## Term of Agreement
This agreement begins on the date of signature and continues until:
- Successful completion of the apprenticeship, OR
- Voluntary withdrawal by the apprentice, OR
- Termination for cause, OR
- Mutual agreement to terminate

## Apprentice Agrees To:
1. Complete all required training hours (1,500 minimum)
2. Attend work regularly and punctually
3. Perform all duties assigned by supervisor
4. Complete all RTI coursework
5. Follow all safety and sanitation protocols
6. Maintain professional conduct at all times
7. Log hours accurately and honestly
8. Make all tuition payments as agreed
9. Notify sponsor of any issues or concerns
10. Comply with all program policies

## Program Sponsor Agrees To:
1. Register apprentice with DOL RAPIDS
2. Provide access to RTI curriculum (Elevate LMS)
3. Monitor apprentice progress
4. Maintain required records
5. Coordinate with employer/shop
6. Provide support and guidance
7. Issue completion documentation
8. Pay state board exam fee

## Employer/Shop Agrees To:
1. Provide safe training environment
2. Assign qualified supervisor/mentor
3. Allow time for RTI completion
4. Verify OJT hours
5. Pay at least minimum wage
6. Not charge apprentice for training
7. Comply with all applicable laws

## Dispute Resolution
Any disputes will be resolved through:
1. Direct discussion between parties
2. Mediation if needed
3. Binding arbitration as last resort

## Signatures Required
By signing below, all parties agree to the terms of this MOU.

---

**This is a legally binding agreement. Read carefully before signing.**
      `
    }
  ]
};

// Copy for other programs with minor modifications
export const COSMETOLOGY_HANDBOOK: ProgramHandbook = {
  ...BARBER_HANDBOOK,
  programSlug: 'cosmetology-apprenticeship',
  programName: 'Registered Cosmetology Apprenticeship Program',
  sections: BARBER_HANDBOOK.sections.map(section => ({
    ...section,
    content: section.content
      .replace(/barber/gi, 'cosmetology')
      .replace(/barbershop/gi, 'salon')
      .replace(/Barber/g, 'Cosmetology')
      .replace(/Barbershop/g, 'Salon')
  }))
};

export const ESTHETICIAN_HANDBOOK: ProgramHandbook = {
  ...BARBER_HANDBOOK,
  programSlug: 'esthetician-apprenticeship',
  programName: 'Registered Esthetician Apprenticeship Program',
  sections: BARBER_HANDBOOK.sections.map(section => ({
    ...section,
    content: section.content
      .replace(/barber/gi, 'esthetician')
      .replace(/barbershop/gi, 'spa/salon')
      .replace(/Barber/g, 'Esthetician')
      .replace(/Barbershop/g, 'Spa/Salon')
      .replace(/1,500 hours/g, '700 hours')
      .replace(/1500/g, '700')
  }))
};

export const NAIL_TECH_HANDBOOK: ProgramHandbook = {
  ...BARBER_HANDBOOK,
  programSlug: 'nail-technician-apprenticeship',
  programName: 'Registered Nail Technician Apprenticeship Program',
  sections: BARBER_HANDBOOK.sections.map(section => ({
    ...section,
    content: section.content
      .replace(/barber/gi, 'nail technician')
      .replace(/barbershop/gi, 'nail salon')
      .replace(/Barber/g, 'Nail Technician')
      .replace(/Barbershop/g, 'Nail Salon')
      .replace(/1,500 hours/g, '450 hours')
      .replace(/1500/g, '450')
  }))
};

export function getHandbook(programSlug: string): ProgramHandbook | null {
  switch (programSlug) {
    case 'barber-apprenticeship':
      return BARBER_HANDBOOK;
    case 'cosmetology-apprenticeship':
      return COSMETOLOGY_HANDBOOK;
    case 'esthetician-apprenticeship':
      return ESTHETICIAN_HANDBOOK;
    case 'nail-technician-apprenticeship':
      return NAIL_TECH_HANDBOOK;
    default:
      return null;
  }
}
