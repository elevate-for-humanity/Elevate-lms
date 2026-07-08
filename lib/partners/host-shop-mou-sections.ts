import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type HostShopMouProgram = 'barber' | 'cosmetology' | 'esthetician' | 'nail';

export type MouSection = {
  title: string;
  content: string;
};

export type HostShopMouMeta = {
  documentType: string;
  title: string;
  subtitle: string;
  worksiteLabel: string;
  handbookHref: string;
  fullDocHref?: string;
  rapidsId: string;
};

const BARBER_SECTIONS: MouSection[] = [
  {
    title: '1. Parties and Purpose',
    content: `This Memorandum of Understanding ("MOU") is entered into between 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute ("Sponsor") and the barbershop identified at execution ("Worksite Partner" or "Shop").

This MOU establishes the terms under which the Shop will serve as a worksite for the Indiana Barber Host Shop Program, RAPIDS Program ID: 2025-IN-132301, a USDOL Registered Apprenticeship sponsored by ${PLATFORM_DEFAULTS.orgName}.

WHAT THIS AGREEMENT IS: This is a worksite hosting agreement for a federally registered apprenticeship program. The Shop is hosting an apprentice employee and providing on-the-job training under federal Department of Labor oversight.

WHAT THIS AGREEMENT IS NOT: This MOU does not make the Shop a Training Network Partner, a co-owner of Elevate programs, a revenue-sharing partner, or a program delivery site for any Elevate training program other than the barber host shop. The Shop has no ownership rights, governance authority, or decision-making authority over Elevate's programs, curriculum, credentials, or brand.`,
  },
  {
    title: '2. Program Structure — Non-Negotiable Federal Requirements',
    content: `The Indiana Barber Host Shop Program is a USDOL Registered Apprenticeship. Its structure is set by federal law and the registered program standards. These terms are not negotiable.

Program requirements:
• 2,000 hours of on-the-job training (OJT) at the worksite, supervised by a licensed barber
• Related Technical Instruction (RTI) coordinated by the Sponsor (Elevate)
• Progressive skill development tracked through competency assessments per the registered standards
• Apprentice must be registered with USDOL/RAPIDS before OJT hours begin
• All OJT hours must be documented and submitted to the Sponsor monthly

The Sponsor maintains sole authority over: RTI curriculum and delivery; competency assessment standards; RAPIDS registration and reporting; completion certificate issuance; program standards and modifications.`,
  },
  {
    title: '3. Sponsor Responsibilities',
    content: `${PLATFORM_DEFAULTS.orgName} agrees to:

• Maintain USDOL/RAPIDS registration and all required federal reporting
• Develop, deliver, and update all Related Technical Instruction (RTI)
• Maintain official apprentice records and program documentation
• Issue completion certificates upon successful program completion
• Screen and refer qualified apprentice candidates to the Shop
• Provide the Shop with competency checklists and OJT tracking tools
• Conduct periodic worksite visits to verify program compliance
• Serve as the point of contact with Indiana DWD and USDOL for all program matters`,
  },
  {
    title: '4. Worksite Partner Responsibilities — Non-Negotiable',
    content: `These responsibilities are required by federal apprenticeship law and USDOL program standards. They are not optional and are not subject to modification.

The Shop agrees to:

SUPERVISION: Provide direct, on-site supervision of the apprentice by a currently licensed Indiana barber at all times during OJT hours. The supervising barber must hold an active Indiana barber license. No exceptions.

EMPLOYMENT: The apprentice is a paid employee of the Shop — not a volunteer, intern, or independent contractor. The Shop is the employer of record for the apprentice during OJT. The Shop is responsible for payroll, withholding, workers' compensation, and all employer obligations under Indiana and federal law.

WAGES: Pay the apprentice according to the agreed progressive wage schedule (see Section 5). Failure to pay the apprentice as agreed is grounds for immediate termination of this MOU and will be reported to USDOL.

HOURS TRACKING: Accurately track and submit OJT hours to the Sponsor monthly using the provided tracking forms. Falsifying OJT hours is a federal offense.

SAFETY: Maintain a safe workplace that complies with all OSHA standards and Indiana workplace safety requirements. Report any workplace injury involving the apprentice to the Sponsor within 24 hours.

INSURANCE: Carry workers' compensation insurance covering the apprentice. Provide proof of coverage to the Sponsor before the apprentice begins OJT.

LICENSES: Maintain all required business licenses, health permits, and barbershop operating licenses throughout the term of this MOU. Notify the Sponsor immediately if any license lapses.

NONDISCRIMINATION: Comply with all federal nondiscrimination requirements under WIOA Section 188, Title VI of the Civil Rights Act, the ADA, and all applicable equal opportunity laws. The apprenticeship program is open to all qualified individuals regardless of race, color, religion, sex, national origin, age, or disability.`,
  },
  {
    title: '5. Apprentice Compensation — Federal Minimum Standards',
    content: `Apprentice compensation is governed by federal apprenticeship standards and Indiana minimum wage law. These minimums are not negotiable.

The apprentice is a paid employee. Compensation on a sole commission basis is prohibited under federal apprenticeship rules.

Approved compensation models:
• HOURLY: $10.00–$15.00/hr recommended. Must meet Indiana minimum wage ($7.25/hr) at all times.
• HYBRID: $8.00–$10.00/hr base wage PLUS 15%–25% commission on services performed. Base wage must meet Indiana minimum wage at all times.

Progressive wage increases are required as the apprentice advances through the program. The wage schedule is set in the registered program standards and must be followed.

Apprentices retain 100% of tips. Tips may not be counted toward the minimum wage requirement.

The Shop is responsible for all payroll taxes, withholding, and employer contributions for the apprentice.`,
  },
  {
    title: '6. Term and Termination — 30-Day Notice Right',
    content: `This MOU is effective from the date signed and continues until the apprentice completes the program, withdraws, or the agreement is terminated.

YOUR RIGHT TO EXIT: Either party — the Shop or the Sponsor — may terminate this MOU at any time for any reason by providing 30 days written notice. Send written notice (email is acceptable) to your assigned Elevate coordinator and copy elevate4humanityedu@gmail.com. You do not need to provide a reason. You do not need the other party's permission. This right is non-negotiable and cannot be waived.

During the 30-day notice period: the apprentice continues their OJT and the Shop continues its obligations under this MOU. The Sponsor will work with the Shop and the apprentice on a transition plan.

IMMEDIATE TERMINATION BY SPONSOR (no notice required): The Sponsor may terminate this MOU immediately — without the 30-day notice period — if the Shop:
• Fails to pay the apprentice as agreed
• Violates any workplace safety or OSHA requirement
• Loses any required business license or insurance
• Falsifies OJT hours or program records
• Engages in misconduct affecting the apprentice's safety or welfare
• Violates federal nondiscrimination requirements

After termination: the Shop must submit all outstanding OJT hour records to the Sponsor within 10 business days. The apprentice's program records remain with the Sponsor.`,
  },
  {
    title: '7. Confidentiality and Non-Disclosure',
    content: `Both parties agree to maintain confidentiality of apprentice personally identifiable information (PII) in compliance with applicable privacy laws.

The Shop may not disclose apprentice PII (name, contact information, wage information, program records) to any third party without written apprentice consent and Sponsor authorization, except as required for program administration or by law.

The Shop also receives access to Elevate's operational procedures, program materials, and business information through this collaboration. This information is confidential. The Shop may not disclose or use Elevate's confidential information for any purpose other than fulfilling its obligations under this MOU.

A full Non-Disclosure Agreement is available at ${PLATFORM_DEFAULTS.canonicalDomain}/legal/nda and is incorporated by reference into this MOU.`,
  },
  {
    title: '8. Non-Compete and Non-Replication',
    content: `The Shop receives access to Elevate's registered apprenticeship program structure, curriculum relationships, RAPIDS registration, and credential pathways through this collaboration. This access is provided to support the apprentice — not to enable the Shop to replicate the program independently.

During the term of this MOU and for three (3) years following termination, the Shop agrees not to:
• Use Elevate's program structure, RAPIDS registration, or DWD relationships to independently register or operate a competing USDOL Registered Apprenticeship program in barbering
• Solicit or redirect Elevate apprentice candidates, instructors, or credential partners into a competing program derived from the Elevate apprenticeship model
• Represent to any funding agency, employer, or student that the Shop independently operates the Indiana Barber Host Shop Program

These restrictions do not prevent the Shop from: operating as a barbershop, employing licensed barbers, hiring apprentices through other registered programs, or participating in training programs that are not substantially similar to the Elevate apprenticeship model.

A full Non-Compete Agreement is available at ${PLATFORM_DEFAULTS.canonicalDomain}/legal/non-compete and is incorporated by reference into this MOU.`,
  },
  {
    title: '9. Partner Handbook — Required Reading',
    content: `The Worksite Partner Handbook is incorporated by reference into this MOU and forms part of this agreement. The Handbook details the day-to-day responsibilities, compensation requirements, hour tracking procedures, prohibited practices, and communication expectations that govern the worksite relationship.

By signing this MOU, the Shop confirms that it has read and understood the Partner Handbook in full prior to signing. The Handbook is available at: ${PLATFORM_DEFAULTS.canonicalDomain}/partners/barber-host-shop/handbook

Failure to comply with the standards set out in the Handbook constitutes a breach of this MOU and may result in immediate termination of the partnership and notification to USDOL.`,
  },
  {
    title: '10. Dispute Resolution',
    content: `The parties agree to attempt to resolve any disputes through good-faith negotiation first. If a dispute cannot be resolved through negotiation within 15 business days, either party may submit the dispute to mediation.

If mediation is unsuccessful, the parties consent to jurisdiction in Marion County, Indiana. This MOU is governed by the laws of the State of Indiana.

USDOL/RAPIDS compliance disputes are subject to federal apprenticeship regulations and may be reported to the Indiana Department of Workforce Development or the U.S. Department of Labor, Office of Apprenticeship.`,
  },
];

