// lms-data/courses/program-tax-prep-vita.ts
// ETPL Program ID: 10004627
// Tax Preparation & Financial Services Career Certificate (IRS VITA Track)
// 10 Weeks / 150 Hours / Hybrid

import type { Course } from "@/types/course";

export const taxPrepVitaCourse: Course = {
  id: "tax-vita-001",
  slug: "tax-prep-financial-services",
  title:
    "Tax Preparation & Financial Services Career Certificate (IRS VITA Track)",
  shortTitle: "Tax Prep & Financial Services",
  credentialPartner: "IRS",
  externalCredentialName: "IRS VITA/TCE Certification",
  description:
    "State Certified Earn and Learn program preparing individuals for employment in financial and tax services. Combines instructor-led and online coursework in tax law, bookkeeping, financial literacy, and customer service. Culminates in IRS VITA/TCE certification and practical experience at an IRS-approved VITA site.",
  hoursTotal: 150,
  deliveryMode: "HYBRID",
  locationLabel:
    "Elevate for Humanity Training Center + Online + IRS VITA Site",
  fundingEligible: [
    "WRG",
    "WIOA_ADULT",
    "WIOA_DW",
    "JRI",
    "WEX",
    "OJT",
    "ETG",
    "SELF_PAY",
  ],
  targetAudience: [
    "Adults seeking tax preparation careers",
    "Individuals interested in bookkeeping or financial services",
    "Entrepreneurs wanting to start a tax business",
    "Career changers seeking seasonal or year-round employment",
  ],
  outcomes: [
    "Interpret and apply federal and Indiana state tax laws to prepare individual income tax returns.",
    "Prepare and file accurate 1040 and supporting schedules using IRS-approved software (TaxSlayer).",
    "Conduct client intake interviews following IRS quality and confidentiality standards.",
    "Identify deductions, credits, and adjustments to income.",
    "Demonstrate financial literacy through budgeting, credit management, and savings activities.",
    "Exhibit professionalism, ethics, and effective communication in financial service settings.",
    "Earn the IRS VITA/TCE Certification and qualify for employment in tax or bookkeeping positions.",
  ],
  credentials: [
    {
      id: "vita-tce",
      name: "IRS VITA/TCE Certification",
      type: "industry",
      provider: "Internal Revenue Service",
      testRequired: true,
      obtainedInProgram: true,
    },
    {
      id: "elevate-cert",
      name: "Certificate of Completion",
      type: "certificate",
      provider: "Elevate for Humanity",
      testRequired: false,
      obtainedInProgram: true,
    },
    {
      id: "quickbooks-proadvisor",
      name: "QuickBooks ProAdvisor",
      type: "industry",
      provider: "Intuit",
      testRequired: true,
      obtainedInProgram: true,
    },
    {
      id: "ms365-fundamentals",
      name: "Microsoft 365 Fundamentals",
      type: "industry",
      provider: "Microsoft",
      testRequired: true,
      obtainedInProgram: true,
    },
    {
      id: "rise-up",
      name: "Rise Up Career Readiness",
      type: "certificate",
      provider: "NRF Foundation",
      testRequired: true,
      obtainedInProgram: true,
    },
  ],
  etpl: {
    programId: "10004627",
    cipCode: "22.0211",
    socCodes: ["13-2082.00", "43-3031.00"],
    classification: "State Certified Earn and Learn (SEAL)",
  },
  modules: [
    // ── Week 1: Orientation, Ethics, and Introduction to Federal Tax Law ──
    {
      id: "vita-w1",
      title: "Week 1: Orientation, Ethics & Federal Tax Law",
      description:
        "Program orientation, IRS ethics (Circular 230), Volunteer Standards of Conduct, and introduction to the federal tax system.",
      weekNumber: 1,
      hoursTotal: 15,
      lessons: [
        {
          id: "vita-w1-01",
          title: "Program Orientation & Expectations",
          type: "video",
          durationMinutes: 60,
          description:
            "Program overview, schedule, hybrid delivery model, and credential pathways.",
        },
        {
          id: "vita-w1-02",
          title: "IRS Volunteer Standards of Conduct (Form 13615)",
          type: "reading",
          durationMinutes: 45,
          externalUrl: "https://www.irs.gov/pub/irs-pdf/f13615.pdf",
          partnerTag: "IRS-VITA",
        },
        {
          id: "vita-w1-03",
          title: "Ethics & Circular 230",
          type: "reading",
          durationMinutes: 60,
          description:
            "IRS Circular 230 regulations governing tax practitioners. Due diligence, confidentiality, and professional responsibilities.",
        },
        {
          id: "vita-w1-04",
          title: "Introduction to the Federal Tax System",
          type: "reading",
          durationMinutes: 90,
          description:
            "Overview of the U.S. tax system, IRS structure, taxpayer rights, and the tax return lifecycle.",
        },
        {
          id: "vita-w1-05",
          title: "IRS Link & Learn Account Setup",
          type: "lab",
          durationMinutes: 30,
          externalUrl: "https://apps.irs.gov/app/vita/",
          partnerTag: "IRS-VITA",
          description:
            "Create your IRS Link & Learn account. This platform is used for certification.",
        },
        {
          id: "vita-w1-06",
          title: "Intuit for Education Enrollment",
          type: "lab",
          durationMinutes: 30,
          externalUrl: "https://intuit4education.app.intuit.com/login",
          partnerTag: "Intuit-I4E",
          description:
            "Enroll in Intuit for Education (free). Complete Money Mindsets introductory module.",
        },
        {
          id: "vita-w1-07",
          title: "Week 1 Quiz: Ethics & Tax System Basics",
          type: "quiz",
          durationMinutes: 20,
          checkpoint: true,
        },
      ],
    },

    // ── Week 2: Filing Status, Dependents, and Basic Income Reporting ──
    {
      id: "vita-w2",
      title: "Week 2: Filing Status, Dependents & Income",
      description:
        "Filing status determination, dependency rules, and reporting wages, interest, and dividends.",
      weekNumber: 2,
      hoursTotal: 15,
      lessons: [
        {
          id: "vita-w2-01",
          title: "Filing Status Determination",
          type: "reading",
          durationMinutes: 60,
          description:
            "Single, MFJ, MFS, HOH, QSS. Decision tree for determining correct filing status.",
        },
        {
          id: "vita-w2-02",
          title: "Dependency Rules & Qualifying Tests",
          type: "video",
          durationMinutes: 60,
          description:
            "Qualifying child vs qualifying relative. Support test, residency test, relationship test.",
        },
        {
          id: "vita-w2-03",
          title: "Wages, Salaries & W-2 Processing",
          type: "reading",
          durationMinutes: 45,
        },
        {
          id: "vita-w2-04",
          title: "Interest, Dividends & 1099 Forms",
          type: "reading",
          durationMinutes: 45,
        },
        {
          id: "vita-w2-05",
          title: "Other Income: Social Security, Retirement, Unemployment",
          type: "reading",
          durationMinutes: 45,
        },
        {
          id: "vita-w2-06",
          title: "IRS Link & Learn: Basic Income Module",
          type: "lab",
          durationMinutes: 60,
          externalUrl: "https://apps.irs.gov/app/vita/",
          partnerTag: "IRS-VITA",
        },
        {
          id: "vita-w2-07",
          title: "Intuit for Education: Earning Income Module",
          type: "lab",
          durationMinutes: 45,
          externalUrl: "https://intuit4education.app.intuit.com",
          partnerTag: "Intuit-I4E",
        },
        {
          id: "vita-w2-08",
          title: "Week 2 Quiz: Filing Status & Income",
          type: "quiz",
          durationMinutes: 20,
          checkpoint: true,
        },
      ],
    },

    // ── Week 3: Adjustments, Deductions, and Credits ──
    {
      id: "vita-w3",
      title: "Week 3: Adjustments, Deductions & Credits",
      description:
        "Above-the-line adjustments, standard vs itemized deductions, and key tax credits (EITC, CTC, education).",
      weekNumber: 3,
      hoursTotal: 15,
      lessons: [
        {
          id: "vita-w3-01",
          title: "Adjustments to Income",
          type: "reading",
          durationMinutes: 60,
          description:
            "Student loan interest, educator expenses, IRA contributions, HSA, self-employment tax deduction.",
        },
        {
          id: "vita-w3-02",
          title: "Standard vs Itemized Deductions",
          type: "video",
          durationMinutes: 45,
          description:
            "When to itemize. Schedule A: medical, state/local taxes, mortgage interest, charitable contributions.",
        },
        {
          id: "vita-w3-03",
          title: "Earned Income Tax Credit (EITC)",
          type: "reading",
          durationMinutes: 60,
          description:
            "EITC eligibility, income limits, qualifying children, due diligence requirements (Form 8867).",
        },
        {
          id: "vita-w3-04",
          title: "Child Tax Credit & Dependent Care Credit",
          type: "video",
          durationMinutes: 45,
        },
        {
          id: "vita-w3-05",
          title: "Education Credits (AOTC & LLC)",
          type: "reading",
          durationMinutes: 45,
        },
        {
          id: "vita-w3-06",
          title: "Practice Returns: Credits & Deductions Scenarios",
          type: "lab",
          durationMinutes: 90,
          description:
            "Complete 3 practice returns using mock client files with various credit/deduction combinations.",
        },
        {
          id: "vita-w3-07",
          title: "Intuit for Education: Taxes & Government Module",
          type: "lab",
          durationMinutes: 45,
          externalUrl: "https://intuit4education.app.intuit.com",
          partnerTag: "Intuit-I4E",
        },
        {
          id: "vita-w3-08",
          title: "Week 3 Quiz: Deductions & Credits",
          type: "quiz",
          durationMinutes: 20,
          checkpoint: true,
        },
      ],
    },

    // ── Week 4: TaxSlayer Software Training and Practice Returns ──
    {
      id: "vita-w4",
      title: "Week 4: TaxSlayer Software & Practice Returns",
      description:
        "Hands-on training with TaxSlayer Pro. Data entry, e-filing, quality review, and practice returns.",
      weekNumber: 4,
      hoursTotal: 15,
      lessons: [
        {
          id: "vita-w4-01",
          title: "TaxSlayer Pro: Navigation & Setup",
          type: "lab",
          durationMinutes: 60,
          description:
            "Account setup, interface navigation, client management, and return creation.",
        },
        {
          id: "vita-w4-02",
          title: "TaxSlayer Pro: Data Entry & Form 1040",
          type: "lab",
          durationMinutes: 90,
          description:
            "Enter W-2s, 1099s, dependents, and deductions. Interview mode vs forms mode.",
        },
        {
          id: "vita-w4-03",
          title: "TaxSlayer Pro: Schedules & Supporting Forms",
          type: "lab",
          durationMinutes: 60,
          description:
            "Schedule A, B, C, EIC. Form 8867 due diligence. Error checking and diagnostics.",
        },
        {
          id: "vita-w4-04",
          title: "E-Filing Requirements & Procedures",
          type: "reading",
          durationMinutes: 45,
          description:
            "IRS e-file requirements, rejection codes, bank products, and refund options.",
        },
        {
          id: "vita-w4-05",
          title: "Quality Review Process",
          type: "reading",
          durationMinutes: 30,
          description:
            "IRS quality review standards. Peer review checklist. Common errors to catch.",
        },
        {
          id: "vita-w4-06",
          title: "Practice Returns: 5 Complete Returns in TaxSlayer",
          type: "lab",
          durationMinutes: 120,
          description:
            "Complete 5 practice returns from mock client files. Includes simple, moderate, and complex scenarios.",
        },
        {
          id: "vita-w4-07",
          title: "Mid-Term Simulation Exam",
          type: "quiz",
          durationMinutes: 90,
          checkpoint: true,
          description:
            "Timed simulation: prepare 2 complete returns from mock client files. Graded on accuracy and completeness.",
        },
      ],
    },

    // ── Week 5: Financial Literacy ──
    {
      id: "vita-w5",
      title: "Week 5: Financial Literacy — Budgeting, Credit & Savings",
      description:
        "Personal finance fundamentals: budgeting, credit management, savings strategies, and financial goal setting. Delivered via Intuit for Education platform.",
      weekNumber: 5,
      hoursTotal: 15,
      lessons: [
        {
          id: "vita-w5-01",
          title: "Intuit for Education: Money Mindsets",
          type: "lab",
          durationMinutes: 120,
          externalUrl: "https://intuit4education.app.intuit.com",
          partnerTag: "Intuit-I4E",
          description:
            "Complete the Money Mindsets module. Financial attitudes, values, and goal setting.",
        },
        {
          id: "vita-w5-02",
          title: "Intuit for Education: Earning & Spending",
          type: "lab",
          durationMinutes: 120,
          externalUrl: "https://intuit4education.app.intuit.com",
          partnerTag: "Intuit-I4E",
          description:
            "Income sources, budgeting fundamentals, needs vs wants, and spending plans.",
        },
        {
          id: "vita-w5-03",
          title: "Intuit for Education: Saving & Investing",
          type: "lab",
          durationMinutes: 90,
          externalUrl: "https://intuit4education.app.intuit.com",
          partnerTag: "Intuit-I4E",
          description:
            "Savings strategies, compound interest, investment basics, and retirement planning.",
        },
        {
          id: "vita-w5-04",
          title: "Intuit for Education: Credit & Debt",
          type: "lab",
          durationMinutes: 90,
          externalUrl: "https://intuit4education.app.intuit.com",
          partnerTag: "Intuit-I4E",
          description:
            "Credit scores, credit reports, managing debt, and building credit responsibly.",
        },
        {
          id: "vita-w5-05",
          title: "Budgeting Workshop: Build Your Personal Budget",
          type: "lab",
          durationMinutes: 60,
          description:
            "In-class workshop: create a personal budget using Excel/Google Sheets. Apply I4E concepts.",
        },
        {
          id: "vita-w5-06",
          title: "Week 5 Quiz: Financial Literacy",
          type: "quiz",
          durationMinutes: 20,
          checkpoint: true,
        },
      ],
    },

    // ── Weeks 6-9: VITA Site Practicum ──
    {
      id: "vita-w6-9",
      title: "Weeks 6–9: VITA Site Practicum",
      description:
        "Live client tax preparation at an IRS-approved VITA site. Supervised by IRS-certified site coordinator. 60 hours total.",
      weekNumber: 6,
      weekEnd: 9,
      hoursTotal: 60,
      lessons: [
        {
          id: "vita-w6-01",
          title: "VITA Site Orientation & Procedures",
          type: "reading",
          durationMinutes: 60,
          description:
            "Site layout, client flow, intake procedures, Form 13614-C, and quality review process.",
        },
        {
          id: "vita-w6-02",
          title: "Client Intake Interview Techniques",
          type: "video",
          durationMinutes: 45,
          description:
            "Conducting intake interviews. Gathering documents. Identifying scope-of-service issues.",
        },
        {
          id: "vita-w6-03",
          title: "Practicum: Supervised Tax Preparation (Week 6)",
          type: "practicum",
          durationMinutes: 600,
          description:
            "Prepare client returns under direct supervision. All returns reviewed before filing.",
        },
        {
          id: "vita-w7-01",
          title: "Practicum: Tax Preparation with Peer Review (Week 7)",
          type: "practicum",
          durationMinutes: 600,
          description:
            "Prepare returns with increasing independence. Conduct peer quality reviews.",
        },
        {
          id: "vita-w8-01",
          title: "Practicum: Independent Preparation (Week 8)",
          type: "practicum",
          durationMinutes: 600,
          description:
            "Prepare returns independently. Supervisor spot-checks. Handle complex scenarios.",
        },
        {
          id: "vita-w9-01",
          title: "Practicum: Final Week & Supervisor Evaluation (Week 9)",
          type: "practicum",
          durationMinutes: 600,
          description:
            "Final practicum week. Supervisor completes formal evaluation on accuracy, client service, and professionalism.",
        },
        {
          id: "vita-w9-02",
          title: "Supervisor Evaluation Form",
          type: "assessment",
          durationMinutes: 30,
          checkpoint: true,
          description:
            "Formal supervisor evaluation covering: accuracy, client communication, ethics, time management, and professionalism.",
        },
      ],
    },

    // ── Week 10: Certification, Career Readiness & Placement ──
    {
      id: "vita-w10",
      title: "Week 10: Certification Exam, Career Readiness & Placement",
      description:
        "IRS VITA/TCE certification exam via Link & Learn, career readiness activities, resume building, and job placement support.",
      weekNumber: 10,
      hoursTotal: 15,
      lessons: [
        {
          id: "vita-w10-01",
          title: "IRS Certification Exam Prep Review",
          type: "reading",
          durationMinutes: 120,
          description:
            "Review all tax topics. Practice questions. Common exam pitfalls.",
        },
        {
          id: "vita-w10-02",
          title: "IRS VITA/TCE Certification Exam (Link & Learn)",
          type: "assessment",
          durationMinutes: 120,
          externalUrl: "https://apps.irs.gov/app/vita/",
          partnerTag: "IRS-VITA",
          checkpoint: true,
          description:
            "Complete the IRS certification exam on the Link & Learn platform. Passing score: 80%.",
        },
        {
          id: "vita-w10-03",
          title: "QuickBooks ProAdvisor Certification Exam",
          type: "assessment",
          durationMinutes: 90,
          externalUrl:
            "https://quickbooks.intuit.com/accountants/training-certification/",
          partnerTag: "Intuit",
          checkpoint: true,
          description:
            "Complete the QuickBooks ProAdvisor certification exam via Intuit. Free for program participants.",
        },
        {
          id: "vita-w10-04",
          title: "Microsoft 365 Fundamentals (MS-900) Exam",
          type: "assessment",
          durationMinutes: 60,
          partnerTag: "Certiport",
          checkpoint: true,
          description:
            "Complete the MS-900 exam at the Certiport Authorized Testing Center.",
        },
        {
          id: "vita-w10-05",
          title: "Rise Up Career Readiness Assessment",
          type: "assessment",
          durationMinutes: 60,
          partnerTag: "NRF-RiseUp",
          checkpoint: true,
          description:
            "Complete the NRF RISE Up assessment. Passing score: 70%.",
        },
        {
          id: "vita-w10-06",
          title: "Resume Building & Interview Preparation",
          type: "lab",
          durationMinutes: 90,
          description:
            "Build a professional resume highlighting credentials earned. Practice interview scenarios for tax prep and financial services positions.",
        },
        {
          id: "vita-w10-07",
          title: "Career Readiness & Job Placement Review",
          type: "reading",
          durationMinutes: 60,
          checkpoint: true,
          description:
            "Final career readiness review. Job placement support. Employer connections. Seasonal and year-round opportunities.",
        },
      ],
    },
  ],
  externalPlatforms: [
    {
      id: "irs-link-learn",
      name: "IRS Link & Learn Taxes",
      url: "https://apps.irs.gov/app/vita/",
      purpose: "IRS VITA/TCE certification exam and training modules",
      cost: "Free",
      accountRequired: true,
    },
    {
      id: "intuit-i4e",
      name: "Intuit for Education",
      url: "https://intuit4education.app.intuit.com",
      purpose:
        "Financial literacy curriculum: budgeting, credit, saving, investing, taxes",
      cost: "Free",
      accountRequired: true,
      whitelistDomains: [
        "education.intuit.com",
        "cdn.intuit4education.a.intuit.com",
      ],
    },
    {
      id: "quickbooks-proadvisor",
      name: "QuickBooks ProAdvisor Program",
      url: "https://quickbooks.intuit.com/accountants/training-certification/",
      purpose: "QuickBooks ProAdvisor certification training and exam",
      cost: "Free",
      accountRequired: true,
    },
    {
      id: "certiport",
      name: "Certiport Authorized Testing Center",
      url: "https://certiport.pearsonvue.com/",
      purpose: "Microsoft 365 Fundamentals (MS-900) exam delivery",
      cost: "Free (via Elevate CATC)",
      accountRequired: true,
    },
    {
      id: "nrf-riseup",
      name: "NRF Foundation RISE Up",
      url: "https://nrffoundation.org/riseup",
      purpose: "Career readiness certification",
      cost: "Free",
      accountRequired: true,
    },
  ],
  lmsPath: "/student/enroll/tax-prep-financial-services",
  isPublished: true,
};
