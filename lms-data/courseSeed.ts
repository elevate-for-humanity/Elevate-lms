// High-level course structure for Elevate programs, tied to credential partners.
// This feeds the /api/dev/seed-courses endpoint.

export type SeedContentType =
  | "video"
  | "pdf"
  | "scorm"
  | "quiz"
  | "reflection"
  | "link"
  | "other";

export interface LessonSeed {
  title: string;
  contentType: SeedContentType;
  // For now we leave URLs null; once you have real links (HSI, Milady, etc.),
  // you can paste them here and re-run the seed.
  contentUrl?: string | null;
  durationMinutes?: number | null;
  partnerTag?: string; // "HSI", "Milady", "CareerSafe", "Certiport", "NationalDrug", "IRS-VITA", etc.
}

export interface ModuleSeed {
  title: string;
  description?: string;
  orderIndex?: number;
  lessons: LessonSeed[];
}

export interface ProgramSeed {
  code: string; // maps to programs.code
  name: string;
  category: string;
  description?: string;
  modules: ModuleSeed[];
}

export const programSeeds: ProgramSeed[] = [
  {
    code: "CNA-TRAINING",
    name: "CNA Training",
    category: "healthcare",
    description:
      "Hands-on Certified Nursing Assistant training focused on real-world care settings, soft skills, and job placement.",
    modules: [
      {
        title: "Orientation & Job Ready Indy Soft Skills",
        orderIndex: 1,
        description:
          "Welcome to Elevate, expectations, and JRI-style workplace readiness.",
        lessons: [
          {
            title: "Welcome to Elevate & CNA Pathway",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 10,
          },
          {
            title: "Workplace Readiness – Attendance, Communication, Attitude",
            contentType: "scorm",
            partnerTag: "JRI",
            durationMinutes: 45,
          },
        ],
      },
      {
        title: "Core CNA Theory (HSI / Choice Medical)",
        orderIndex: 2,
        description:
          "Credential-aligned CNA theory content delivered through your partner curriculum.",
        lessons: [
          {
            title: "CNA Role, Scope of Practice & Ethics",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
          {
            title: "Infection Control & Standard Precautions",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
          {
            title: "Vital Signs & Basic Procedures",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
        ],
      },
      {
        title: "Skills Lab & Clinical Prep",
        orderIndex: 3,
        lessons: [
          {
            title: "Skills Lab Orientation & Safety",
            contentType: "pdf",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Clinical Checklists & Competency Sign-off",
            contentType: "pdf",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
      {
        title: "State Exam Prep & Job Placement",
        orderIndex: 4,
        lessons: [
          {
            title: "CNA State Exam Overview & Registration",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Resume, Interview & Employer Matching",
            contentType: "reflection",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
    ],
  },
  {
    code: "BARBER-APP",
    name: "Barber Apprenticeship",
    category: "beauty",
    description:
      "Milady-style barber theory plus in-shop apprenticeship hours and business skills.",
    modules: [
      {
        title: "Barber Shop Orientation & JRI Prep",
        orderIndex: 1,
        lessons: [
          {
            title: "Welcome to Your Barber Apprenticeship",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 10,
          },
          {
            title: "Professionalism in the Shop (JRI-style)",
            contentType: "scorm",
            partnerTag: "JRI",
            durationMinutes: 45,
          },
        ],
      },
      {
        title: "Core Barber Theory (Milady RISE)",
        orderIndex: 2,
        lessons: [
          {
            title: "Sanitation, Disinfection & Safety",
            contentType: "link",
            partnerTag: "Milady",
            durationMinutes: 30,
          },
          {
            title: "Hair & Scalp Structure Basics",
            contentType: "link",
            partnerTag: "Milady",
            durationMinutes: 30,
          },
          {
            title: "Cutting Fundamentals & Tools",
            contentType: "link",
            partnerTag: "Milady",
            durationMinutes: 30,
          },
        ],
      },
      {
        title: "On-the-Job Apprenticeship Hours",
        orderIndex: 3,
        lessons: [
          {
            title: "Shop Expectations & Tracking Hours",
            contentType: "pdf",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Client Communication & Chair Etiquette",
            contentType: "reflection",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
      {
        title: "Business & Branding for Barbers",
        orderIndex: 4,
        lessons: [
          {
            title: "Building Your Client Base",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
          {
            title: "Basic Bookkeeping & Taxes for Barbers",
            contentType: "link",
            partnerTag: "TAX-VITA",
            durationMinutes: 20,
          },
        ],
      },
    ],
  },
  {
    code: "HVAC-TECH",
    name: "HVAC Technician Pathway",
    category: "skilled-trades",
    description:
      "HVAC theory plus hands-on experience with employer partners.",
    modules: [
      {
        title: "HVAC Orientation & Safety",
        orderIndex: 1,
        lessons: [
          {
            title: "Intro to HVAC Careers & Pathways",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Jobsite Safety (OSHA-style via CareerSafe)",
            contentType: "link",
            partnerTag: "CareerSafe",
            durationMinutes: 40,
          },
        ],
      },
      {
        title: "Core HVAC Theory",
        orderIndex: 2,
        lessons: [
          {
            title: "HVAC Fundamentals & Systems Overview",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
          {
            title: "Electrical Basics for HVAC",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
        ],
      },
      {
        title: "Lab & Ride-Along Experience",
        orderIndex: 3,
        lessons: [
          {
            title: "Lab Orientation & Safety Checklist",
            contentType: "pdf",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Ride-Along Reflection",
            contentType: "reflection",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
    ],
  },
  {
    code: "CDL-TRAIN",
    name: "CDL Training Pathway",
    category: "transportation",
    description:
      "Preparation for CDL licensure plus employer connections for drivers.",
    modules: [
      {
        title: "CDL Overview & Eligibility",
        orderIndex: 1,
        lessons: [
          {
            title: "Intro to CDL Licenses & Endorsements",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Drug & Alcohol Requirements (National Drug)",
            contentType: "link",
            partnerTag: "NationalDrug",
            durationMinutes: 25,
          },
        ],
      },
      {
        title: "Theory Content",
        orderIndex: 2,
        lessons: [
          {
            title: "Vehicle Inspection Basics",
            contentType: "link",
            partnerTag: "PartnerSchool",
            durationMinutes: 30,
          },
          {
            title: "Driving Safety & Hours of Service",
            contentType: "link",
            partnerTag: "PartnerSchool",
            durationMinutes: 30,
          },
        ],
      },
      {
        title: "Behind-the-Wheel & Placement",
        orderIndex: 3,
        lessons: [
          {
            title: "Behind-the-Wheel Checklist",
            contentType: "pdf",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Employer Matching & Career Planning",
            contentType: "reflection",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
    ],
  },
  {
    code: "BUILDING-TECH-APP",
    name: "Building Maintenance & Technician Apprenticeship",
    category: "skilled-trades",
    description:
      "Facilities and building tech apprenticeship combining coursework and on-site experience.",
    modules: [
      {
        title: "Building Maintenance Orientation",
        orderIndex: 1,
        lessons: [
          {
            title: "Intro to Building Maintenance Roles",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Safety & OSHA Basics (CareerSafe)",
            contentType: "link",
            partnerTag: "CareerSafe",
            durationMinutes: 40,
          },
        ],
      },
      {
        title: "Core Building Systems",
        orderIndex: 2,
        lessons: [
          {
            title: "Plumbing & Electrical Basics",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
          {
            title: "Preventive Maintenance",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
        ],
      },
    ],
  },
  {
    code: "BUSINESS-APP",
    name: "Business Support Apprenticeship",
    category: "business",
    description:
      "Business admin, office support, and customer service with real employer placements.",
    modules: [
      {
        title: "Professionalism & Office Culture",
        orderIndex: 1,
        lessons: [
          {
            title: "Orientation to Business Support Roles",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "JRI-Style Soft Skills for Office Settings",
            contentType: "scorm",
            partnerTag: "JRI",
            durationMinutes: 45,
          },
        ],
      },
      {
        title: "Digital Skills & Certifications",
        orderIndex: 2,
        lessons: [
          {
            title: "Computer Basics & Productivity Tools",
            contentType: "link",
            partnerTag: "Certiport",
            durationMinutes: 30,
          },
          {
            title: "Customer Service & Communication",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
        ],
      },
    ],
  },
  {
    code: "EMS-APP",
    name: "EMS & Healthcare Support Apprenticeship",
    category: "healthcare",
    description:
      "Apprenticeship-style healthcare support roles with EMS exposure.",
    modules: [
      {
        title: "Healthcare & EMS Overview",
        orderIndex: 1,
        lessons: [
          {
            title: "Intro to EMS & Support Roles",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Basic Patient Interaction & Safety",
            contentType: "link",
            partnerTag: "HSI",
            durationMinutes: 30,
          },
        ],
      },
    ],
  },
  {
    code: "TAX-VITA",
    name: "Tax Preparation & Financial Services (IRS VITA Track)",
    category: "tax-vita",
    description:
      "10-week ETPL-approved program: IRS VITA/TCE certification, TaxSlayer training, financial literacy via Intuit for Education, and supervised VITA site practicum. Program ID #10004627.",
    modules: [
      {
        title: "Week 1: Orientation, Ethics & Federal Tax Law",
        orderIndex: 1,
        lessons: [
          {
            title: "Program Orientation & Expectations",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "IRS Volunteer Standards of Conduct (Form 13615)",
            contentType: "link",
            partnerTag: "IRS-VITA",
            durationMinutes: 45,
          },
          {
            title: "Ethics & Circular 230",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "Introduction to the Federal Tax System",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 90,
          },
          {
            title: "IRS Link & Learn Account Setup",
            contentType: "link",
            partnerTag: "IRS-VITA",
            durationMinutes: 30,
          },
          {
            title: "Intuit for Education Enrollment",
            contentType: "link",
            partnerTag: "Intuit-I4E",
            durationMinutes: 30,
          },
          {
            title: "Week 1 Quiz: Ethics & Tax System Basics",
            contentType: "quiz",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
      {
        title: "Week 2: Filing Status, Dependents & Income",
        orderIndex: 2,
        lessons: [
          {
            title: "Filing Status Determination",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "Dependency Rules & Qualifying Tests",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "Wages, Salaries & W-2 Processing",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 45,
          },
          {
            title: "Interest, Dividends & 1099 Forms",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 45,
          },
          {
            title: "IRS Link & Learn: Basic Income Module",
            contentType: "link",
            partnerTag: "IRS-VITA",
            durationMinutes: 60,
          },
          {
            title: "Intuit for Education: Earning Income Module",
            contentType: "link",
            partnerTag: "Intuit-I4E",
            durationMinutes: 45,
          },
          {
            title: "Week 2 Quiz: Filing Status & Income",
            contentType: "quiz",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
      {
        title: "Week 3: Adjustments, Deductions & Credits",
        orderIndex: 3,
        lessons: [
          {
            title: "Adjustments to Income",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "Standard vs Itemized Deductions",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 45,
          },
          {
            title: "Earned Income Tax Credit (EITC) & Due Diligence",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "Child Tax Credit & Education Credits",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 45,
          },
          {
            title: "Practice Returns: Credits & Deductions Scenarios",
            contentType: "lab",
            partnerTag: "Elevate",
            durationMinutes: 90,
          },
          {
            title: "Intuit for Education: Taxes & Government Module",
            contentType: "link",
            partnerTag: "Intuit-I4E",
            durationMinutes: 45,
          },
          {
            title: "Week 3 Quiz: Deductions & Credits",
            contentType: "quiz",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
      {
        title: "Week 4: TaxSlayer Software & Practice Returns",
        orderIndex: 4,
        lessons: [
          {
            title: "TaxSlayer Pro: Navigation & Setup",
            contentType: "lab",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "TaxSlayer Pro: Data Entry & Form 1040",
            contentType: "lab",
            partnerTag: "Elevate",
            durationMinutes: 90,
          },
          {
            title: "E-Filing Requirements & Procedures",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 45,
          },
          {
            title: "Practice Returns: 5 Complete Returns in TaxSlayer",
            contentType: "lab",
            partnerTag: "Elevate",
            durationMinutes: 120,
          },
          {
            title: "Mid-Term Simulation Exam",
            contentType: "quiz",
            partnerTag: "Elevate",
            durationMinutes: 90,
          },
        ],
      },
      {
        title: "Week 5: Financial Literacy (Intuit for Education)",
        orderIndex: 5,
        lessons: [
          {
            title: "Intuit for Education: Money Mindsets",
            contentType: "link",
            partnerTag: "Intuit-I4E",
            durationMinutes: 120,
          },
          {
            title: "Intuit for Education: Earning & Spending",
            contentType: "link",
            partnerTag: "Intuit-I4E",
            durationMinutes: 120,
          },
          {
            title: "Intuit for Education: Saving & Investing",
            contentType: "link",
            partnerTag: "Intuit-I4E",
            durationMinutes: 90,
          },
          {
            title: "Intuit for Education: Credit & Debt",
            contentType: "link",
            partnerTag: "Intuit-I4E",
            durationMinutes: 90,
          },
          {
            title: "Budgeting Workshop: Build Your Personal Budget",
            contentType: "lab",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
          {
            title: "Week 5 Quiz: Financial Literacy",
            contentType: "quiz",
            partnerTag: "Elevate",
            durationMinutes: 20,
          },
        ],
      },
      {
        title: "Weeks 6–9: VITA Site Practicum (60 Hours)",
        orderIndex: 6,
        lessons: [
          {
            title: "VITA Site Orientation & Procedures",
            contentType: "reading",
            partnerTag: "IRS-VITA",
            durationMinutes: 60,
          },
          {
            title: "Client Intake Interview Techniques",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 45,
          },
          {
            title: "Practicum: Supervised Tax Preparation (Week 6)",
            contentType: "practicum",
            partnerTag: "IRS-VITA",
            durationMinutes: 600,
          },
          {
            title: "Practicum: Peer Review (Week 7)",
            contentType: "practicum",
            partnerTag: "IRS-VITA",
            durationMinutes: 600,
          },
          {
            title: "Practicum: Independent Preparation (Week 8)",
            contentType: "practicum",
            partnerTag: "IRS-VITA",
            durationMinutes: 600,
          },
          {
            title: "Practicum: Final Week & Supervisor Evaluation (Week 9)",
            contentType: "practicum",
            partnerTag: "IRS-VITA",
            durationMinutes: 600,
          },
        ],
      },
      {
        title: "Week 10: Certification, Career Readiness & Placement",
        orderIndex: 7,
        lessons: [
          {
            title: "IRS Certification Exam Prep Review",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 120,
          },
          {
            title: "IRS VITA/TCE Certification Exam (Link & Learn)",
            contentType: "link",
            partnerTag: "IRS-VITA",
            durationMinutes: 120,
          },
          {
            title: "QuickBooks ProAdvisor Certification Exam",
            contentType: "link",
            partnerTag: "Intuit",
            durationMinutes: 90,
          },
          {
            title: "Microsoft 365 Fundamentals (MS-900) Exam",
            contentType: "link",
            partnerTag: "Certiport",
            durationMinutes: 60,
          },
          {
            title: "Rise Up Career Readiness Assessment",
            contentType: "link",
            partnerTag: "NRF-RiseUp",
            durationMinutes: 60,
          },
          {
            title: "Resume Building & Interview Preparation",
            contentType: "lab",
            partnerTag: "Elevate",
            durationMinutes: 90,
          },
          {
            title: "Career Readiness & Job Placement Review",
            contentType: "reading",
            partnerTag: "Elevate",
            durationMinutes: 60,
          },
        ],
      },
    ],
  },
  {
    code: "ESTHETICS-APP",
    name: "Esthetics Apprenticeship",
    category: "beauty",
    description:
      "Spa-based apprenticeship focused on skincare, sanitation, and client experience.",
    modules: [
      {
        title: "Esthetics Orientation & Spa Standards",
        orderIndex: 1,
        lessons: [
          {
            title: "What to Expect as an Esthetics Apprentice",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Sanitation, Disinfection & Safety (Milady)",
            contentType: "link",
            partnerTag: "Milady",
            durationMinutes: 30,
          },
        ],
      },
    ],
  },
  {
    code: "NAIL-APP",
    name: "Nail Technician Apprenticeship",
    category: "beauty",
    description:
      "Nail tech apprenticeship focused on salon-ready skills and sanitation.",
    modules: [
      {
        title: "Nail Tech Orientation & Safety",
        orderIndex: 1,
        lessons: [
          {
            title: "Intro to Nail Tech Careers",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Sanitation & Safety (Milady)",
            contentType: "link",
            partnerTag: "Milady",
            durationMinutes: 30,
          },
        ],
      },
    ],
  },
  {
    code: "CULINARY-APP",
    name: "Culinary & Kitchen Apprenticeship",
    category: "culinary",
    description:
      "Kitchen-based apprenticeship focused on food safety, prep, and career pathways.",
    modules: [
      {
        title: "Kitchen Orientation & Safety",
        orderIndex: 1,
        lessons: [
          {
            title: "Intro to Culinary Careers",
            contentType: "video",
            partnerTag: "Elevate",
            durationMinutes: 15,
          },
          {
            title: "Food Safety Basics",
            contentType: "link",
            partnerTag: "CareerSafe",
            durationMinutes: 30,
          },
        ],
      },
    ],
  },
];