const COSMETOLOGY_SECTIONS: MouSection[] = [
  {
    title: '1. Parties and Purpose',
    content: `This Memorandum of Understanding ("MOU") is entered into between 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute ("Sponsor") and the salon identified at execution ("Worksite Partner" or "Salon").

This MOU establishes the terms under which the Salon will serve as a worksite for the Indiana Cosmetology Apprenticeship Program, RAPIDS Program ID: 2025-IN-132302, a USDOL Registered Apprenticeship sponsored by ${PLATFORM_DEFAULTS.orgName}.

WHAT THIS AGREEMENT IS: This is a worksite hosting agreement for a federally registered apprenticeship program. The Salon is hosting an apprentice employee and providing on-the-job training under federal Department of Labor oversight.

WHAT THIS AGREEMENT IS NOT: This MOU does not make the Salon a Training Network Partner, a co-owner of Elevate programs, a revenue-sharing partner, or a program delivery site for any Elevate training program other than the cosmetology apprenticeship. The Salon has no ownership rights, governance authority, or decision-making authority over Elevate's programs, curriculum, credentials, or brand.`,
  },
  {
    title: '2. Program Structure — Non-Negotiable Federal Requirements',
    content: `The Indiana Cosmetology Apprenticeship Program is a USDOL Registered Apprenticeship. Its structure is set by federal law and the registered program standards. These terms are not negotiable.

Program requirements:
• 2,000 hours of on-the-job training (OJT) at the worksite, supervised by a licensed cosmetologist
• Related Technical Instruction (RTI) coordinated by the Sponsor (Elevate)
• Progressive skill development tracked through competency assessments per the registered standards
• Apprentice must be registered with USDOL/RAPIDS before OJT hours begin
• All OJT hours must be documented and submitted to the Sponsor monthly

The Sponsor maintains sole authority over: RTI curriculum and delivery; competency assessment standards; RAPIDS registration and reporting; completion certificate issuance; program standards and modifications.`,
  },
  {
    title: '3. Sponsor Responsibilities',
    content: `${PLATFORM_DEFAULTS.orgName} agrees to:

• Maintain USDOL/RAPIDS registration and all required federal reporting
• Develop, deliver, and update all Related Technical Instruction (RTI)
• Maintain official apprentice records and program documentation
• Issue completion certificates upon successful program completion
• Screen and refer qualified apprentice candidates to the Salon
• Provide the Salon with competency checklists and OJT tracking tools
• Conduct periodic worksite visits to verify program compliance
• Serve as the point of contact with Indiana DWD and USDOL for all program matters`,
  },
  {
    title: '4. Worksite Partner Responsibilities — Non-Negotiable',
    content: `These responsibilities are required by federal apprenticeship law and USDOL program standards. They are not optional and are not subject to modification.

The Salon agrees to:

SUPERVISION: Provide direct, on-site supervision of the apprentice by a currently licensed Indiana cosmetologist at all times during OJT hours. The supervising cosmetologist must hold an active Indiana IPLA cosmetology license with at least 2 years of experience. No exceptions.

EMPLOYMENT: The apprentice is a paid employee of the Salon — not a volunteer, intern, or independent contractor. The Salon is the employer of record for the apprentice during OJT. The Salon is responsible for payroll, withholding, workers' compensation, and all employer obligations under Indiana and federal law.

WAGES: Pay the apprentice according to the agreed progressive wage schedule (see Section 5). Failure to pay the apprentice as agreed is grounds for immediate termination of this MOU and will be reported to USDOL.

HOURS TRACKING: Accurately track and submit OJT hours to the Sponsor monthly using the provided tracking forms. Falsifying OJT hours is a federal offense.

SAFETY: Maintain a safe workplace that complies with all OSHA standards and Indiana workplace safety requirements. Report any workplace injury involving the apprentice to the Sponsor within 24 hours.

INSURANCE: Carry workers' compensation insurance covering the apprentice. Provide proof of coverage to the Sponsor before the apprentice begins OJT.

LICENSES: Maintain all required business licenses, health permits, and salon operating licenses throughout the term of this MOU. Notify the Sponsor immediately if any license lapses.

NONDISCRIMINATION: Comply with all federal nondiscrimination requirements under WIOA Section 188, Title VI of the Civil Rights Act, the ADA, and all applicable equal opportunity laws. The apprenticeship program is open to all qualified individuals regardless of race, color, religion, sex, national origin, age, or disability.`,
  },
  {
    title: '5. Apprentice Compensation — Federal Minimum Standards',
    content: `Apprentice compensation is governed by federal apprenticeship standards and Indiana minimum wage law. These minimums are not negotiable.

The apprentice is a paid employee. Compensation on a sole commission basis is prohibited under federal apprenticeship rules.

Approved compensation models:
• HOURLY: $10.00–$15.00/hr recommended. Must meet Indiana minimum wage ($7.25/hr) at all times.
• HYBRID: $8.00–$10.00/hr base wage PLUS 15%–25% commission on services performed. Base wage must meet Indiana minimum wage at all times.

Progressive wage increases are required as the apprentice advances through the program. The wage schedule is set in the registered program standards and must be followed.

Apprentices retain 100% of tips. Tips may not be counted toward the minimum wage requirement.

The Salon is responsible for all payroll taxes, withholding, and employer contributions for the apprentice.`,
  },
  {
    title: '6. Term and Termination — 30-Day Notice Right',
    content: `This MOU is effective from the date signed and continues until the apprentice completes the program, withdraws, or the agreement is terminated.

YOUR RIGHT TO EXIT: Either party — the Salon or the Sponsor — may terminate this MOU at any time for any reason by providing 30 days written notice. Send written notice (email is acceptable) to your assigned Elevate coordinator and copy elevate4humanityedu@gmail.com. You do not need to provide a reason. You do not need the other party's permission. This right is non-negotiable and cannot be waived.

During the 30-day notice period: the apprentice continues their OJT and the Salon continues its obligations under this MOU. The Sponsor will work with the Salon and the apprentice on a transition plan.

IMMEDIATE TERMINATION BY SPONSOR (no notice required): The Sponsor may terminate this MOU immediately — without the 30-day notice period — if the Salon:
• Fails to pay the apprentice as agreed
• Violates any workplace safety or OSHA requirement
• Loses any required business license or insurance
• Falsifies OJT hours or program records
• Engages in misconduct affecting the apprentice's safety or welfare
• Violates federal nondiscrimination requirements

After termination: the Salon must submit all outstanding OJT hour records to the Sponsor within 10 business days. The apprentice's program records remain with the Sponsor.`,
  },
  {
    title: '7. Confidentiality and Non-Disclosure',
    content: `Both parties agree to maintain confidentiality of apprentice personally identifiable information (PII) in compliance with applicable privacy laws.

The Salon may not disclose apprentice PII (name, contact information, wage information, program records) to any third party without written apprentice consent and Sponsor authorization, except as required for program administration or by law.

The Salon also receives access to Elevate's operational procedures, program materials, and business information through this collaboration. This information is confidential. The Salon may not disclose or use Elevate's confidential information for any purpose other than fulfilling its obligations under this MOU.

A full Non-Disclosure Agreement is available at ${PLATFORM_DEFAULTS.canonicalDomain}/legal/nda and is incorporated by reference into this MOU.`,
  },
  {
    title: '8. Non-Compete and Non-Replication',
    content: `The Salon receives access to Elevate's registered apprenticeship program structure, curriculum relationships, RAPIDS registration, and credential pathways through this collaboration. This access is provided to support the apprentice — not to enable the Salon to replicate the program independently.

During the term of this MOU and for three (3) years following termination, the Salon agrees not to:
• Use Elevate's program structure, RAPIDS registration, or DWD relationships to independently register or operate a competing USDOL Registered Apprenticeship program in cosmetology
• Solicit or redirect Elevate apprentice candidates, instructors, or credential partners into a competing program derived from the Elevate apprenticeship model
• Represent to any funding agency, employer, or student that the Salon independently operates the Indiana Cosmetology Apprenticeship Program

These restrictions do not prevent the Salon from: operating as a salon, employing licensed cosmetologists, hiring apprentices through other registered programs, or participating in training programs that are not substantially similar to the Elevate apprenticeship model.`,
  },
  {
    title: '9. Partner Handbook — Required Reading',
    content: `The Worksite Partner Handbook is incorporated by reference into this MOU and forms part of this agreement. The Handbook details the day-to-day responsibilities, compensation requirements, hour tracking procedures, prohibited practices, and communication expectations that govern the worksite relationship.

By signing this MOU, the Salon confirms that it has read and understood the Partner Handbook in full prior to signing. The Handbook is available at: ${PLATFORM_DEFAULTS.canonicalDomain}/partners/cosmetology-host-shop/handbook

Failure to comply with the standards set out in the Handbook constitutes a breach of this MOU and may result in immediate termination of the partnership and notification to USDOL.`,
  },
  {
    title: '10. Dispute Resolution',
    content: `The parties agree to attempt to resolve any disputes through good-faith negotiation first. If a dispute cannot be resolved through negotiation within 15 business days, either party may submit the dispute to mediation.

If mediation is unsuccessful, the parties consent to jurisdiction in Marion County, Indiana. This MOU is governed by the laws of the State of Indiana.

USDOL/RAPIDS compliance disputes are subject to federal apprenticeship regulations and may be reported to the Indiana Department of Workforce Development or the U.S. Department of Labor, Office of Apprenticeship.`,
  },
];

const ESTHETICIAN_SECTIONS: MouSection[] = [
  {
    title: '1. Parties and Purpose',
    content: `This Memorandum of Understanding ("MOU") is entered into between 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute ("Sponsor") and the esthetics spa or salon identified at execution ("Worksite Partner" or "Spa/Salon").

This MOU establishes the terms under which the Spa/Salon will serve as a worksite for the Indiana Esthetics Apprenticeship Program, RAPIDS Program ID: 2025-IN-132303, a USDOL Registered Apprenticeship sponsored by ${PLATFORM_DEFAULTS.orgName}.

WHAT THIS AGREEMENT IS: This is a worksite hosting agreement for a federally registered apprenticeship program. The Spa/Salon is hosting an apprentice employee and providing on-the-job training under federal Department of Labor oversight.

WHAT THIS AGREEMENT IS NOT: This MOU does not make the Spa/Salon a Training Network Partner, a co-owner of Elevate programs, a revenue-sharing partner, or a program delivery site for any Elevate training program other than the esthetics apprenticeship. The Spa/Salon has no ownership rights, governance authority, or decision-making authority over Elevate's programs, curriculum, credentials, or brand.`,
  },
  {
    title: '2. Program Structure — Non-Negotiable Federal Requirements',
    content: `The Indiana Esthetics Apprenticeship Program is a USDOL Registered Apprenticeship. Its structure is set by federal law and the registered program standards. These terms are not negotiable.

Program requirements:
• 1,200 hours of on-the-job training (OJT) at the worksite, supervised by a licensed esthetician
• Related Technical Instruction (RTI) coordinated by the Sponsor (Elevate)
• Progressive skill development tracked through competency assessments per the registered standards
• Apprentice must be registered with USDOL/RAPIDS before OJT hours begin
• All OJT hours must be documented and submitted to the Sponsor monthly

The Sponsor maintains sole authority over: RTI curriculum and delivery; competency assessment standards; RAPIDS registration and reporting; completion certificate issuance; program standards and modifications.`,
  },
  {
    title: '3. Sponsor Responsibilities',
    content: `${PLATFORM_DEFAULTS.orgName} agrees to:

• Maintain USDOL/RAPIDS registration and all required federal reporting
• Develop, deliver, and update all Related Technical Instruction (RTI)
• Maintain official apprentice records and program documentation
• Issue completion certificates upon successful program completion
• Screen and refer qualified apprentice candidates to the Spa/Salon
• Provide the Spa/Salon with competency checklists and OJT tracking tools
• Conduct periodic worksite visits to verify program compliance
• Serve as the point of contact with Indiana DWD and USDOL for all program matters`,
  },
  {
    title: '4. Worksite Partner Responsibilities — Non-Negotiable',
    content: `These responsibilities are required by federal apprenticeship law and USDOL program standards. They are not optional and are not subject to modification.

The Spa/Salon agrees to:

SUPERVISION: Provide direct, on-site supervision of the apprentice by a currently licensed Indiana esthetician at all times during OJT hours. The supervising esthetician must hold an active Indiana IPLA esthetics license with at least 2 years of experience. No exceptions.

EMPLOYMENT: The apprentice is a paid employee of the Spa/Salon — not a volunteer, intern, or independent contractor. The Spa/Salon is the employer of record for the apprentice during OJT. The Spa/Salon is responsible for payroll, withholding, workers' compensation, and all employer obligations under Indiana and federal law.

WAGES: Pay the apprentice according to the agreed progressive wage schedule (see Section 5). Failure to pay the apprentice as agreed is grounds for immediate termination of this MOU and will be reported to USDOL.

HOURS TRACKING: Accurately track and submit OJT hours to the Sponsor monthly using the provided tracking forms. Falsifying OJT hours is a federal offense.

SAFETY: Maintain a safe, sanitary workplace that complies with all OSHA standards, Indiana health codes, and spa/salon safety requirements. Report any workplace injury involving the apprentice to the Sponsor within 24 hours.

INSURANCE: Carry workers' compensation insurance covering the apprentice. Provide proof of coverage to the Sponsor before the apprentice begins OJT.

LICENSES: Maintain all required business licenses, health permits, and esthetics operating licenses throughout the term of this MOU. Notify the Sponsor immediately if any license lapses.

NONDISCRIMINATION: Comply with all federal nondiscrimination requirements under WIOA Section 188, Title VI of the Civil Rights Act, the ADA, and all applicable equal opportunity laws.`,
  },
  {
    title: '5. Apprentice Compensation — Federal Minimum Standards',
    content: `Apprentice compensation is governed by federal apprenticeship standards and Indiana minimum wage law. These minimums are not negotiable.

The apprentice is a paid employee. Compensation on a sole commission basis is prohibited under federal apprenticeship rules.

Approved compensation models:
• HOURLY: $10.00–$15.00/hr recommended. Must meet Indiana minimum wage ($7.25/hr) at all times.
• HYBRID: $8.00–$10.00/hr base wage PLUS 15%–25% commission on services performed. Base wage must meet Indiana minimum wage at all times.

Apprentices retain 100% of tips. Tips may not be counted toward the minimum wage requirement.

The Spa/Salon is responsible for all payroll taxes, withholding, and employer contributions for the apprentice.`,
  },
  {
    title: '6. Term and Termination — 30-Day Notice Right',
    content: `This MOU is effective from the date signed and continues until the apprentice completes the program, withdraws, or the agreement is terminated.

YOUR RIGHT TO EXIT: Either party — the Spa/Salon or the Sponsor — may terminate this MOU at any time for any reason by providing 30 days written notice. Send written notice (email is acceptable) to your assigned Elevate coordinator and copy elevate4humanityedu@gmail.com. You do not need to provide a reason. You do not need the other party's permission.

IMMEDIATE TERMINATION BY SPONSOR (no notice required): The Sponsor may terminate immediately if the Spa/Salon fails to pay the apprentice, violates safety requirements, loses licenses or insurance, falsifies records, or engages in misconduct.

After termination: Submit all outstanding OJT hour records within 10 business days.`,
  },
  {
    title: '7. Confidentiality and Non-Disclosure',
    content: `Both parties agree to maintain confidentiality of apprentice personally identifiable information (PII) in compliance with applicable privacy laws.

The Spa/Salon may not disclose apprentice PII to any third party without written apprentice consent and Sponsor authorization, except as required for program administration or by law.

The Spa/Salon also receives access to Elevate's operational procedures, program materials, and business information. This information is confidential and may not be used for any purpose other than fulfilling obligations under this MOU.`,
  },
  {
    title: '8. Non-Compete and Non-Replication',
    content: `The Spa/Salon receives access to Elevate's registered apprenticeship program structure, curriculum relationships, RAPIDS registration, and credential pathways through this collaboration. This access is provided to support the apprentice — not to enable the Spa/Salon to replicate the program independently.

During the term of this MOU and for three (3) years following termination, the Spa/Salon agrees not to:
• Use Elevate's program structure, RAPIDS registration, or DWD relationships to independently register or operate a competing USDOL Registered Apprenticeship program in esthetics
• Solicit or redirect Elevate apprentice candidates, instructors, or credential partners into a competing program

These restrictions do not prevent the Spa/Salon from: operating as a spa/salon, employing licensed estheticians, hiring apprentices through other registered programs, or participating in training programs that are not substantially similar to the Elevate apprenticeship model.`,
  },
  {
    title: '9. Partner Handbook — Required Reading',
    content: `The Worksite Partner Handbook is incorporated by reference into this MOU and forms part of this agreement. The Handbook details day-to-day responsibilities, compensation requirements, hour tracking procedures, and communication expectations.

By signing this MOU, the Spa/Salon confirms that it has read and understood the Partner Handbook in full prior to signing. The Handbook is available at: ${PLATFORM_DEFAULTS.canonicalDomain}/partners/esthetician-host-shop/handbook

Failure to comply with the standards set out in the Handbook constitutes a breach of this MOU.`,
  },
  {
    title: '10. Dispute Resolution',
    content: `The parties agree to attempt to resolve any disputes through good-faith negotiation first. If a dispute cannot be resolved through negotiation within 15 business days, either party may submit the dispute to mediation.

If mediation is unsuccessful, the parties consent to jurisdiction in Marion County, Indiana. This MOU is governed by the laws of the State of Indiana.

USDOL/RAPIDS compliance disputes are subject to federal apprenticeship regulations and may be reported to the Indiana Department of Workforce Development or the U.S. Department of Labor.`,
  },
];

const NAIL_SECTIONS: MouSection[] = [
  {
    title: '1. Parties and Purpose',
    content: `This Memorandum of Understanding ("MOU") is entered into between 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute ("Sponsor") and the nail salon or spa identified at execution ("Worksite Partner" or "Nail Salon").

This MOU establishes the terms under which the Nail Salon will serve as a worksite for the Indiana Nail Technician Apprenticeship Program, RAPIDS Program ID: 2025-IN-132304, a USDOL Registered Apprenticeship sponsored by ${PLATFORM_DEFAULTS.orgName}.

WHAT THIS AGREEMENT IS: This is a worksite hosting agreement for a federally registered apprenticeship program. The Nail Salon is hosting an apprentice employee and providing on-the-job training under federal Department of Labor oversight.

WHAT THIS AGREEMENT IS NOT: This MOU does not make the Nail Salon a Training Network Partner, a co-owner of Elevate programs, a revenue-sharing partner, or a program delivery site for any Elevate training program other than the nail technician apprenticeship.`,
  },
  {
    title: '2. Program Structure — Non-Negotiable Federal Requirements',
    content: `The Indiana Nail Technician Apprenticeship Program is a USDOL Registered Apprenticeship. Its structure is set by federal law and the registered program standards. These terms are not negotiable.

Program requirements:
• 800 hours of on-the-job training (OJT) at the worksite, supervised by a licensed nail technician
• Related Technical Instruction (RTI) coordinated by the Sponsor (Elevate)
• Progressive skill development tracked through competency assessments per the registered standards
• Apprentice must be registered with USDOL/RAPIDS before OJT hours begin
• All OJT hours must be documented and submitted to the Sponsor monthly

The Sponsor maintains sole authority over: RTI curriculum and delivery; competency assessment standards; RAPIDS registration and reporting; completion certificate issuance; program standards and modifications.`,
  },
  {
    title: '3. Sponsor Responsibilities',
    content: `${PLATFORM_DEFAULTS.orgName} agrees to:

• Maintain USDOL/RAPIDS registration and all required federal reporting
• Develop, deliver, and update all Related Technical Instruction (RTI)
• Maintain official apprentice records and program documentation
• Issue completion certificates upon successful program completion
• Screen and refer qualified apprentice candidates to the Nail Salon
• Provide the Nail Salon with competency checklists and OJT tracking tools
• Conduct periodic worksite visits to verify program compliance
• Serve as the point of contact with Indiana DWD and USDOL for all program matters`,
  },
  {
    title: '4. Worksite Partner Responsibilities — Non-Negotiable',
    content: `These responsibilities are required by federal apprenticeship law and USDOL program standards. They are not optional and are not subject to modification.

The Nail Salon agrees to:

SUPERVISION: Provide direct, on-site supervision of the apprentice by a currently licensed Indiana nail technician at all times during OJT hours. The supervising nail technician must hold an active Indiana IPLA nail technician license with at least 2 years of experience. No exceptions.

EMPLOYMENT: The apprentice is a paid employee of the Nail Salon — not a volunteer, intern, or independent contractor. The Nail Salon is the employer of record for the apprentice during OJT. The Nail Salon is responsible for payroll, withholding, workers' compensation, and all employer obligations under Indiana and federal law.

WAGES: Pay the apprentice according to the agreed progressive wage schedule (see Section 5). Failure to pay the apprentice as agreed is grounds for immediate termination of this MOU and will be reported to USDOL.

HOURS TRACKING: Accurately track and submit OJT hours to the Sponsor monthly using the provided tracking forms. Falsifying OJT hours is a federal offense.

SAFETY: Maintain a safe, sanitary workspace that complies with all OSHA standards, Indiana health codes for nail salons, and sanitation requirements. Report any workplace injury involving the apprentice to the Sponsor within 24 hours.

INSURANCE: Carry workers' compensation insurance covering the apprentice. Provide proof of coverage to the Sponsor before the apprentice begins OJT.

LICENSES: Maintain all required business licenses, health permits, and nail technician operating licenses throughout the term of this MOU. Notify the Sponsor immediately if any license lapses.

NONDISCRIMINATION: Comply with all federal nondiscrimination requirements under WIOA Section 188, Title VI of the Civil Rights Act, the ADA, and all applicable equal opportunity laws.`,
  },
  {
    title: '5. Apprentice Compensation — Federal Minimum Standards',
    content: `Apprentice compensation is governed by federal apprenticeship standards and Indiana minimum wage law. These minimums are not negotiable.

The apprentice is a paid employee. Compensation on a sole commission basis is prohibited under federal apprenticeship rules.

Approved compensation models:
• HOURLY: $10.00–$15.00/hr recommended. Must meet Indiana minimum wage ($7.25/hr) at all times.
• HYBRID: $8.00–$10.00/hr base wage PLUS 15%–25% commission on services performed. Base wage must meet Indiana minimum wage at all times.

Apprentices retain 100% of tips. Tips may not be counted toward the minimum wage requirement.

The Nail Salon is responsible for all payroll taxes, withholding, and employer contributions for the apprentice.`,
  },
  {
    title: '6. Term and Termination — 30-Day Notice Right',
    content: `This MOU is effective from the date signed and continues until the apprentice completes the program, withdraws, or the agreement is terminated.

YOUR RIGHT TO EXIT: Either party — the Nail Salon or the Sponsor — may terminate this MOU at any time for any reason by providing 30 days written notice. Send written notice (email is acceptable) to your assigned Elevate coordinator and copy elevate4humanityedu@gmail.com.

IMMEDIATE TERMINATION BY SPONSOR (no notice required): The Sponsor may terminate immediately if the Nail Salon fails to pay the apprentice, violates safety or sanitation requirements, loses licenses or insurance, falsifies records, or engages in misconduct.

After termination: Submit all outstanding OJT hour records within 10 business days.`,
  },
  {
    title: '7. Confidentiality and Non-Disclosure',
    content: `Both parties agree to maintain confidentiality of apprentice personally identifiable information (PII) in compliance with applicable privacy laws.

The Nail Salon may not disclose apprentice PII to any third party without written apprentice consent and Sponsor authorization, except as required for program administration or by law.

The Nail Salon also receives access to Elevate's operational procedures, program materials, and business information. This information is confidential and may not be used for any purpose other than fulfilling obligations under this MOU.`,
  },
  {
    title: '8. Non-Compete and Non-Replication',
    content: `The Nail Salon receives access to Elevate's registered apprenticeship program structure, curriculum relationships, RAPIDS registration, and credential pathways through this collaboration. This access is provided to support the apprentice — not to enable the Nail Salon to replicate the program independently.

During the term of this MOU and for three (3) years following termination, the Nail Salon agrees not to:
• Use Elevate's program structure, RAPIDS registration, or DWD relationships to independently register or operate a competing USDOL Registered Apprenticeship program in nail technology
• Solicit or redirect Elevate apprentice candidates, instructors, or credential partners into a competing program

These restrictions do not prevent the Nail Salon from: operating as a nail salon, employing licensed nail technicians, hiring apprentices through other registered programs, or participating in training programs that are not substantially similar to the Elevate apprenticeship model.`,
  },
  {
    title: '9. Partner Handbook — Required Reading',
    content: `The Worksite Partner Handbook is incorporated by reference into this MOU and forms part of this agreement. The Handbook details day-to-day responsibilities, compensation requirements, hour tracking procedures, and communication expectations.

By signing this MOU, the Nail Salon confirms that it has read and understood the Partner Handbook in full prior to signing. The Handbook is available at: ${PLATFORM_DEFAULTS.canonicalDomain}/partners/nail-technician-host-shop/handbook

Failure to comply with the standards set out in the Handbook constitutes a breach of this MOU.`,
  },
  {
    title: '10. Dispute Resolution',
    content: `The parties agree to attempt to resolve any disputes through good-faith negotiation first. If a dispute cannot be resolved through negotiation within 15 business days, either party may submit the dispute to mediation.

If mediation is unsuccessful, the parties consent to jurisdiction in Marion County, Indiana. This MOU is governed by the laws of the State of Indiana.

USDOL/RAPIDS compliance disputes are subject to federal apprenticeship regulations and may be reported to the Indiana Department of Workforce Development or the U.S. Department of Labor.`,
  },
];

const META: Record<HostShopMouProgram, HostShopMouMeta> = {
  barber: {
    documentType: 'Memorandum of Understanding',
    title: 'Indiana Barber Host Shop Program',
    subtitle: 'Worksite Partner Agreement',
    worksiteLabel: 'Your barbershop',
    handbookHref: '/partners/barber-host-shop/handbook',
    fullDocHref: '/docs/Indiana-Barbershop-Apprenticeship-MOU',
    rapidsId: '2025-IN-132301',
  },
  cosmetology: {
    documentType: 'Memorandum of Understanding',
    title: 'Indiana Cosmetology Apprenticeship Program',
    subtitle: 'Host Salon Worksite Agreement',
    worksiteLabel: 'Your salon',
    handbookHref: '/partners/cosmetology-host-shop/handbook',
    rapidsId: '2025-IN-132302',
  },
  esthetician: {
    documentType: 'Memorandum of Understanding',
    title: 'Indiana Esthetics Apprenticeship Program',
    subtitle: 'Host Spa/Salon Worksite Agreement',
    worksiteLabel: 'Your spa or salon',
    handbookHref: '/partners/esthetician-host-shop/handbook',
    rapidsId: '2025-IN-132303',
  },
  nail: {
    documentType: 'Memorandum of Understanding',
    title: 'Indiana Nail Technician Apprenticeship Program',
    subtitle: 'Host Nail Salon Worksite Agreement',
    worksiteLabel: 'Your nail salon',
    handbookHref: '/partners/nail-technician-host-shop/handbook',
    rapidsId: '2025-IN-132304',
  },
};

export function getHostShopMouSections(program: HostShopMouProgram): MouSection[] {
  switch (program) {
    case 'barber':
      return BARBER_SECTIONS;
    case 'cosmetology':
      return COSMETOLOGY_SECTIONS;
    case 'esthetician':
      return ESTHETICIAN_SECTIONS;
    case 'nail':
      return NAIL_SECTIONS;
    default:
      return BARBER_SECTIONS;
  }
}

export function getHostShopMouMeta(program: HostShopMouProgram): HostShopMouMeta {
  return META[program];
}
