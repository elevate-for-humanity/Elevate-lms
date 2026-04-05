
/**
 * Centralized Program Data
 * Single source of truth for all program content, descriptions, and CTAs
 */

// Bundled pricing options for programs
export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
  popular?: boolean;
}

export type Program = {
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  shortDescription: string;
  longDescription: string;
  heroImage: string;
  heroImageAlt: string;
  heroVideo?: string; // Optional video URL for hero section
  voiceoverSrc?: string; // Optional voiceover audio that plays independently
  duration: string;
  clockHours?: number; // Total clock hours for state compliance
  schedule: string;
  delivery: string;
  credential: string;
  approvals: string[];
  fundingOptions: string[];
  highlights: string[];
  whatYouLearn: string[];
  outcomes: string[];
  requirements: string[];
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  price?: number;
  etplProgramId?: string;
  partnerUrl?: string;
  partners?: string[];
  vendorCost?: number;
  averageSalary?: string;
  salaryRange?: string;
  jobGrowth?: string;
  curriculum?: Module[];
  faq?: FAQ[];
  testimonials?: Testimonial[];
  // Bundled pricing support
  pricingTiers?: PricingTier[];
  examVoucherPrice?: number;
  retakeVoucherPrice?: number;
};

interface Module {
  id: string;
  title: string;
  description: string;
  hours: number;
  topics: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface Testimonial {
  id: string;
  name: string;
  photo: string;
  program: string;
  quote: string;
  outcome: string;
}

export const programs: Program[] = [
  {
    slug: 'hvac-technician',
    name: 'HVAC Technician',
    heroTitle: 'HVAC Technician Career Training',
    heroSubtitle:
      'Install, maintain, and repair heating and cooling systems. Earn EPA 608 Universal certification — proctored on-site at our approved testing facility. 6–8 weeks classroom plus 2–4 weeks hands-on training.',
    shortDescription:
      'Install, maintain, and repair heating and cooling systems. Earn EPA 608 Universal certification — proctored on-site at our approved testing facility. 6–8 weeks classroom plus 2–4 weeks hands-on training.',
    longDescription:
      "The HVAC Technician program prepares students to diagnose, repair, and maintain heating, ventilation, air conditioning, and refrigeration systems. Training covers electrical fundamentals, refrigeration theory, system installation, and EPA 608 certification prep — proctored on-site.\n\nProgram Format:\n- 6–8 weeks classroom instruction at our Indianapolis training center\n- 2–4 weeks hands-on training and employer jobsite placement\n- 12 weeks total, 240 instructional hours\n- Hybrid: Online Related Technical Instruction via LMS + hands-on labs\n\nWhat You'll Learn:\n- HVAC system components and operation\n- Electrical testing and troubleshooting\n- Refrigeration cycle fundamentals\n- Equipment installation and repair\n- Preventative maintenance practices\n- Safety, EPA preparation, and customer communication\n\nCredentials:\n- EPA 608 Universal Certification (proctored on-site)\n- OSHA 30-Hour Construction Safety\n- CPR / First Aid\n\nCareer Outcomes:\n- HVAC Technician (entry-level)\n- Maintenance Technician\n- Building Operations Support",
    heroImage: '/images/pages/hvac-technician.jpg',
    heroImageAlt: 'HVAC student working on an air conditioning unit',
    heroVideo: '/videos/hvac-hero-final.mp4',
    duration: '12 weeks (240 hours)',
    clockHours: 240,
    schedule: '6–8 weeks classroom + 2–4 weeks hands-on/OJT',
    delivery: 'Hybrid — Online RTI via LMS + hands-on labs at training facility',
    credential:
      'EPA 608 Universal Certification (proctored on-site), OSHA 30-Hour Construction Safety, CPR/First Aid',
    approvals: [
      'Workforce funding may be available (location dependent)',
      'Employer OJT/sponsorship options may apply',
    ],
    fundingOptions: [
      'Workforce funding may be available (location dependent)',
      'Employer OJT/sponsorship options may apply',
    ],
    highlights: [
      'High demand - companies are desperate for skilled HVAC technicians',
      'Excellent pay and benefits - start at $40-50k, experienced techs earn $60-80k+',
      'Hands-on training with real HVAC equipment and systems',
      'EPA 608 certification prep included - required for working with refrigerants',
      'Job security - HVAC systems need maintenance and repair year-round',
      'Start your own business or work for an established company',
    ],
    whatYouLearn: [
      'HVAC system components and operation',
      'Electrical testing and troubleshooting',
      'Refrigeration cycle fundamentals',
      'Equipment installation and repair',
      'Preventative maintenance practices',
      'Safety, EPA preparation, and customer communication',
    ],
    outcomes: [
      'HVAC Technician (entry-level)',
      'Maintenance Technician',
      'Building Operations Support',
    ],
    requirements: [
      'Career changers seeking a skilled trade',
      'Individuals who enjoy technical, hands-on work',
      'Adults needing a stable, high-demand job path',
      'Students preparing for apprenticeships or OJT',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=hvac-technician',
    },
    ctaSecondary: {
      label: 'Talk to a Career Coach',
      href: '/inquiry?program=hvac-technician',
    },
  },
  {
    slug: 'barber-apprenticeship',
    name: 'Barber Apprenticeship',
    heroTitle: 'Indiana Barber Apprenticeship - Earn While You Learn',
    heroSubtitle:
      'Get paid while you learn. Work in a real barbershop from day one, earning approximately $10/hour plus commissions while building your skills and clientele. Skip the $25,000 barber school debt. Graduate in 15-17 months ready to rent your own chair, work in a top shop, or open your own business.',
    shortDescription:
      'Get paid while you learn. Work in a real barbershop from day one, earning approximately $10/hour plus commissions while building your skills and clientele. Skip the $25,000 barber school debt. Graduate in 15-17 months ready to rent your own chair, work in a top shop, or open your own business.',
    longDescription:
      "The Indiana Barber Apprenticeship is a federally registered program allowing you to earn wages while training to become a licensed barber. Complete 2,000 hours of on-the-job training plus 144 hours of related instruction over 15-17 months.\n\nWhat You'll Learn:\n- Haircutting techniques: fades, tapers, lineups, beard work\n- Hot towel shaves and grooming\n- Sanitation and infection control\n- Client consultation and communication\n- Business management and shop operations\n- Building and maintaining clientele\n\nWho This Program Is For:\n- Individuals seeking a skilled trade career\n- Those who enjoy working with people\n- Adults needing stable, in-demand work\n- Career changers looking for entrepreneurial opportunities\n\nProgram Format:\n- Work at registered apprenticeship sponsor shop\n- Earn $10/hour base pay plus commissions and tips\n- Complete online theory coursework (3-4 hours/week)\n- Total time: 15-17 months\n\nFunding & Approvals:\n- WIOA Funding\n- Workforce Ready Grant\n- Job Ready Indy Funding for Justice-Involved Individuals\n- Employer sponsorship options\n- Self-pay with payment plans\n\nCareer Outcomes:\n- Indiana Registered Barber (licensed)\n- Chair rental - be your own boss\n- Barbershop employee with established clientele\n- Barbershop owner/entrepreneur\n- Earning potential: $35,000-$65,000+ per year",
    heroImage: '/images/pages/barber-hero-main.jpg',
    heroImageAlt:
      'Barber apprentice working with real clients in professional barbershop',
    heroVideo: 'https://cms-artifacts.artlist.io/content/generated-video-v1/video__3/video-7b329d1f-3f92-4ec5-acdf-9d2d7ff6de5f.mp4?Expires=2083752835&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=PwinNDJ~aDGbHoMI8-Hfr28QIj7s~0mwzn92P-muIHO0bW86~4gW6MzRyslLtk~TOzdfX8aTYA9OeGF-sbBPwCBUw8gTpXO6QvhwpJsFW5DiLHnEP6q6vCTvQ-jEpwV20izIuWVSpY-txGY7bDGHhkSq6-wP26b0J-lstFIMwxRHQjJ9rKmX9i4pzNruZJEQ2ILvO-LdWivm98j5TMLm09HgYzesifHFPPzUzNH7NlYwwvIO2-NtXWEuixrQFdJ2Zt4ocgdmqP9auvaeYr9hbS~F6k6CBybWLlnGoLggGkluqp1vFzt-eIslYgFKl8m4Du4UFJawNl3KmcyA9uTWtA__',
    duration: '15-17 months (2,000 hours)',
    clockHours: 2000,
    schedule: 'Full-time, based on barbershop placement',
    delivery:
      'On-the-job training in real barbershop + 144 hours technical instruction',
    credential:
      'Indiana Registered Barber License (upon passing state board exam)',
    approvals: [
      'U.S. Department of Labor Registered Apprenticeship',
      'Indiana House Bill 1135 & 1320 Approved',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'Job Ready Indy Funding Available',
    ],
    fundingOptions: [
      '100% Employer-Paid curriculum cost',
      'WIOA Funding',
      'Workforce Ready Grant',
      'Job Ready Indy Funding for Justice-Involved Individuals',
      'Earn $10/hour + commissions while training',
    ],
    highlights: [
      'Earn while you learn - get paid $10/hour plus commissions from day one',
      'Zero tuition - employers pay your curriculum cost',
      'Skip $25,000 barber school debt - graduate debt-free',
      'Build your clientele during training - graduate with customers who know you',
      'Real experience - 2,000 hours working with actual clients in professional shops',
      'Own your future - 73% of graduates own their chair or shop within 2 years',
      'Unlimited earning potential - licensed barbers earn $35k-$65k+ per year',
      'Multiple career paths - rent a chair, work for a shop, or open your own business',
    ],
    whatYouLearn: [
      'Haircutting: fades, tapers, lineups, beard work',
      'Hot towel shaves and grooming techniques',
      'Sanitation and infection control protocols',
      'Client consultation and communication',
      'Business management and shop operations',
      'Building and maintaining a clientele',
      'Customer service and professionalism',
      'Shop safety and regulatory compliance',
    ],
    outcomes: [
      'Indiana Registered Barber (licensed)',
      'Chair rental ($100-$300/week) - be your own boss',
      'Barbershop employee with established clientele',
      'Barbershop owner/entrepreneur',
      'Earning potential: $35,000-$65,000+ per year',
      '73% own chair or shop within 2 years',
    ],
    requirements: [
      'At least 17 years old',
      'High school diploma or GED',
      'Passion for working with people',
      'Willingness to commit to 2,000 training hours',
      'Reliable transportation to barbershop placement',
      'Professional attitude and appearance',
    ],
    ctaPrimary: {
      label: 'Apply & Enroll',
      href: '/programs/barber-apprenticeship/apply',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=barber-apprenticeship',
    },
    price: 4980, // Self-pay option price
  },
  {
    slug: 'cna-cert',
    averageSalary: '$35,000/year',
    salaryRange: '$28,000 - $42,000',
    jobGrowth: '+8% (Faster than average)',
    name: 'Certified Nursing Assistant (CNA)',
    heroTitle: 'CNA — Certified Nursing Assistant',
    heroSubtitle:
      'Start your healthcare career in just 4-8 weeks. Learn patient care from experienced nurses and get certified to work in hospitals, nursing homes, assisted living, or home health. Enjoy stable income, flexible schedules, and a clear path to becoming an LPN or RN.',
    shortDescription:
      'Start your healthcare career in just 4-8 weeks. Learn patient care from experienced nurses and get certified to work in hospitals, nursing homes, assisted living, or home health. Enjoy stable income, flexible schedules, and a clear path to becoming an LPN or RN.',
    longDescription:
      "The CNA program provides foundational patient care training through structured instruction and supported clinical experiences. Students learn essential caregiving skills, communication, infection prevention, and daily living support. This program is ideal whether you are starting a healthcare career, returning to the workforce, or preparing for advanced roles such as QMA, LPN, or RN.\n\nWhat You'll Learn:\n- Vital signs and patient monitoring\n- Infection prevention and safety\n- Activities of daily living (ADLs)\n- Mobility, transfers, and comfort care\n- Professional communication and ethics\n\nWho This Program Is For:\n- Individuals who enjoy helping others\n- Students exploring healthcare careers\n- Adults needing stable, in-demand work\n- Anyone preparing for nursing pathways\n\nProgram Format:\n- Classroom + clinicals\n- Length: 4–8 weeks\n- Schedule: Day, evening, or weekend options\n\nFunding & Approvals:\n- Partner-delivered through an approved CNA training provider\n- Workforce funding may be available\n\nCareer Outcomes:\n- Certified Nursing Assistant\n- Patient Care Technician (with additional training)\n- Home Health Aide",
    heroImage: '/images/pages/cna-clinical.jpg',
    heroImageAlt: 'CNA student practicing caregiving skills with an instructor',
    heroVideo: '/videos/cna-hero.mp4',
    duration: '4–8 weeks',
    clockHours: 105,
    schedule: 'Day, evening, or weekend options',
    delivery: 'Classroom + clinicals',
    credential:
      'CNA certification eligibility (state-approved program)',
    approvals: [
      'State-Approved CNA Program',
      'Indiana State Board of Health Approved',
    ],
    fundingOptions: [
      'Self-Pay Program',
      'Payment plans available',
      'State-approved clinical training',
    ],
    highlights: [
      'Get certified in just 4-8 weeks - fastest path to healthcare',
      'Stable income and flexible schedules - work the hours that fit your life',
      'High demand - healthcare facilities are always hiring CNAs',
      'Clear advancement path - many CNAs become LPNs or RNs',
      'Hands-on clinical experience with real patients',
      'Job placement support with local hospitals and care facilities',
    ],
    whatYouLearn: [
      'Vital signs and patient monitoring',
      'Infection prevention and safety',
      'Activities of daily living (ADLs)',
      'Mobility, transfers, and comfort care',
      'Professional communication and ethics',
    ],
    outcomes: [
      'Certified Nursing Assistant',
      'Patient Care Technician (with additional training)',
      'Home Health Aide',
    ],
    requirements: [
      'Individuals who enjoy helping others',
      'Students exploring healthcare careers',
      'Adults needing stable, in-demand work',
      'Anyone preparing for nursing pathways',
    ],
    ctaPrimary: {
      label: 'Enroll Now - $1,200',
      href: '/apply?program=cna-certification',
    },
    ctaSecondary: {
      label: 'Talk to Healthcare Career Coach',
      href: '/inquiry?program=cna-certification',
    },
    price: 1200,
    downPayment: 200,
    weeklyPayment: 50,
    paymentWeeks: 20,
    fundingType: 'self-pay',
    paymentPlan: {
      totalPrice: 1200,
      downPayment: 200,
      remainingBalance: 1000,
      weeklyPayment: 50,
      numberOfWeeks: 20,
      description: '$200 down payment + $50/week for 20 weeks',
    },
  },
  {
    slug: 'cdl-training',
    name: "Commercial Driver's License (CDL)",
    heroTitle: 'CDL — Commercial Driver Training',
    heroSubtitle:
      "Get your Commercial Driver's License and start earning $50,000-$70,000+ per year. Professional CDL training prepares you for Class A or Class B licensing in just weeks. Trucking companies are desperate for drivers—many offer sign-on bonuses, benefits, and tuition reimbursement.",
    shortDescription:
      "Get your Commercial Driver's License and start earning $50,000-$70,000+ per year. Professional CDL training prepares you for Class A or Class B licensing in just weeks. Trucking companies are desperate for drivers—many offer sign-on bonuses, benefits, and tuition reimbursement.",
    longDescription:
      "The CDL program builds the knowledge and skills required to safely operate commercial vehicles. Students receive classroom instruction along with hands-on yard and road training. This pathway is ideal for adults seeking stable income, benefits, and long-term growth in logistics and transportation.\n\nWhat You'll Learn:\n- Vehicle inspection and safety\n- Backing, shifting, turning, and road maneuvers\n- Trip planning and hours-of-service rules\n- Transportation regulations\n- Professional communication and job readiness\n\nWho This Program Is For:\n- Adults seeking high-earning roles\n- Individuals interested in transportation careers\n- Career changers needing a stable job pathway\n- Students who want a quick employment route\n\nProgram Format:\n- Classroom, yard practice, and road training\n- Length: Varies by partner\n- Schedule: Day/evening options\n\nFunding & Approvals:\n- Workforce funding options may be available\n- Employer reimbursement programs may apply\n\nCareer Outcomes:\n- CDL Class A or B Driver\n- Local, regional, or dedicated routes\n- Logistics and transportation support roles",
    heroImage: '/images/pages/cdl-truck-highway.jpg',
    heroImageAlt: 'CDL student practicing with a commercial truck',
    heroVideo: '/videos/cdl-hero.mp4',
    duration: 'Varies by partner',
    schedule: 'Day/evening options',
    delivery: 'Classroom, yard practice, and road training',
    credential: 'CDL Class A license eligibility upon completion',
    approvals: [
      'Workforce funding options may be available',
      'Employer reimbursement programs may apply',
    ],
    fundingOptions: [
      'Workforce funding options may be available',
      'Employer reimbursement programs may apply',
    ],
    highlights: [
      'High earning potential - start at $50k-$70k+ per year',
      'Extreme demand - trucking companies are desperate for qualified drivers',
      'Sign-on bonuses - many companies offer $5,000-$10,000 bonuses',
      'Excellent benefits - health insurance, retirement, paid time off',
      'Behind-the-wheel training with experienced professional drivers',
      'Job placement assistance - we connect you with hiring carriers',
      'Multiple career paths - local routes, regional, or long-haul',
      'Tuition reimbursement - many employers will pay back your training costs',
    ],
    whatYouLearn: [
      'Vehicle inspection and safety',
      'Backing, shifting, turning, and road maneuvers',
      'Trip planning and hours-of-service rules',
      'Transportation regulations',
      'Professional communication and job readiness',
    ],
    outcomes: [
      'CDL Class A or B Driver',
      'Local, regional, or dedicated routes',
      'Logistics and transportation support roles',
    ],
    requirements: [
      'Adults seeking high-earning roles',
      'Individuals interested in transportation careers',
      'Career changers needing a stable job pathway',
      'Students who want a quick employment route',
    ],
    ctaPrimary: {
      label: 'Apply for CDL Training',
      href: '/apply?program=cdl-training',
    },
    ctaSecondary: {
      label: 'Request CDL Info Session',
      href: '/inquiry?program=cdl-training',
    },
  },
  {
    slug: 'building-maintenance-wrg',
    name: 'Building Maintenance Technician',
    heroTitle:
      '2Exclusive Apprenticeship Program - Advanced Sanitation & Infection Control',
    heroSubtitle:
      'Specialized training for sanitation and infection control in high-risk environments: hospitals, military bases, and government facilities',
    shortDescription:
      'Hands-on apprenticeship in OSHA compliance, holistic wellness cleaning, hazardous waste management, and infection control for critical sectors',
    longDescription:
      'The 2Exclusive Apprenticeship Program is a specialized training initiative focused on equipping participants with the advanced skills required for sanitation and infection control in high-risk environments such as hospitals, military bases, and government facilities. This program offers hands-on experience and in-depth training in areas such as OSHA compliance, holistic wellness cleaning, hazardous waste management, and infection control protocols.\n\nApprentices will gain expertise in safely handling hazardous materials, implementing eco-friendly cleaning practices, and ensuring regulatory compliance, all while promoting healthier and safer environments. With a strong emphasis on both technical proficiency and holistic well-being, this apprenticeship prepares participants to meet the unique demands of critical sectors, ensuring a highly skilled workforce ready to tackle the challenges of modern sanitation and safety.\n\nAll faculty members possess at least three to five years of professional experience in military or institutional cleaning. Instructors hold valid safety and compliance certifications such as OSHA 10/30, HAZMAT, or Certified Environmental Technician credentials, and demonstrate strong expertise in infection control, regulatory compliance, and holistic wellness cleaning practices.\n\nCredentialing Partners:\n• CareerSafe - OSHA 10/30 Safety Certification (https://careersafeonline.com)\n• U.S. Department of Labor - OSHA Training (https://osha.gov)\n• Certified Environmental Technician Programs\n• HAZMAT Certification Bodies\n\nCIP Code: 15.0501 - Heating, Ventilation, Air Conditioning and Refrigeration Engineering Technology/Technician',
    heroImage: '/images/pages/hvac-tools.jpg',
    heroImageAlt:
      'Sanitation technician in protective equipment working in healthcare facility',
    heroVideo: '/videos/hvac-hero-final.mp4',
    duration: 'Varies by apprenticeship track',
    schedule: 'Quarterly cohorts (January, April, July, October)',
    delivery: 'Hands-on apprenticeship with classroom instruction',
    credential:
      'OSHA 10/30, HAZMAT, Certified Environmental Technician, Infection Control Specialist',
    approvals: [
      'ETPL Approved',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'CIP Code: 15.0501',
      'Registered Apprenticeship Program',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Employer-sponsored apprenticeship',
    ],
    highlights: [
      'Specialized training for high-risk environments',
      'OSHA 10/30 safety certifications',
      'HAZMAT and hazardous waste management',
      'Infection control protocols for hospitals and military',
      'Holistic wellness cleaning practices',
      'Eco-friendly and sustainable cleaning techniques',
      'Regulatory compliance expertise',
      'Quarterly cohort start dates',
      'Hands-on experience in critical sectors',
    ],
    whatYouLearn: [
      'OSHA compliance and workplace safety standards',
      'Infection control protocols and procedures',
      'Hazardous materials handling and disposal',
      'HAZMAT safety and emergency response',
      'Holistic wellness cleaning practices',
      'Eco-friendly and sustainable cleaning techniques',
      'Regulatory compliance for healthcare and government facilities',
      'Bloodborne pathogens and biohazard management',
      'Personal protective equipment (PPE) usage',
      'Documentation and reporting requirements',
    ],
    outcomes: [
      'Sanitation Specialist in hospitals and healthcare',
      'Military base environmental services',
      'Government facility cleaning and maintenance',
      'Infection control technician',
      'Environmental services supervisor',
      'HAZMAT response team member',
      'Certified Environmental Technician',
      'Average salary: $35,000-$55,000/year',
    ],
    requirements: [
      'High school diploma or equivalent required',
      'Willingness to learn infection control and sanitation procedures',
      'Interest in eco-friendly cleaning techniques',
      'Prior experience in janitorial, environmental services, or healthcare cleaning preferred but not required',
      'Background check required',
      'OSHA 10 or OSHA 30 certification completed during program',
      'Application deadline: Apply at least 30 days before desired start date',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=building-maintenance-tech',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=building-maintenance-tech',
    },
  },
  {
    slug: 'beauty-career-educator',
    name: 'Beauty and Career Educator Training',
    heroTitle: 'Beauty and Career Educator Training Program',
    heroSubtitle:
      '12-week hybrid program preparing aspiring beauty professionals and peer educators',
    shortDescription:
      'Comprehensive training combining salon services, peer teaching, entrepreneurship, and workforce readiness',
    longDescription:
      'The Beauty & Career Educator Training Program offered by Elevate for Humanity is a 12-week hybrid training experience designed to help aspiring beauty professionals and peer educators develop career-ready, technical, and leadership skills. This program includes practical salon service education (manicuring techniques, customer service, sanitation), instructional tools for peer teaching and community workshops, and a strong focus on entrepreneurship and workforce readiness.\n\nParticipants earn a nationally recognized Rise Up Credential (https://riseup.com), a Career Readiness Certificate, and a custom Certificate of Completion. Designed for youth and adults ages 16+, this program is aligned with workforce demand for independent contractors, salon educators, and business owners.\n\nCredentialing Partners:\n• Rise Up - Career Readiness Certification (https://riseup.com)\n• American Red Cross - CPR/First Aid (https://redcross.org)\n• CareerSafe - OSHA 10 Safety Certification (https://careersafeonline.com)\n\nCIP Code: 13.1319 - Technical Teacher Education',
    heroImage: '/images/pages/barber-styling-hair.jpg',
    heroImageAlt: 'Beauty educator training students in salon techniques',
    heroVideo: '/videos/beauty-cosmetology.mp4',
    duration: '12 weeks (84 days)',
    schedule: 'Hybrid - Flexible scheduling with monthly/quarterly cohorts',
    delivery:
      'Hybrid - Online coursework + In-person practical training and workshops',
    credential:
      'Rise Up Credential, Career Readiness Certificate, CPR/First Aid, OSHA 10, Certificate of Completion',
    approvals: [
      'ETPL Approved - Program ID #10004648',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'CIP Code: 13.1319',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Self-Pay: $4,730',
    ],
    highlights: [
      'Nationally recognized Rise Up Credential',
      'CPR/First Aid and OSHA 10 certifications',
      'Practical salon service education (manicuring, customer service, sanitation)',
      'Peer teaching and community workshop skills',
      'Entrepreneurship and business ownership training',
      'Career readiness and workforce development',
      'Rolling admissions - start year-round',
    ],
    whatYouLearn: [
      'Manicuring techniques and nail care services',
      'Customer service excellence in salon settings',
      'Infection control and sanitation protocols',
      'Peer teaching and instructional methods',
      'Community workshop facilitation',
      'CPR and First Aid emergency response',
      'OSHA 10 workplace safety standards',
      'Entrepreneurship and business planning',
      'Career development and workforce readiness',
      'Leadership and mentorship skills',
    ],
    outcomes: [
      'Independent contractor in beauty services',
      'Salon educator and trainer',
      'Beauty business owner',
      'Peer educator and community workshop facilitator',
      'Career coach in beauty industry',
      'Average salary: $35,000-$55,000/year',
      'Flexible self-employment opportunities',
    ],
    requirements: [
      'At least 16 years of age',
      'High school diploma, GED, or equivalent',
      'Youth applicants may enroll with parental/guardian permission and school approval',
      'No prior nail or beauty experience required',
      'Complete brief orientation and program readiness screening',
      'Application deadline: Rolling admissions (apply at least 2 weeks before start date for priority consideration)',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=beauty-career-educator',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=beauty-career-educator',
    },
    price: 4730,
  },
  {
    slug: 'business-startup',
    name: 'Business Start-up & Marketing',
    heroTitle: 'Business Start-up & Marketing Program with Rise Forward',
    heroSubtitle:
      '5-week intensive program to launch your business with mentorship, stipend, and laptop kit',
    shortDescription:
      'Hands-on entrepreneurship training with LLC formation, digital marketing, and real-world startup support',
    longDescription:
      "The Business Start-Up & Marketing Program with Rise Forward equips participants with hands-on skills to launch their own business ventures. Students will learn the fundamentals of entrepreneurship, digital marketing, LLC formation, business planning, customer service, and resume development. The program includes guided startup support, mentorship, and ends with a business match stipend and laptop kit to empower real-world implementation. Ideal for youth ready to explore self-employment and leadership pathways in today's economy.\n\nIn just 5 weeks, you'll gain industry-recognized certifications in retail operations and marketing, learn how to create a business plan, develop marketing strategies, form an LLC, and build your professional image and online presence. This program is designed for aspiring entrepreneurs ages 16+ who want to launch their own business or advance in retail management.\n\nCredentialing Partners:\n• National Retail Federation (NRF) - Business of Retail Certified Specialist (https://nrf.com)\n• National Retail Federation (NRF) - Retail Industry Fundamentals Specialist (https://nrf.com)\n• Rise Forward Foundation - Business Development Support (https://riseforwardfoundation.org)\n\nProgram Benefits:\n• Business match stipend upon completion\n• Laptop kit for business operations\n• One-on-one mentorship\n• LLC formation guidance\n• Professional resume development\n\nCIP Code: 52.0701 - Entrepreneurship/Entrepreneurial Studies",
    heroImage: '/images/pages/business-sector.jpg',
    heroImageAlt: 'Young entrepreneur planning business strategy',
    heroVideo: '/videos/partner-business.mp4',
    duration: '5 weeks',
    schedule: 'Quarterly cohorts - Flexible scheduling options',
    delivery: 'Hybrid - Online coursework + In-person workshops and mentorship',
    credential:
      'Business of Retail Certified Specialist (NRF), Retail Industry Fundamentals Specialist (NRF), Certificate of Completion',
    approvals: [
      'ETPL Approved - Program ID #10004645',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'CIP Code: 52.0701',
      'Rise Forward Partnership',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Self-Pay: $4,550',
      'Includes business match stipend and laptop kit',
    ],
    highlights: [
      'Industry-recognized NRF retail certifications',
      'LLC formation and business registration',
      'Digital marketing and social media strategies',
      'Business match stipend upon completion',
      'Free laptop kit for business operations',
      'One-on-one mentorship and startup support',
      'Resume and professional image development',
      'Fast 5-week completion',
    ],
    whatYouLearn: [
      'Business planning and strategy development',
      'LLC formation and business registration',
      'Retail operations and management',
      'Digital marketing fundamentals',
      'Social media marketing and content creation',
      'Customer service excellence',
      'Financial planning and budgeting',
      'Sales techniques and customer acquisition',
      'Resume building and professional branding',
      'Online presence and website basics',
    ],
    outcomes: [
      'Launch your own business with LLC',
      'Retail management positions',
      'Marketing coordinator roles',
      'Small business owner/entrepreneur',
      'E-commerce business operator',
      'Average salary: $35,000-$60,000/year',
      'Self-employment income potential varies',
    ],
    requirements: [
      'Ages 16 and up',
      'No previous business experience required',
      'Basic reading and writing skills',
      'Comfortable using a computer',
      'Entrepreneurial mindset and eagerness to learn',
      'Complete short intake interview',
      'Application deadline: Apply at least 2 weeks before cohort start date',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=business-startup-marketing',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=business-startup-marketing',
    },
    price: 4550,
  },
  {
    slug: 'health-safety',
    name: 'Emergency Health & Safety Technician',
    heroTitle: 'Emergency Health & Safety Technician Registered Apprenticeship',
    heroSubtitle:
      '4-week hybrid program preparing life-saving responders for schools, workplaces, and emergency settings',
    shortDescription:
      'Comprehensive training with CPR/AED, First Aid, EMR, and OSHA 10 certifications for healthcare and public safety careers',
    longDescription:
      "The Emergency Health and Safety Technician Registered Apprenticeship program prepares individuals for life-saving response roles in schools, workplaces and emergency settings. This hybrid training includes CPR/AED, First Aid, OSHA-aligned safety education, and public health emergency awareness. Students graduate with nationally recognized certifications and are equipped for careers in healthcare, public safety, community response, and entry-level emergency technician pathways.\n\nIn just 4 weeks, you'll earn multiple industry-recognized certifications including Emergency Medical Responder (EMR), CPR/AED, First Aid, and OSHA 10. This fast-paced program combines classroom instruction with hands-on emergency response training, preparing you to save lives and ensure workplace safety.\n\nAll instructors hold CPR/AED & First Aid Instructor certification from the American Heart Association, Red Cross, or equivalent nationally recognized body. Instructors have a minimum of 2 years of experience in occupational safety, healthcare, or public safety.\n\nCredentialing Partners:\n• American Heart Association (AHA) - CPR/AED/First Aid (https://cpr.heart.org)\n• American Red Cross - CPR/AED/First Aid (https://redcross.org)\n• National Registry of Emergency Medical Technicians (NREMT) - EMR Certification (https://nremt.org)\n• CareerSafe - OSHA 10 Safety Certification (https://careersafeonline.com)\n\nCIP Code: 51.0999 - Allied Health Diagnostic, Intervention, and Treatment Professions",
    heroImage: '/images/pages/cna-patient-care.jpg',
    heroImageAlt: 'Emergency medical responder providing care',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: '4 weeks',
    schedule: 'Monthly cohorts - Full-time intensive',
    delivery: 'Hybrid - Online theory + In-person hands-on skills training',
    credential:
      'Emergency Medical Responder (EMR), CPR/AED/First Aid, OSHA 10 - Career Safe',
    approvals: [
      'ETPL Approved - Program ID #10004621',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'CIP Code: 51.0999',
      'Registered Apprenticeship Program',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Self-Pay: $4,950',
    ],
    highlights: [
      'Registered Apprenticeship program',
      'Emergency Medical Responder (EMR) certification',
      'CPR/AED and First Aid certified',
      'OSHA 10 workplace safety certification',
      'Public health emergency awareness training',
      'Fast 4-week completion',
      'Monthly cohort start dates',
      'High-demand career field',
      'Pathways to healthcare and public safety careers',
    ],
    whatYouLearn: [
      'Emergency medical response procedures',
      'CPR and AED operation for all ages',
      'First aid and trauma care',
      'Patient assessment and triage',
      'OSHA 10 workplace safety standards',
      'Emergency scene management and safety',
      'Public health emergency response',
      'Medical terminology and documentation',
      'Communication with EMS professionals',
      'Infection control and bloodborne pathogens',
    ],
    outcomes: [
      'Emergency Medical Responder (EMR)',
      'School safety coordinator',
      'Workplace safety officer',
      'First responder positions',
      'Community health worker',
      'Security and safety roles',
      'Entry-level emergency technician',
      'Healthcare support positions',
      'Average salary: $35,000-$45,000/year',
    ],
    requirements: [
      'High school diploma or GED required for national certification',
      '18 years or older',
      'Able to read and follow written and verbal instructions',
      'Physical ability to perform emergency response duties',
      'No previous medical training required',
      'Background check required',
      'Application deadline: Apply 2 weeks prior to preferred start date',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=emergency-health-safety-tech',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=emergency-health-safety-tech',
    },
    price: 4950,
  },
  {
    slug: 'esthetician',
    name: 'Esthetics and Skincare Specialist Certificate',
    heroTitle: 'Esthetics and Skincare Specialist Certificate Program',
    heroSubtitle:
      '5-week accelerated non-licensure training for job-ready skills in the high-demand personal care industry',
    shortDescription:
      'Comprehensive skincare training with hands-on practice, business startup support, and career readiness for spas, salons, and mobile beauty services',
    longDescription:
      "The Esthetics and Skincare Specialist Certificate Program prepares individuals to enter the high-demand personal care industry with job-ready skills in skin analysis, facial treatments, hair removal, sanitation, customer service, and product knowledge. This comprehensive non-licensure training blends hands-on instruction with theory-based modules, empowering students to build confidence in a professional spa setting. This course also offers traditional wrap-around support including career readiness, business startup training, wellness coaching and access to employer networks.\n\nParticipants gain practical experience through simulated treatments using industry-standard tools and techniques, including exfoliation, hydration, facial massage, brow shaping, and makeup fundamentals. The program emphasizes infection control, client communication, and proper documentation, aligned with industry expectations. Career readiness, digital professionalism, and entrepreneurship fundamentals are also integrated to support students' long-term success in both employment and independent service delivery.\n\nInstructors must have a minimum of 2 years of industry experience in esthetics, skincare services, or cosmetic therapy. While state licensure is not required for this non-licensure certificate program, preference is given to instructors who hold certifications in esthetics, dermatological skincare, or equivalent areas. Faculty demonstrate experience in adult learning, virtual instruction, and hands-on practical training.\n\nThis program is ideal for individuals seeking a flexible, accelerated pathway to employment in spas, salons, medi-aesthetic offices, or mobile beauty services. Upon completion, graduates receive a Certificate of Completion, qualify for placement support, and may pursue advanced or specialized training, apprenticeships, or entrepreneurial ventures.\n\nCredentialing Partners:\n• National Retail Federation (NRF) - Business of Retail Certified Specialist (https://nrf.com)\n• National Retail Federation (NRF) - Customer Service and Sales Certified Specialist (https://nrf.com)\n• CareerSafe - OSHA 10 Safety Certification (https://careersafeonline.com)\n\nCIP Code: 12.0409 - Aesthetician/Esthetician and Skin Care Specialist",
    heroImage: '/images/pages/barber-apprentice-learning.jpg',
    heroImageAlt: 'Esthetician performing professional facial treatment',
    heroVideo: '/videos/esthetician-spa.mp4',
    duration: '5 weeks',
    schedule: 'Monthly enrollment - Flexible hybrid scheduling',
    delivery:
      'Hybrid - Theory-based online modules + Hands-on practical training',
    credential:
      'Certificate of Completion, Business of Retail Certified Specialist (NRF), Customer Service and Sales Certified Specialist (NRF), OSHA 10',
    approvals: [
      'ETPL Approved - Program ID #10004628',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'CIP Code: 12.0409',
      'Non-Licensure Certificate Program',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Self-Pay: $4,575',
    ],
    highlights: [
      'Non-licensure certificate program - no state license required',
      'Hands-on practice with industry-standard tools',
      'NRF retail and customer service certifications',
      'OSHA 10 workplace safety certification',
      'Business startup training and entrepreneurship support',
      'Career readiness and digital professionalism',
      'Wellness coaching and wrap-around support',
      'Access to employer networks and placement support',
      'Fast 5-week completion',
      'Monthly enrollment opportunities',
    ],
    whatYouLearn: [
      'Skin analysis and assessment techniques',
      'Facial treatments and procedures',
      'Exfoliation and hydration techniques',
      'Facial massage and lymphatic drainage',
      'Hair removal (waxing, tweezing, brow shaping)',
      'Makeup fundamentals and application',
      'Infection control and sanitation protocols',
      'Client consultation and communication',
      'Product knowledge and recommendations',
      'Retail operations and sales techniques',
      'Customer service excellence',
      'OSHA workplace safety standards',
      'Business startup and entrepreneurship basics',
      'Digital professionalism and online presence',
      'Proper documentation and record keeping',
    ],
    outcomes: [
      'Esthetician in spas and salons',
      'Skincare specialist in medi-aesthetic offices',
      'Mobile beauty service provider',
      'Retail beauty consultant',
      'Spa treatment specialist',
      'Independent skincare entrepreneur',
      'Beauty product sales representative',
      'Average salary: $30,000-$50,000/year plus commissions',
      'Self-employment income potential varies',
    ],
    requirements: [
      'At least 16 years old',
      'High school diploma or equivalent',
      'Strong interest in skincare, wellness, or beauty industry',
      'No prior licensure required',
      'Basic reading comprehension and computer literacy',
      'Ability to access hybrid online modules',
      'Interview may be required to assess program readiness',
      'Application deadline: Apply at least 2 weeks before next session',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=professional-esthetician',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=professional-esthetician',
    },
    price: 4575,
  },
  {
    slug: 'peer-recovery-specialist-jri',
    name: 'Public Safety Reentry Specialist',
    heroTitle: 'Public Safety Reentry Specialist Program',
    heroSubtitle:
      '45-day inclusive program for peer support, recovery coaching, and reentry navigation - welcoming all backgrounds',
    shortDescription:
      'Accessible training for justice-involved individuals, career changers, and those with lived experience to become certified peer recovery coaches',
    longDescription:
      "The Public Safety Reentry Specialist Program prepares you to support individuals reentering society after incarceration or overcoming substance use challenges. In 45 days, you'll earn multiple certifications including Certified Peer Recovery Coach (CPRC), Certified Peer Support Professional, Certified Community Healthcare Worker (CCHW), CPR, and Rise Up career readiness. This program combines lived experience with professional training to help you make a meaningful impact in your community.\n\nThis program is designed to be inclusive and accessible to all learners—regardless of age, background, or education level. It welcomes youth ages 16+, adults seeking career change, justice-involved individuals reentering the workforce, and those receiving support through SNAP, WIOA, or other public assistance programs. No prior credential or diploma is required for enrollment. We provide built-in support, including tutoring, digital literacy training, and guided instruction to ensure all participants have the tools they need to succeed.\n\nInstructors hold Certified Peer Recovery Specialist (CPRS) credentials or equivalent, with subject matter experience in reentry, public safety, peer navigation, or crisis response. Program leadership holds credentials in trauma-informed coaching, CPR/AED instruction, and lived-experience mentorship for justice-impacted individuals.\n\nCredentialing Partners:\n• Indiana Certification Board (ICB) - Certified Peer Recovery Coach (CPRC) (https://indianacertificationboard.org)\n• National Alliance of Peer Specialists - Certified Peer Support Professional (https://na4ps.org)\n• Certified Community Healthcare Worker (CCHW) Programs\n• American Heart Association - CPR/AED (https://cpr.heart.org)\n• Rise Up - Career Readiness Certification (https://riseup.com)\n\nCIP Code: 43.0112 - Securities Services Administration/Management",
    heroImage: '/images/pages/career-counseling.jpg',
    heroImageAlt: 'Peer recovery coach providing support and mentorship',
    heroVideo: '/videos/career-services-hero.mp4',
    duration: '45 days (6-7 weeks)',
    schedule: 'Year-round enrollment - First come, first served',
    delivery:
      'Hybrid - Online coursework + In-person training with built-in support',
    credential:
      'Certified Peer Recovery Coach (CPRC), Certified Peer Support Professional, Certified Community Healthcare Worker (CCHW), CPR, Rise Up Certificate',
    approvals: [
      'ETPL Approved - Program ID #10004666',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'SNAP Eligible',
      'CIP Code: 43.0112',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'SNAP Support',
      'Public Assistance Programs',
      'Self-Pay: $4,750',
    ],
    highlights: [
      'Inclusive and accessible to all backgrounds',
      'No prior credential or diploma required',
      'Built-in support: tutoring, digital literacy, guided instruction',
      'Certified Peer Recovery Coach (CPRC) credential',
      'Certified Peer Support Professional',
      'Community Healthcare Worker (CCHW) certification',
      'CPR and Rise Up certifications',
      'Trauma-informed coaching approach',
      'Lived-experience mentorship',
      'Year-round enrollment',
      'Justice-involved individuals welcome',
    ],
    whatYouLearn: [
      'Peer support principles and ethics',
      'Recovery coaching techniques',
      'Trauma-informed care and crisis response',
      'Reentry navigation and public safety',
      'Crisis intervention and de-escalation',
      'Community healthcare navigation',
      'CPR and First Aid emergency response',
      'Case management basics',
      'Motivational interviewing',
      'Resource coordination and advocacy',
      'Professional boundaries and self-care',
      'Documentation and confidentiality',
    ],
    outcomes: [
      'Certified Peer Recovery Coach',
      'Public safety reentry specialist',
      'Community healthcare worker',
      'Peer support specialist',
      'Substance use counselor assistant',
      'Case management support',
      'Crisis response team member',
      'Reentry navigator',
      'Average salary: $35,000-$48,000/year',
    ],
    requirements: [
      'Ages 16+ welcome',
      'No prior credential or diploma required',
      'Open to justice-involved individuals reentering workforce',
      'Open to SNAP, WIOA, and public assistance recipients',
      'Lived experience with recovery or reentry valued',
      'Commitment to helping others',
      'Background check required',
      'Stable in recovery (if applicable)',
      'Built-in support provided: tutoring, digital literacy, guided instruction',
      'Application deadline: Year-round enrollment, first come first served',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=certified-peer-recovery-coach',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=certified-peer-recovery-coach',
    },
    price: 4750,
  },
  {
    slug: 'tax-prep',
    name: 'Tax Preparation & Financial Services Certificate',
    heroTitle: 'Tax Preparation & Financial Services Certificate Program',
    heroSubtitle:
      'Start your own tax business or work for a firm in just 10 weeks. Get IRS VITA/TCE certified, learn QuickBooks and Microsoft 365, and gain real experience preparing taxes at an IRS-approved site. Earn $40,000-$60,000+ per year during tax season, with flexibility to work year-round or seasonally.',
    shortDescription:
      'Start your own tax business or work for a firm in just 10 weeks. Get IRS VITA/TCE certified, learn QuickBooks and Microsoft 365, and gain real experience preparing taxes at an IRS-approved site. Earn $40,000-$60,000+ per year during tax season, with flexibility to work year-round or seasonally.',
    longDescription:
      "The Tax Preparation & Financial Services Certificate prepares individuals to understand federal and state taxation concepts and apply them in real-world settings. Participants complete training in tax law, return preparation, bookkeeping, and financial literacy, culminating in the IRS VITA/TCE certification. The program combines classroom instruction, online modules, and supervised practicum hours at an IRS-approved VITA site. Graduates gain the skills required for employment as Tax Preparers, Bookkeeping Assistants, and Financial Service Specialists in both private and community-based environments.\n\nThrough the IRS Link & Learn platform and Elevate for Humanity's financial training curriculum, students master key competencies in individual taxation, ethics, client intake, and electronic filing, while also building transferable skills in business communication, budgeting, and entrepreneurship.\n\nElevate for Humanity is an IRS VITA/TCE Approved Site, Indiana ETPL Approved Training Provider, SAM.gov Active Entity, E-Verify Employer, and Authorized IRS e-file provider. All instructors hold a 2-year degree from a credentialed institution or 2 years of relevant experience in tax preparation or financial services.\n\nCredentialing Partners:\n• Internal Revenue Service (IRS) - VITA/TCE Certification (https://irs.gov/vita)\n• IRS Link & Learn Taxes Platform (https://apps.irs.gov/app/vita/)\n• Intuit - QuickBooks Pro Advisor (https://quickbooks.intuit.com/accountants/)\n• Microsoft - Microsoft 365 Fundamentals (https://microsoft.com/learn)\n• Rise Up - Career Readiness Certification (https://riseup.com)\n\nCIP Code: 52.0302 - Accounting Technology/Technician and Bookkeeping",
    heroImage: '/images/pages/tax-preparation.jpg',
    heroImageAlt: 'Tax preparer assisting client with tax return',
    heroVideo: '/videos/tax-career-paths.mp4',
    duration: '10 weeks',
    schedule:
      'Seasonal cohorts: November, January, March (aligned with tax season)',
    delivery:
      'Hybrid - Classroom instruction + Online IRS modules + Supervised practicum at IRS-approved VITA site',
    credential:
      'IRS VITA/TCE Certification, QuickBooks Pro Advisor, Microsoft 365 Fundamentals, Rise Up Certificate, Certificate of Completion',
    approvals: [
      'ETPL Approved - Program ID #10004627',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'IRS VITA/TCE Approved Site',
      'SAM.gov Active Entity',
      'Authorized IRS e-file Provider',
      'CIP Code: 52.0302',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Self-Pay: $4,750',
    ],
    highlights: [
      'IRS VITA/TCE certification',
      'Supervised practicum at IRS-approved VITA site',
      'IRS Link & Learn platform training',
      'QuickBooks Pro Advisor certification',
      'Microsoft 365 Fundamentals certification',
      'Rise Up career readiness certificate',
      'Authorized IRS e-file provider training',
      'Real-world tax preparation experience',
      'Business communication and entrepreneurship skills',
      'Seasonal cohorts aligned with tax season',
      'Year-round and seasonal employment opportunities',
    ],
    whatYouLearn: [
      'Federal and state tax law and regulations',
      'Individual tax return preparation',
      'IRS Link & Learn Taxes platform',
      'TaxSlayer Pro software (IRS-approved)',
      'Client intake and interview techniques',
      'Electronic filing (e-file) procedures',
      'Tax ethics and professional standards',
      'QuickBooks accounting software',
      'Microsoft 365 applications (Excel, Word, Outlook)',
      'Bookkeeping and financial record keeping',
      'Financial literacy via Intuit for Education (free)',
      'Budgeting, credit management, and savings',
      'Business communication skills',
      'Entrepreneurship fundamentals',
      'Client consultation and service',
    ],
    outcomes: [
      'IRS VITA/TCE certified tax preparer',
      'Tax preparation specialist',
      'Bookkeeping assistant',
      'Financial services representative',
      'Accounting technician',
      'Start your own tax preparation business',
      'Community-based tax preparer',
      'Average salary: $35,000-$55,000/year',
      'Seasonal income potential: $15,000-$30,000 during tax season',
    ],
    requirements: [
      '18 years or older',
      'High school diploma or equivalent preferred',
      'Basic reading, writing, and computer skills',
      'Complete short intake interview',
      'Pass basic math and reading assessment',
      'No prior tax experience required',
      'Application deadline: Apply at least 1 week before cohort start date',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=tax-prep-financial-services',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=tax-prep-financial-services',
    },
    price: 4750,
  },
  {
    slug: 'phlebotomy-technician',
    name: 'Phlebotomy Technician Certification',
    heroTitle: 'Phlebotomy Technician Certification Program',
    heroSubtitle: '6-week program to become a certified Phlebotomy Technician',
    shortDescription:
      'Comprehensive phlebotomy training with hands-on clinical experience, national certification, and job placement assistance',
    longDescription:
      "The Phlebotomy Technician Certification program prepares you for a rewarding career in healthcare by teaching you the essential skills of blood collection and specimen processing. In just 6 weeks, you'll master venipuncture techniques, capillary puncture, specimen handling, and patient care. This program includes classroom instruction, hands-on lab practice, and a clinical externship at a real healthcare facility.\n\nYou'll earn your Certified Phlebotomy Technician (CPT) credential, CPR certification, and complete OSHA-compliant safety training through our HSI partnership, including bloodborne pathogens and infection control. Our program meets all requirements for national certification and prepares you for immediate employment in hospitals, clinics, laboratories, and blood donation centers.\n\nWith high demand for phlebotomists nationwide and excellent job growth projections, this is your opportunity to enter the healthcare field quickly with a valuable, portable credential. Our graduates work in diverse settings including hospitals, diagnostic laboratories, physician offices, blood banks, and mobile phlebotomy services.\n\nPartner Integration:\n• HSI (Health & Safety Institute) - Bloodborne Pathogens, Infection Control, CPR/AED\n• CPT Certification Exam — administered on-site at Elevate\n• Clinical externship sites - Local hospitals and laboratories\n\nCIP Code: 51.1009 - Phlebotomy Technician/Phlebotomist",
    heroImage: '/images/pages/phlebotomy-draw.jpg',
    heroImageAlt: 'Phlebotomy technician drawing blood from patient',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: '6 weeks (120 hours)',
    clockHours: 120,
    schedule: 'Full-time: Mon-Fri 9am-3pm or Part-time: Evenings/Weekends',
    delivery:
      'Hybrid - Classroom instruction + Lab practice + Clinical externship',
    credential:
      'Certified Phlebotomy Technician (CPT), CPR/AED, Bloodborne Pathogens, Infection Control',
    approvals: [
      'ETPL Approved - Program ID #10004680',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'CIP Code: 51.1009',
      'Nationally Recognized Certification Program',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Self-Pay: $2,800',
      'Payment plans available',
    ],
    highlights: [
      'National CPT certification',
      'Clinical externship included',
      'CPR and safety certifications',
      'Job placement assistance',
      'Fast 6-week completion',
      'High-demand career',
    ],
    whatYouLearn: [
      'Venipuncture techniques (blood draw from veins)',
      'Capillary puncture (fingerstick)',
      'Specimen collection and handling',
      'Patient identification and safety',
      'Infection control and bloodborne pathogens',
      'Medical terminology',
      'Laboratory equipment and procedures',
      'Electronic health records',
      'Professional communication',
      'CPR and emergency response',
    ],
    outcomes: [
      'Phlebotomy Technician positions',
      'Hospital laboratory technician',
      'Diagnostic laboratory phlebotomist',
      'Blood bank technician',
      'Mobile phlebotomy services',
      'Average salary: $32,000-$42,000/year',
      'Excellent benefits in healthcare settings',
    ],
    requirements: [
      'High school diploma or GED',
      '18 years or older',
      'Background check required',
      'Drug screening required',
      'Immunizations required (Hepatitis B, TB test, COVID-19)',
      'Physically able to stand for extended periods',
      'Good manual dexterity and hand-eye coordination',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=phlebotomy-technician',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=phlebotomy-technician',
    },
    price: 2800,
  },
  {
    slug: 'cpr-cert',
    name: 'CPR, AED & First Aid Certification',
    heroTitle: 'CPR, AED & First Aid Certification',
    heroSubtitle:
      'Get certified in life-saving skills in just one day. Learn CPR, AED operation, and first aid through hands-on training with HSI-certified instructors.',
    shortDescription:
      'One-day certification course in CPR, AED, and first aid. Required for healthcare, childcare, fitness, and many other careers.',
    longDescription:
      "The CPR, AED & First Aid Certification program provides essential emergency response training in a single day. Students learn adult, child, and infant CPR, automated external defibrillator (AED) operation, choking relief, and basic first aid. This certification is required for many healthcare, childcare, fitness, and public safety positions.\n\nWhat You'll Learn:\n- Adult, child, and infant CPR\n- AED operation and safety\n- Choking relief techniques\n- Basic first aid and wound care\n- Emergency response protocols\n- Hands-on practice with manikins and AED trainers\n\nWho This Program Is For:\n- Healthcare workers and students\n- Childcare providers and teachers\n- Fitness instructors and coaches\n- Anyone needing CPR certification for employment\n\nProgram Format:\n- In-person, hands-on training\n- Length: 1 day (4-8 hours)\n- Schedule: Multiple dates available\n\nFunding & Approvals:\n- ETPL Program ID: #10004674\n- WIOA Eligible\n- Workforce Ready Grant Eligible\n\nCareer Outcomes:\n- Required certification for healthcare positions\n- Childcare and education requirements\n- Fitness and recreation industry standard",
    heroImage: '/images/pages/cna-patient-care.jpg',
    heroImageAlt: 'CPR training with instructor and manikin',
    heroVideo: '/videos/cna-hero.mp4',
    duration: '1 day',
    schedule: 'Multiple dates available',
    delivery: 'In-person hands-on training',
    credential: 'CPR/AED/First Aid Certification (HSI)',
    approvals: ['ETPL Program ID: #10004674', 'WIOA Eligible', 'WRG Eligible'],
    fundingOptions: ['WIOA', 'Workforce Ready Grant', 'Self-Pay: $575'],
    highlights: [
      'One-day certification',
      'Hands-on training with equipment',
      'HSI-certified instructors',
      'Required for many careers',
      'Valid for 2 years',
      'Immediate certification',
    ],
    whatYouLearn: [
      'Adult, child, and infant CPR',
      'AED operation and safety',
      'Choking relief techniques',
      'Basic first aid',
      'Emergency response protocols',
      'Hands-on practice',
    ],
    outcomes: [
      'CPR/AED certified',
      'Meet healthcare job requirements',
      'Childcare certification requirement',
      'Fitness industry standard',
    ],
    requirements: [
      'No prerequisites',
      'Physical ability to perform CPR compressions',
      'Attend full day of training',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=cpr-first-aid-hsi',
    },
    ctaSecondary: {
      label: 'View Schedule',
      href: '/inquiry?program=cpr-first-aid-hsi',
    },
    price: 575,
  },
  {
    slug: 'home-health-aide',
    name: 'Home Health Aide Certification',
    heroTitle: 'Home Health Aide Certification',
    heroSubtitle:
      'Become a certified Home Health Aide in just 4 weeks. Provide compassionate in-home care for elderly and disabled clients while earning a stable income.',
    shortDescription:
      'Train to provide in-home care for elderly and disabled clients. Earn Certified Community Healthcare Worker (CCHW) and Home Health Aide (HHA) certifications in 4 weeks.',
    longDescription:
      "The Home Health Aide Certification program prepares students to provide compassionate, professional in-home care for elderly, disabled, and chronically ill clients. This 4-week program combines classroom instruction with hands-on clinical practice, covering personal care, vital signs, infection control, and client communication.\n\nWhat You'll Learn:\n- Personal care and hygiene assistance\n- Vital signs monitoring\n- Medication reminders and documentation\n- Infection control and safety\n- Client communication and dignity\n- Emergency response procedures\n- Documentation and reporting\n\nWho This Program Is For:\n- Individuals seeking healthcare careers\n- Career changers wanting stable employment\n- Those passionate about helping others\n- Students preparing for nursing pathways\n\nProgram Format:\n- Hybrid: Classroom + clinical practicum\n- Length: 4 weeks\n- Schedule: Day or evening options\n\nFunding & Approvals:\n- ETPL Program ID: #10004626\n- WIOA Eligible (certain areas)\n- Workforce Ready Grant Eligible\n\nCareer Outcomes:\n- Home Health Aide\n- Personal Care Assistant\n- Certified Community Healthcare Worker\n- Average salary: $28,000-$35,000/year",
    heroImage: '/images/pages/healthcare-classroom.jpg',
    heroImageAlt: 'Home health aide assisting elderly client',
    heroVideo: '/videos/cna-hero.mp4',
    duration: '4 weeks',
    schedule: 'Day or evening options',
    delivery: 'Hybrid: Classroom + clinical practicum',
    credential:
      'Certified Community Healthcare Worker (CCHW), Home Health Aide (HHA) License, CPR, Rise Up Certificate',
    approvals: [
      'ETPL Program ID: #10004626',
      'WIOA Eligible (certain areas)',
      'WRG Eligible',
    ],
    fundingOptions: [
      'WIOA (certain areas)',
      'Workforce Ready Grant',
      'Self-Pay: $4,700',
      'Payment plans available',
    ],
    highlights: [
      'Quick 4-week program',
      'Multiple certifications included',
      'Hands-on clinical experience',
      'High demand for HHAs',
      'Flexible work schedules',
      'Pathway to nursing careers',
    ],
    whatYouLearn: [
      'Personal care assistance',
      'Vital signs monitoring',
      'Medication reminders',
      'Infection control',
      'Client communication',
      'Emergency response',
      'Documentation',
    ],
    outcomes: [
      'Home Health Aide',
      'Personal Care Assistant',
      'Certified Community Healthcare Worker',
      'Entry to nursing pathways',
    ],
    requirements: [
      'High school diploma or GED',
      '18 years or older',
      'Background check required',
      'Physical ability to assist clients',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=home-health-aide',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=home-health-aide',
    },
    price: 4700,
  },
  {
    slug: 'medical-assistant',
    name: 'Medical Assistant',
    heroTitle: 'Medical Assistant Certification',
    heroSubtitle:
      'Train for a rewarding healthcare career in just 21 days. Learn clinical and administrative skills to work in doctors offices, hospitals, and clinics.',
    shortDescription:
      'Accelerated 21-day program to become a certified medical assistant. Earn Certified Community Healthcare Worker (CCHW) certification and start your healthcare career.',
    longDescription:
      "The Medical Assistant program provides accelerated training in both clinical and administrative healthcare skills. In just 21 days, students learn vital signs, EKG, phlebotomy, medical records, patient care, and office procedures. This hybrid program combines online theory with hands-on clinical practice.\n\nWhat You'll Learn:\n- Clinical procedures (vital signs, EKG, phlebotomy)\n- Patient examination assistance\n- Electronic health records (EHR)\n- Infection control and safety\n- Medical terminology and anatomy\n- Appointment scheduling and billing\n- Professional patient communication\n- Medical office operations\n\nWho This Program Is For:\n- Career changers seeking healthcare careers\n- High school graduates entering workforce\n- Individuals wanting stable employment\n- Students preparing for nursing pathways\n\nProgram Format:\n- Hybrid: Online theory + clinical practicum\n- Length: 21 days\n- Schedule: Full-time intensive\n\nFunding & Approvals:\n- ETPL Program ID: #10004639\n- WIOA Eligible\n- Workforce Ready Grant Eligible\n\nCareer Outcomes:\n- Medical Assistant\n- Clinical Assistant\n- Healthcare Office Coordinator\n- Average salary: $32,000-$38,000/year",
    heroImage: '/images/pages/medical-assistant-lab.jpg',
    heroImageAlt: 'Medical assistant taking patient vital signs',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: '21 days',
    schedule: 'Full-time intensive',
    delivery: 'Hybrid: Online theory + clinical practicum',
    credential:
      'Certified Community Healthcare Worker (CCHW), CPR, Rise Up Certificate',
    approvals: ['ETPL Program ID: #10004639', 'WIOA Eligible', 'WRG Eligible'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Self-Pay: $4,325',
      'Payment plans available',
    ],
    highlights: [
      'Fast 21-day program',
      'Clinical and administrative skills',
      'Hands-on clinical experience',
      'High demand in healthcare',
      'Multiple career pathways',
      'Immediate job placement assistance',
    ],
    whatYouLearn: [
      'Clinical procedures',
      'Patient examination assistance',
      'Electronic health records',
      'Infection control',
      'Medical terminology',
      'Office operations',
      'Patient communication',
    ],
    outcomes: [
      'Medical Assistant',
      'Clinical Assistant',
      'Healthcare Office Coordinator',
      'Entry to nursing pathways',
    ],
    requirements: [
      'High school diploma or GED',
      '18 years or older',
      'Background check required',
      'Drug screening required',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=medical-assistant',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=medical-assistant',
    },
    price: 4325,
  },
  {
    slug: 'reentry-specialist',
    name: 'Public Safety Reentry Specialist Program',
    heroTitle: 'Public Safety Reentry Specialist Program',
    heroSubtitle:
      'Transform your life and help others. Earn multiple certifications in peer recovery, peer support, and community healthcare in 45 days. Justice-involved individuals welcome.',
    shortDescription:
      'Comprehensive 45-day program combining Certified Peer Recovery Coach (CPRC), Certified Peer Support Professional, and Certified Community Healthcare Worker (CCHW) certifications.',
    longDescription:
      "The Public Safety Reentry Specialist Program is designed specifically for justice-involved individuals seeking meaningful careers in behavioral health, addiction recovery, and community support. This comprehensive 45-day program combines three powerful certifications: Certified Peer Recovery Coach (CPRC), Certified Peer Support Professional, and Certified Community Healthcare Worker (CCHW).\n\nWhat You'll Learn:\n- Peer recovery coaching and support\n- Motivational interviewing techniques\n- Trauma-informed care\n- Crisis intervention and de-escalation\n- Community resource navigation\n- Relapse prevention strategies\n- Basic healthcare and vital signs\n- Professional boundaries and ethics\n- Documentation and case management\n\nWho This Program Is For:\n- Justice-involved individuals\n- Individuals in recovery\n- Career changers seeking purpose-driven work\n- Those passionate about helping others\n\nProgram Format:\n- Hybrid: Classroom + practicum\n- Length: 45 days\n- Schedule: Full-time\n\nFunding & Approvals:\n- ETPL Program ID: #10004666\n- WIOA Eligible\n- Job Ready Indy Eligible\n- Workforce Ready Grant Eligible\n\nCareer Outcomes:\n- Certified Peer Recovery Coach\n- Peer Support Specialist\n- Community Healthcare Worker\n- Reentry Navigator\n- Average salary: $32,000-$45,000/year",
    heroImage: '/images/pages/career-counseling.jpg',
    heroImageAlt: 'Peer recovery coach supporting client',
    heroVideo: '/videos/career-services-hero.mp4',
    duration: '45 days',
    schedule: 'Full-time',
    delivery: 'Hybrid: Classroom + practicum',
    credential:
      'Certified Peer Recovery Coach (CPRC), Certified Peer Support Professional, Certified Community Healthcare Worker (CCHW), CPR, Rise Up Certificate',
    approvals: [
      'ETPL Program ID: #10004666',
      'WIOA Eligible',
      'Job Ready Indy Eligible',
      'WRG Eligible',
    ],
    fundingOptions: [
      'WIOA',
      'Job Ready Indy',
      'Workforce Ready Grant',
      'Self-Pay: $4,750',
      'Payment plans available',
    ],
    highlights: [
      'Three certifications in one program',
      'Justice-involved individuals welcome',
      'Purpose-driven career',
      'High demand for peer specialists',
      'Make a real difference',
      'Immediate job placement assistance',
    ],
    whatYouLearn: [
      'Peer recovery coaching',
      'Motivational interviewing',
      'Trauma-informed care',
      'Crisis intervention',
      'Community resources',
      'Relapse prevention',
      'Basic healthcare skills',
      'Professional ethics',
    ],
    outcomes: [
      'Certified Peer Recovery Coach',
      'Peer Support Specialist',
      'Community Healthcare Worker',
      'Reentry Navigator',
      'Case Manager',
    ],
    requirements: [
      'High school diploma or GED',
      '18 years or older',
      'Personal recovery experience preferred',
      'Background check required',
      'Commitment to helping others',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=public-safety-reentry-specialist',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=public-safety-reentry-specialist',
    },
    price: 4750,
  },
  {
    slug: 'drug-alcohol-specimen-collector',
    name: 'Drug & Alcohol Specimen Collector Certification',
    heroTitle: 'Drug & Alcohol Specimen Collector Certification',
    heroSubtitle:
      'DOT-certified training in 2 weeks. Become a certified specimen collector for workplace drug testing programs. High demand, flexible schedule, excellent pay.',
    shortDescription:
      'Become a certified drug and alcohol specimen collector for DOT and workplace testing programs in just 2 weeks.',
    longDescription:
      "The Drug & Alcohol Specimen Collector Certification program trains you to perform urine drug testing, breath alcohol testing, and oral fluid collection for DOT-regulated and non-DOT workplace testing programs. This intensive 2-week program covers federal regulations, collection procedures, chain of custody, and quality assurance.\n\nYou'll learn both DOT (Department of Transportation) and non-DOT collection procedures, making you qualified to work with transportation companies, employers, third-party administrators (TPAs), and drug testing facilities nationwide. The program includes hands-on training with actual collection devices and mock collections to ensure you're confident and compliant.\n\nUpon completion, you'll earn your Specimen Collector certification and be qualified to perform:\n• DOT urine drug testing\n• DOT breath alcohol testing\n• Non-DOT urine drug testing\n• Oral fluid (saliva) drug testing\n• Instant and lab-based testing\n\nThis is a high-demand career with flexible work options including full-time positions, part-time work, mobile collection services, and independent contractor opportunities. Many collectors earn $40,000-$60,000+ annually with the ability to set their own schedules.\n\nPartner Integration:\n• National Drug Screening - DOT compliance training and certification\n• Hands-on training with actual collection devices\n• Access to nationwide collector network",
    heroImage: '/images/pages/healthcare-classroom.jpg',
    heroImageAlt: 'Drug collector performing specimen collection',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: '2 weeks (40 hours)',
    schedule: 'Full-time: Mon-Fri 9am-5pm',
    delivery: 'In-person hands-on training',
    credential:
      'Certified Specimen Collector (DOT & Non-DOT), Breath Alcohol Technician (BAT)',
    approvals: [
      'DOT Compliant Training',
      'National Drug Screening Certified',
      'CIP Code: 51.1004',
    ],
    fundingOptions: [
      'WIOA (pending approval)',
      'Workforce Ready Grant (pending)',
      'Self-Pay: $1,500',
      'Payment plans available',
    ],
    highlights: [
      'DOT and non-DOT certified',
      'Hands-on training with real devices',
      'Flexible career options',
      'High earning potential $40K-$60K+',
      'Fast 2-week completion',
      'Nationwide job opportunities',
    ],
    whatYouLearn: [
      'DOT urine drug testing procedures',
      'DOT breath alcohol testing',
      'Non-DOT specimen collection',
      'Oral fluid (saliva) testing',
      'Chain of custody procedures',
      'Federal regulations (49 CFR Part 40)',
      'Specimen validity testing',
      'Quality assurance and quality control',
      'Donor rights and privacy',
      'Problem collections and refusals',
    ],
    outcomes: [
      'Drug testing facility collector',
      'Mobile specimen collector',
      'Third-party administrator (TPA) collector',
      'Occupational health clinic collector',
      'Independent contractor',
      'Average salary: $40,000-$60,000/year',
    ],
    requirements: [
      'High school diploma or GED',
      '18 years or older',
      'Background check required',
      'Drug screening required',
      "Valid driver's license (for mobile collection)",
      'Reliable transportation',
      'Professional demeanor',
    ],
    ctaPrimary: {
      label: 'Apply Now',
      href: '/apply?program=drug-alcohol-specimen-collector',
    },
    ctaSecondary: {
      label: 'Request Information',
      href: '/inquiry?program=drug-alcohol-specimen-collector',
    },
    price: 1500,
  },

  // ============================================
  // DB-synced programs — generated from Supabase programs table
  // ============================================

    {
    slug: 'administrative-assistant',
    name: 'Administrative Assistant',
    heroTitle: 'Administrative Assistant',
    heroSubtitle: 'Support business operations. Office management and organizational skills.',
    shortDescription: 'Support business operations. Office management and organizational skills.',
    longDescription: `Our Administrative Assistant program prepares you for a professional office career. You'll learn Microsoft Office Suite, business communication, scheduling, and office procedures. The program covers document preparation, meeting coordination, travel arrangements, and professional etiquette. You'll develop organizational skills and attention to detail. Administrative assistants are essential in every industry with stable employment.`,
    heroImage: '/images/pages/admin-business-hero.jpg',
    heroImageAlt: 'Administrative Assistant training at Elevate for Humanity',
    heroVideo: '/videos/partner-business.mp4',
    duration: '12 weeks',
    clockHours: 480,
    schedule: '480 hours',
    delivery: 'Hybrid (Classroom + Practice)',
    credential: 'Certified Administrative Professional',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '12 weeks program',
      '480 training hours',
      'Earn: Certified Administrative Professional',
      'Salary range: $32,000-$50,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Microsoft Office Suite (Word, Excel, PowerPoint, Outlook)',
      'Business writing and communication',
      'Calendar and schedule management',
      'Meeting and event coordination',
      'Travel arrangements and expense reports',
      'File organization and record keeping',
      'Professional phone and email etiquette',
      'Office equipment and technology'
    ],
    outcomes: [
      'Administrative assistant',
      'Executive assistant',
      'Office manager',
      'Operations coordinator',
      'Chief of staff'
    ],
    requirements: [
      'High school diploma or GED, organizational skills, attention to detail'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=administrative-assistant' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 4200,
  },
    {
    slug: 'automotive-technician',
    name: 'Automotive Technician',
    heroTitle: 'Automotive Technician',
    heroSubtitle: 'Repair and maintain vehicles. ASE certification and hands-on training.',
    shortDescription: 'Repair and maintain vehicles. ASE certification and hands-on training.',
    longDescription: `Our Automotive Technician program prepares you for a career servicing vehicles. You'll learn engine repair, electrical systems, brakes, suspension, and diagnostics. The program covers modern vehicle technology, computer diagnostics, and customer service. You'll gain extensive hands-on experience with real vehicles and prepare for ASE certification. Automotive technicians are always in demand with stable employment.`,
    heroImage: '/images/pages/hvac-tools.jpg',
    heroImageAlt: 'Automotive Technician training at Elevate for Humanity',
    heroVideo: '/videos/electrician-trades.mp4',
    duration: '32 weeks',
    clockHours: 1280,
    schedule: '1280 hours',
    delivery: 'Hybrid (Classroom + Shop)',
    credential: 'ASE Certified Technician',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '32 weeks program',
      '1280 training hours',
      'Earn: ASE Certified Technician',
      'Salary range: $35,000-$70,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Engine repair and maintenance',
      'Electrical and electronic systems',
      'Brake systems and ABS',
      'Steering and suspension',
      'Heating and air conditioning',
      'Computer diagnostics and scan tools',
      'Hybrid and electric vehicle basics',
      'Customer service and estimates'
    ],
    outcomes: [
      'Entry-level technician',
      'Certified technician',
      'Master technician',
      'Shop foreman',
      'Service manager or shop owner'
    ],
    requirements: [
      'High school diploma or GED, mechanical aptitude, problem-solving skills'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=automotive-technician' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 9500,
  },
    {
    slug: 'bookkeeping',
    name: 'Bookkeeping, Accounting & Auditing Clerk',
    heroTitle: 'Bookkeeping, Accounting & Auditing Clerk',
    heroSubtitle: 'Prepare for entry-level employment as a Bookkeeping, Accounting, and Auditing Clerk (SOC 43-3031). 150 hours of hybrid instruction over 8 weeks. Earn the Intuit QuickBooks Certified User credential and Microsoft Office Specialist Associate certification.',
    shortDescription: 'Prepare for entry-level employment as a Bookkeeping, Accounting, and Auditing Clerk (SOC 43-3031). 150 hours over 8 weeks. QuickBooks and MOS certifications included.',
    longDescription: `This program prepares individuals with no prior credentials for entry-level employment aligned with Bookkeeping, Accounting, and Auditing Clerk (SOC 43-3031). Students develop competency in accounting fundamentals, payroll support, accounts payable and receivable processing, financial reporting, and accounting software applications. The program includes preparation for the Intuit QuickBooks Certified User credential and Microsoft Office Specialist Associate certification.\n\nAssessment includes weekly written tests, practical lab examinations, a midterm examination, a capstone performance assessment, and industry certification examinations. Students must achieve a minimum score of 70% overall to complete the program.\n\nCIP Code: 52.0302 - Accounting Technology/Technician and Bookkeeping`,
    heroImage: '/images/pages/business-sector.jpg',
    heroImageAlt: 'Bookkeeping and accounting training at Elevate for Humanity',
    heroVideo: '/videos/partner-business.mp4',
    duration: '8 weeks',
    clockHours: 150,
    schedule: '19 hours per week',
    delivery: 'Hybrid (Classroom + Lab + Online)',
    credential: 'Intuit QuickBooks Certified User, Microsoft Office Specialist Associate',
    approvals: [
      'ETPL Approved',
      'WIOA Eligible',
      'Workforce Ready Grant Eligible',
      'CIP Code: 52.0302',
      'SOC 43-3031',
    ],
    fundingOptions: [
      'No cost for eligible WIOA participants',
      'Workforce Ready Grant',
      'Self-Pay with Payment Plans',
    ],
    price: 2800,
    highlights: [
      '150 total instructional hours',
      '8-week hybrid program',
      'Intuit QuickBooks Certified User exam included',
      'Microsoft Office Specialist Associate exam included',
      'SOC 43-3031 aligned curriculum',
      'ETPL approved — WIOA and WRG funding available',
    ],
    whatYouLearn: [
      'Accounting fundamentals and terminology',
      'General ledger and financial statements',
      'Accounts payable and receivable processing',
      'Payroll calculations and documentation',
      'Microsoft Excel for accounting',
      'QuickBooks setup, transactions, and reconciliation',
      'Month-end closing and compliance procedures',
      'Financial reporting and presentation',
    ],
    outcomes: [
      'Bookkeeper',
      'Accounting Clerk',
      'Accounts Payable/Receivable Clerk',
      'Payroll Clerk',
      'Billing Specialist',
      'Office Manager',
    ],
    requirements: [
      'High school diploma or GED',
      'Basic arithmetic skills',
      'No prior accounting experience required',
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=bookkeeping' },
    ctaSecondary: { label: 'Check Funding Eligibility', href: '/funding' },
  },
    {
    slug: 'chw-cert',
    name: 'Community Healthcare Worker Program',
    heroTitle: 'Community Healthcare Worker Program',
    heroSubtitle: 'Bridge healthcare gaps',
    shortDescription: 'Bridge healthcare gaps',
    longDescription: `Training to bridge gaps between healthcare systems and underserved communities.`,
    heroImage: '/images/pages/healthcare-grad.jpg',
    heroImageAlt: 'Community Healthcare Worker Program training at Elevate for Humanity',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: 'Varies',
    clockHours: 160,
    schedule: '160 hours',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'WRG'
    ],
    highlights: [
      '160 training hours',
      'Earn: Certificate of Completion',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Health education',
      'Care navigation',
      'Community outreach',
      'Cultural competency'
    ],
    outcomes: [
      'Community Healthcare Worker Program',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=chw-cert' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 1200,
  },
    {
    slug: 'cosmetology-apprenticeship',
    name: 'Cosmetology Apprenticeship',
    heroTitle: 'Cosmetology Apprenticeship',
    heroSubtitle: 'State-licensed cosmetology apprenticeship program covering hair styling, coloring, skincare, nail care, and salon busine',
    shortDescription: 'State-licensed cosmetology apprenticeship program covering hair styling, coloring, skincare, nail care, and salon business management. Combines hands-on training with classroom instruction.',
    longDescription: `Our Cosmetology Apprenticeship program provides comprehensive training in all aspects of beauty services. Students learn hair cutting, coloring, chemical treatments, skincare, makeup application, and nail services while gaining hands-on experience in a real salon environment. The program meets Indiana State Board of Cosmetology requirements for licensure.`,
    heroImage: '/images/pages/barber-apprenticeship.jpg',
    heroImageAlt: 'Cosmetology Apprenticeship training at Elevate for Humanity',
    heroVideo: '/videos/cosmetology-salon.mp4',
    duration: '12–18 months',
    clockHours: 1500,
    schedule: '1500 hours',
    delivery: 'hybrid',
    credential: 'Indiana Cosmetology License',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      '12–18 months program',
      '1500 training hours',
      'Earn: Indiana Cosmetology License',
      'Salary range: $28,000-$55,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Hair cutting and styling techniques',
      'Hair coloring and chemical services',
      'Skincare and facial treatments',
      'Makeup application',
      'Manicure and pedicure services',
      'Salon sanitation and safety',
      'Client consultation skills',
      'Business and retail management'
    ],
    outcomes: [
      'Licensed Cosmetologist',
      'Salon Stylist',
      'Color Specialist',
      'Salon Manager',
      'Platform Artist',
      'Salon Owner'
    ],
    requirements: [
      '{"High school diploma or GED","At least 16 years of age","Valid government-issued ID","Background check clearance"}'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=cosmetology-apprenticeship' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 8500,
  },
    {
    slug: 'culinary-apprenticeship',
    name: 'Culinary Apprenticeship',
    heroTitle: 'Culinary Apprenticeship',
    heroSubtitle: 'Professional cooking.',
    shortDescription: 'Professional cooking.',
    longDescription: `Learn culinary arts through hands-on apprenticeship training. Master cooking techniques, food safety, menu planning, and kitchen management.`,
    heroImage: '/images/pages/training-classroom.jpg',
    heroImageAlt: 'Culinary Apprenticeship training at Elevate for Humanity',
    heroVideo: '/videos/program-hero.mp4',
    duration: '40 weeks',
    clockHours: 1000,
    schedule: '1000 hours',
    delivery: 'apprenticeship',
    credential: 'Culinary Arts Certificate',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      '40 weeks program',
      '1000 training hours',
      'Earn: Culinary Arts Certificate',
      'Salary range: $28,000-$55,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Knife skills',
      'Cooking methods',
      'Food safety and sanitation',
      'Menu planning',
      'Inventory management',
      'Kitchen operations'
    ],
    outcomes: [
      'Line Cook',
      'Prep Cook',
      'Sous Chef',
      'Kitchen Manager',
      'Catering Chef'
    ],
    requirements: [
      '{"High school diploma or GED","At least 17 years of age","Food handlers permit"}'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=culinary-apprenticeship' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 6500,
  },
    {
    slug: 'customer-service-representative',
    name: 'Customer Service Representative',
    heroTitle: 'Customer Service Representative',
    heroSubtitle: 'Help customers and build relationships. Communication and problem-solving skills.',
    shortDescription: 'Help customers and build relationships. Communication and problem-solving skills.',
    longDescription: `Our Customer Service Representative program prepares you for a people-focused career. You'll learn communication skills, conflict resolution, and customer relationship management. The program covers phone etiquette, email communication, CRM software, and handling difficult situations. You'll practice real scenarios and develop professional soft skills. Customer service roles offer stable employment with advancement opportunities.`,
    heroImage: '/images/pages/career-counseling.jpg',
    heroImageAlt: 'Customer Service Representative training at Elevate for Humanity',
    heroVideo: '/videos/partner-business.mp4',
    duration: '8 weeks',
    clockHours: 320,
    schedule: '320 hours',
    delivery: 'Hybrid (Classroom + Practice)',
    credential: 'Customer Service Professional',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans',
      'Employer Sponsorship'
    ],
    highlights: [
      '8 weeks program',
      '320 training hours',
      'Earn: Customer Service Professional',
      'Salary range: $28,000-$42,000/year',
      'Funding: WIOA, Workforce Ready Grant'
    ],
    whatYouLearn: [
      'Professional communication skills',
      'Active listening and empathy',
      'Conflict resolution techniques',
      'CRM software and tools',
      'Phone and email etiquette',
      'Problem-solving strategies',
      'Time management and organization',
      'Product knowledge and sales basics'
    ],
    outcomes: [
      'Customer service representative',
      'Senior customer service rep',
      'Team lead or supervisor',
      'Customer success manager',
      'Operations or service manager'
    ],
    requirements: [
      'High school diploma or GED, good communication skills, patience'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=customer-service-representative' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 2800,
  },
    {
    slug: 'cybersecurity-analyst',
    name: 'Cybersecurity Analyst',
    heroTitle: 'Cybersecurity Analyst',
    heroSubtitle: 'Protect organizations from cyber threats. Learn security analysis and threat detection.',
    shortDescription: 'Protect organizations from cyber threats. Learn security analysis and threat detection.',
    longDescription: `Our Cybersecurity Analyst program prepares you for a high-demand career protecting digital assets. You'll learn network security, threat analysis, incident response, and security tools. The program covers ethical hacking, vulnerability assessment, and security best practices. You'll gain hands-on experience with real security scenarios and prepare for Security+ and CEH certifications. Cybersecurity offers excellent pay and job security.`,
    heroImage: '/images/pages/cybersecurity-screen.jpg',
    heroImageAlt: 'Cybersecurity Analyst training at Elevate for Humanity',
    heroVideo: '/videos/it-technology.mp4',
    duration: '24 weeks',
    clockHours: 960,
    schedule: '960 hours',
    delivery: 'Hybrid (Classroom + Lab)',
    credential: 'Certiport IT Specialist — Cybersecurity',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '24 weeks program',
      '960 training hours',
      'Earn: Certiport IT Specialist — Cybersecurity',
      'Salary range: $60,000-$110,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Network security fundamentals',
      'Threat detection and analysis',
      'Security tools and technologies',
      'Ethical hacking and penetration testing',
      'Incident response and forensics',
      'Security policies and compliance',
      'Cryptography and encryption',
      'Risk assessment and management'
    ],
    outcomes: [
      'Entry-level security analyst',
      'Security operations center (SOC) analyst',
      'Penetration tester',
      'Security engineer',
      'Chief Information Security Officer (CISO)'
    ],
    requirements: [
      'High school diploma or GED, strong analytical skills, IT fundamentals helpful'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=cybersecurity-analyst' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 7500,
  },
    {
    slug: 'data-analytics',
    name: 'Data Analytics',
    heroTitle: 'Data Analytics',
    heroSubtitle: 'Analyze data to drive business decisions. Learn SQL, Excel, and visualization tools.',
    shortDescription: 'Analyze data to drive business decisions. Learn SQL, Excel, and visualization tools.',
    longDescription: `Our Data Analytics program teaches you to transform raw data into actionable insights. You'll learn SQL for database queries, Excel for analysis, and tools like Tableau and Power BI for visualization. The program covers statistics, data cleaning, and storytelling with data. You'll work with real datasets and build a portfolio of analysis projects. Data analysts are in high demand across all industries.`,
    heroImage: '/images/pages/technology-sector.jpg',
    heroImageAlt: 'Data Analytics training at Elevate for Humanity',
    heroVideo: '/videos/it-technology.mp4',
    duration: '20 weeks',
    clockHours: 800,
    schedule: '800 hours',
    delivery: 'Hybrid (Classroom + Online)',
    credential: 'Data Analyst',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '20 weeks program',
      '800 training hours',
      'Earn: Data Analyst',
      'Salary range: $55,000-$90,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'SQL and database querying',
      'Advanced Excel and spreadsheet analysis',
      'Data visualization with Tableau/Power BI',
      'Statistics and probability',
      'Data cleaning and preparation',
      'Business intelligence concepts',
      'Python for data analysis',
      'Presenting insights to stakeholders'
    ],
    outcomes: [
      'Junior data analyst',
      'Business intelligence analyst',
      'Data analyst',
      'Senior data analyst',
      'Data scientist'
    ],
    requirements: [
      'High school diploma or GED, strong analytical skills, comfort with numbers'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=data-analytics' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 6500,
  },
    {
    slug: 'dental-assistant',
    name: 'Dental Assistant',
    heroTitle: 'Dental Assistant',
    heroSubtitle: 'Train to become a dental assistant. Chairside support and patient care in dental offices.',
    shortDescription: 'Train to become a dental assistant. Chairside support and patient care in dental offices.',
    longDescription: `Our Dental Assistant program prepares you for a rewarding career in dental healthcare. You'll learn chairside assisting, dental radiography, infection control, and patient management.`,
    heroImage: '/images/pages/medical-assistant-desk.jpg',
    heroImageAlt: 'Dental Assistant training at Elevate for Humanity',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: '12 weeks',
    clockHours: 480,
    schedule: '480 hours',
    delivery: 'Hybrid (Classroom + Clinical)',
    credential: 'Certified Dental Assistant (CDA)',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '12 weeks program',
      '480 training hours',
      'Earn: Certified Dental Assistant (CDA)',
      'Salary range: $32,000-$46,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Chairside assisting techniques',
      'Dental radiography and imaging',
      'Infection control and sterilization',
      'Dental materials and instruments',
      'Patient scheduling and records',
      'Dental terminology and anatomy',
      'Four-handed dentistry',
      'Patient education and communication'
    ],
    outcomes: [
      'Entry-level dental assistant',
      'Lead or senior dental assistant',
      'Specialty dental assistant',
      'Office manager',
      'Advancement to dental hygienist with additional education'
    ],
    requirements: [
      'High school diploma or GED, background check, immunizations'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=dental-assistant' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 4500,
  },
    {
    slug: 'diesel-mechanic',
    name: 'Diesel Mechanic',
    heroTitle: 'Diesel Mechanic',
    heroSubtitle: 'Service heavy trucks and equipment. High-paying career with strong demand.',
    shortDescription: 'Service heavy trucks and equipment. High-paying career with strong demand.',
    longDescription: `Our Diesel Mechanic program prepares you to service heavy-duty trucks and equipment. You'll learn diesel engines, air brakes, hydraulics, and electrical systems. The program covers preventive maintenance, diagnostics, and major repairs. You'll gain hands-on experience with trucks, buses, and construction equipment. Diesel mechanics earn higher wages than automotive technicians with excellent job security.`,
    heroImage: '/images/pages/hvac-unit.jpg',
    heroImageAlt: 'Diesel Mechanic training at Elevate for Humanity',
    heroVideo: '/videos/electrician-trades.mp4',
    duration: '32 weeks',
    clockHours: 1280,
    schedule: '1280 hours',
    delivery: 'Hybrid (Classroom + Shop)',
    credential: 'ASE Diesel Certification',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '32 weeks program',
      '1280 training hours',
      'Earn: ASE Diesel Certification',
      'Salary range: $40,000-$75,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Diesel engine theory and repair',
      'Air brake systems',
      'Hydraulic systems',
      'Electrical and electronic systems',
      'Preventive maintenance',
      'Computer diagnostics',
      'Welding and fabrication basics',
      'DOT regulations and safety'
    ],
    outcomes: [
      'Entry-level diesel technician',
      'Certified diesel mechanic',
      'Master technician',
      'Shop supervisor',
      'Fleet manager or shop owner'
    ],
    requirements: [
      'High school diploma or GED, mechanical aptitude, physical strength'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=diesel-mechanic' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 9500,
  },
    {
    slug: 'dsp-training',
    name: 'Direct Support Professional Training',
    heroTitle: 'Direct Support Professional Training',
    heroSubtitle: 'Support individuals with disabilities',
    shortDescription: 'Support individuals with disabilities',
    longDescription: `DSP certification training preparing students to support individuals with disabilities.`,
    heroImage: '/images/pages/healthcare-classroom.jpg',
    heroImageAlt: 'Direct Support Professional Training training at Elevate for Humanity',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: 'Varies',
    clockHours: 120,
    schedule: '120 hours',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'WRG'
    ],
    highlights: [
      '120 training hours',
      'Earn: Certificate of Completion',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'DSP certification',
      'CPR/First Aid',
      'Person-centered care',
      'Field placement'
    ],
    outcomes: [
      'Direct Support Professional Training',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=dsp-training' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 950,
  },
    {
    slug: 'electrical',
    name: 'Electrical Apprenticeship',
    heroTitle: 'Electrical Apprenticeship',
    heroSubtitle: 'DOL-registered electrical apprenticeship.',
    shortDescription: 'DOL-registered electrical apprenticeship.',
    longDescription: `DOL-registered electrical apprenticeship.`,
    heroImage: '/images/pages/electrical.jpg',
    heroImageAlt: 'Electrical Apprenticeship training at Elevate for Humanity',
    heroVideo: '/videos/electrician-trades.mp4',
    duration: 'Varies',
    clockHours: 0,
    schedule: 'Contact for schedule',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      'Earn: Certificate of Completion',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Electrical Apprenticeship fundamentals',
      'Hands-on practical training',
      'Industry certification preparation',
      'Job readiness and placement support'
    ],
    outcomes: [
      'Electrical Apprenticeship',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=electrical' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 5500,
  },
    {
    slug: 'emt-apprenticeship',
    name: 'Emergency Medical Technician Apprenticeship',
    heroTitle: 'Emergency Medical Technician Apprenticeship',
    heroSubtitle: 'DOL Registered Apprenticeship - Indiana. Healthcare Specialist pathway. RAPIDS Program: 2025-IN-132301.',
    shortDescription: 'DOL Registered Apprenticeship - Indiana. Healthcare Specialist pathway. RAPIDS Program: 2025-IN-132301.',
    longDescription: `Train to become an Emergency Medical Technician. Learn patient assessment, emergency care, trauma response, and ambulance operations.`,
    heroImage: '/images/pages/cna-clinical.jpg',
    heroImageAlt: 'Emergency Medical Technician Apprenticeship training at Elevate for Humanity',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: '12 weeks',
    clockHours: 180,
    schedule: '180 hours',
    delivery: 'hybrid',
    credential: 'Indiana EMT Certification',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      '12 weeks program',
      '180 training hours',
      'Earn: Indiana EMT Certification',
      'Salary range: $32,000-$48,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Patient assessment',
      'Airway management',
      'CPR and AED',
      'Trauma care',
      'Medical emergencies',
      'Ambulance operations'
    ],
    outcomes: [
      'EMT-Basic',
      'Ambulance Technician',
      'ER Technician',
      'Firefighter EMT'
    ],
    requirements: [
      '{"High school diploma or GED","At least 18 years of age","CPR certification","Background check"}'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=emt-apprenticeship' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 1800,
  },
    {
    slug: 'entrepreneurship-small-business',
    name: 'Entrepreneurship / Small Business',
    heroTitle: 'Entrepreneurship / Small Business',
    heroSubtitle: 'Start and grow your own business. Business planning, marketing, and management skills.',
    shortDescription: 'Start and grow your own business. Business planning, marketing, and management skills.',
    longDescription: `Our Entrepreneurship program teaches you to start and run a successful small business. You'll learn business planning, marketing, financial management, and operations.`,
    heroImage: '/images/pages/admin-business-hero.jpg',
    heroImageAlt: 'Entrepreneurship / Small Business training at Elevate for Humanity',
    heroVideo: '/videos/partner-business.mp4',
    duration: '16 weeks',
    clockHours: 640,
    schedule: '640 hours',
    delivery: 'Hybrid (Classroom + Mentorship)',
    credential: 'Small Business Owner',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Small business grants',
      'SBA loans',
      'Self-funded'
    ],
    highlights: [
      '16 weeks program',
      '640 training hours',
      'Earn: Small Business Owner',
      'Funding: WIOA, Small business grants'
    ],
    whatYouLearn: [
      'Business planning and strategy',
      'Market research and analysis',
      'Marketing and customer acquisition',
      'Financial management and accounting',
      'Legal structures and compliance',
      'Funding and financing options',
      'Operations and systems',
      'Scaling and growth strategies'
    ],
    outcomes: [
      'Startup founder',
      'Small business owner',
      'Growing business',
      'Multiple locations',
      'Franchise or acquisition'
    ],
    requirements: [
      'High school diploma or GED, business idea or passion, determination and resilience'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=entrepreneurship-small-business' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 5200,
  },
    {
    slug: 'forklift-operator',
    name: 'Forklift Operator',
    heroTitle: 'Forklift Operator',
    heroSubtitle: 'Operate forklifts and material handling equipment. Quick certification with immediate employment.',
    shortDescription: 'Operate forklifts and material handling equipment. Quick certification with immediate employment.',
    longDescription: `Our Forklift Operator program provides OSHA-compliant certification to operate forklifts safely. You'll learn equipment operation, load handling, safety procedures, and warehouse practices.`,
    heroImage: '/images/pages/hvac-tools.jpg',
    heroImageAlt: 'Forklift Operator training at Elevate for Humanity',
    heroVideo: '/videos/electrician-trades.mp4',
    duration: '1 weeks',
    clockHours: 40,
    schedule: '40 hours',
    delivery: 'Hybrid (Classroom + Practice)',
    credential: 'OSHA Forklift Operator',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans',
      'Employer-paid'
    ],
    highlights: [
      '1 weeks program',
      '40 training hours',
      'Earn: OSHA Forklift Operator',
      'Salary range: $30,000-$45,000/year',
      'Funding: WIOA, Workforce Ready Grant'
    ],
    whatYouLearn: [
      'Forklift operation and controls',
      'Load handling and stacking',
      'Safety procedures and OSHA standards',
      'Pre-operation inspection',
      'Warehouse operations',
      'Different forklift types',
      'Hazard recognition',
      'Emergency procedures'
    ],
    outcomes: [
      'Forklift operator',
      'Lead operator',
      'Warehouse supervisor',
      'Logistics coordinator',
      'Warehouse manager'
    ],
    requirements: [
      'Age 18+, physical fitness, pass drug test, clean driving record helpful'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=forklift-operator' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 450,
  },
    {
    slug: 'insurance-agent',
    name: 'Insurance Agent',
    heroTitle: 'Insurance Agent',
    heroSubtitle: 'Sell insurance products and protect clients. Commission-based income with residual earnings.',
    shortDescription: 'Sell insurance products and protect clients. Commission-based income with residual earnings.',
    longDescription: `Our Insurance Agent program prepares you for your state licensing exam and insurance sales career. You'll learn insurance products (life, health, property, casualty), underwriting, and risk assessment. The program covers sales techniques, client needs analysis, and policy servicing. You'll understand regulations, ethics, and building a client base. Insurance agents earn commission plus residual income from policy renewals.`,
    heroImage: '/images/pages/business-sector.jpg',
    heroImageAlt: 'Insurance Agent training at Elevate for Humanity',
    heroVideo: '/videos/partner-business.mp4',
    duration: '8 weeks',
    clockHours: 320,
    schedule: '320 hours',
    delivery: 'Hybrid (Classroom + Online)',
    credential: 'Licensed Insurance Agent',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans',
      'Self-funded',
      'Agency sponsorship'
    ],
    highlights: [
      '8 weeks program',
      '320 training hours',
      'Earn: Licensed Insurance Agent',
      'Salary range: $35,000-$90,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Insurance products and coverage types',
      'Life and health insurance',
      'Property and casualty insurance',
      'Underwriting and risk assessment',
      'Sales and prospecting techniques',
      'Client needs analysis',
      'Policy servicing and claims',
      'Insurance regulations and ethics'
    ],
    outcomes: [
      'Licensed insurance agent',
      'Senior agent or producer',
      'Agency manager',
      'Independent agency owner',
      'Regional director'
    ],
    requirements: [
      'High school diploma or GED, age 18+, pass state exam, background check'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=insurance-agent' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 2800,
  },
    {
    slug: 'it-help-desk',
    name: 'IT Help Desk Technician',
    heroTitle: 'IT Help Desk Technician',
    heroSubtitle: 'Launch your IT career. Provide technical support and troubleshoot computer systems.',
    shortDescription: 'Launch your IT career. Provide technical support and troubleshoot computer systems.',
    longDescription: `Our IT Support Specialist program prepares you for entry into the technology field. You'll learn computer hardware, software, networking, and troubleshooting. The program covers help desk operations, customer service, and technical problem-solving. You'll gain hands-on experience with real systems and prepare for Certiport IT Specialist certification. IT support roles offer stable employment with clear advancement paths.`,
    heroImage: '/images/pages/it-helpdesk-desk.jpg',
    heroImageAlt: 'IT Help Desk Technician training at Elevate for Humanity',
    heroVideo: '/videos/it-technology.mp4',
    duration: '8 weeks',
    clockHours: 320,
    schedule: '320 hours',
    delivery: 'Hybrid (Classroom + Lab)',
    credential: 'Certiport IT Specialist — Device Configuration',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '8 weeks program',
      '320 training hours',
      'Earn: Certiport IT Specialist',
      'Salary range: $38,000-$60,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Computer hardware and software troubleshooting',
      'Operating systems (Windows, macOS, Linux)',
      'Networking fundamentals',
      'Help desk and customer service',
      'Remote support tools',
      'Security basics and best practices',
      'Mobile device support',
      'Cloud services and applications'
    ],
    outcomes: [
      'Entry-level IT support technician',
      'Help desk analyst',
      'Desktop support specialist',
      'Network administrator',
      'Systems administrator'
    ],
    requirements: [
      'High school diploma or GED, basic computer skills, problem-solving aptitude'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=it-support-specialist' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 2800,
  },
    {
    slug: 'life-coach-certification-wioa',
    name: 'Life Coach Certification',
    heroTitle: 'Life Coach Certification',
    heroSubtitle: 'Professional life coaching certification program. Help others achieve their goals while building a rewarding career.',
    shortDescription: 'Professional life coaching certification program. Help others achieve their goals while building a rewarding career.',
    longDescription: `Become a certified life coach. Learn coaching methodologies, communication techniques, goal setting, and how to build a coaching practice.`,
    heroImage: '/images/pages/career-counseling.jpg',
    heroImageAlt: 'Life Coach Certification training at Elevate for Humanity',
    heroVideo: '/videos/career-services-hero.mp4',
    duration: '12 weeks',
    clockHours: 60,
    schedule: '60 hours',
    delivery: 'online',
    credential: 'Certified Life Coach',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      '12 weeks program',
      '60 training hours',
      'Earn: Certified Life Coach',
      'Salary range: $35,000-$80,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Coaching fundamentals',
      'Active listening',
      'Powerful questioning',
      'Goal setting frameworks',
      'Accountability structures',
      'Ethics and boundaries',
      'Business development'
    ],
    outcomes: [
      'Life Coach',
      'Career Coach',
      'Executive Coach',
      'Wellness Coach'
    ],
    requirements: [
      '{"High school diploma or GED","At least 21 years of age"}'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=life-coach-certification-wioa' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 750,
  },
    {
    slug: 'manufacturing-technician',
    name: 'Manufacturing Technician',
    heroTitle: 'Manufacturing Technician',
    heroSubtitle: 'Operate production equipment and ensure quality. Essential manufacturing skills.',
    shortDescription: 'Operate production equipment and ensure quality. Essential manufacturing skills.',
    longDescription: `Our Manufacturing Technician program prepares you for production and quality roles in manufacturing. You'll learn machine operation, quality control, lean manufacturing, and safety procedures.`,
    heroImage: '/images/pages/welding-sparks.jpg',
    heroImageAlt: 'Manufacturing Technician training at Elevate for Humanity',
    heroVideo: '/videos/electrician-trades.mp4',
    duration: '12 weeks',
    clockHours: 480,
    schedule: '480 hours',
    delivery: 'Hybrid (Classroom + Shop)',
    credential: 'Manufacturing Technician Level 1',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '12 weeks program',
      '480 training hours',
      'Earn: Manufacturing Technician Level 1',
      'Salary range: $35,000-$60,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Machine operation and setup',
      'Quality control and inspection',
      'Blueprint reading and interpretation',
      'Measurement tools and techniques',
      'Lean manufacturing principles',
      'Safety procedures and OSHA standards',
      'Production processes',
      'Problem-solving and troubleshooting'
    ],
    outcomes: [
      'Production operator',
      'Manufacturing technician',
      'Quality technician',
      'Production supervisor',
      'Manufacturing engineer'
    ],
    requirements: [
      'High school diploma or GED, mechanical aptitude, attention to detail'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=manufacturing-technician' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 4200,
  },
    {
    slug: 'nail-technician',
    name: 'Nail Technician',
    heroTitle: 'Nail Technician',
    heroSubtitle: 'Professional nail technician training covering manicures, pedicures, nail art, acrylics, and salon sanitation.',
    shortDescription: 'Professional nail technician training covering manicures, pedicures, nail art, acrylics, and salon sanitation.',
    longDescription: `Our Nail Technician program prepares students for a rewarding career in nail care. Learn manicures, pedicures, acrylic and gel nails, nail art, and proper sanitation techniques. Graduate ready to pass the state board exam and start working in salons or open your own business.`,
    heroImage: '/images/pages/barber-styling-hair.jpg',
    heroImageAlt: 'Nail Technician training at Elevate for Humanity',
    heroVideo: '/videos/nail-tech.mp4',
    duration: '16 weeks',
    clockHours: 450,
    schedule: '450 hours',
    delivery: 'in-person',
    credential: 'Indiana Nail Technician License',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      '16 weeks program',
      '450 training hours',
      'Earn: Indiana Nail Technician License',
      'Salary range: $25,000-$45,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Manicure and pedicure techniques',
      'Acrylic nail application',
      'Gel nail systems',
      'Nail art and design',
      'Sanitation and safety protocols',
      'Client consultation',
      'Salon business basics'
    ],
    outcomes: [
      'Licensed Nail Technician',
      'Salon Nail Tech',
      'Nail Artist',
      'Salon Owner',
      'Mobile Nail Tech'
    ],
    requirements: [
      '{"High school diploma or GED","At least 16 years of age","Valid ID"}'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=nail-technician' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 3800,
  },
    {
    slug: 'nrf-riseup',
    name: 'NRF Rise Up Program',
    heroTitle: 'NRF Rise Up Program',
    heroSubtitle: 'Retail fundamentals',
    shortDescription: 'Retail fundamentals',
    longDescription: `National Retail Federation training covering retail fundamentals and customer service.`,
    heroImage: '/images/pages/training-classroom.jpg',
    heroImageAlt: 'NRF Rise Up Program training at Elevate for Humanity',
    heroVideo: '/videos/partner-business.mp4',
    duration: 'Varies',
    clockHours: 40,
    schedule: '40 hours',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'WRG'
    ],
    highlights: [
      '40 training hours',
      'Earn: Certificate of Completion',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Customer service',
      'Retail operations',
      'Sales techniques',
      'NRF certification'
    ],
    outcomes: [
      'NRF Rise Up Program',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=nrf-riseup' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 399,
  },
    {
    slug: 'peer-support',
    name: 'Peer Support Professional Program',
    heroTitle: 'Peer Support Professional Program',
    heroSubtitle: 'Support individuals in recovery',
    shortDescription: 'Support individuals in recovery',
    longDescription: `Training for individuals with lived experience to support others in recovery.`,
    heroImage: '/images/pages/healthcare-grad.jpg',
    heroImageAlt: 'Peer Support Professional Program training at Elevate for Humanity',
    heroVideo: '/videos/career-services-hero.mp4',
    duration: 'Varies',
    clockHours: 80,
    schedule: '80 hours',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'WRG'
    ],
    highlights: [
      '80 training hours',
      'Earn: Certificate of Completion',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Recovery principles',
      'Active listening',
      'Resource connection',
      'Ethical boundaries'
    ],
    outcomes: [
      'Peer Support Professional Program',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=peer-support' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 750,
  },
    {
    slug: 'pharmacy-technician',
    name: 'Pharmacy Technician',
    heroTitle: 'Pharmacy Technician',
    heroSubtitle: 'Become a certified pharmacy technician. Prepare and dispense medications under pharmacist supervision.',
    shortDescription: 'Become a certified pharmacy technician. Prepare and dispense medications under pharmacist supervision.',
    longDescription: `Our Pharmacy Technician program prepares you for a rewarding career in pharmacy settings. You'll learn medication preparation, prescription processing, inventory management, and pharmacy law.`,
    heroImage: '/images/pages/phlebotomy-draw.jpg',
    heroImageAlt: 'Pharmacy Technician training at Elevate for Humanity',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: '16 weeks',
    clockHours: 640,
    schedule: '640 hours',
    delivery: 'Hybrid (Classroom + Clinical)',
    credential: 'Certified Pharmacy Technician (CPhT)',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '16 weeks program',
      '640 training hours',
      'Earn: Certified Pharmacy Technician (CPhT)',
      'Salary range: $30,000-$45,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Medication preparation and compounding',
      'Prescription processing and verification',
      'Pharmacy calculations and measurements',
      'Drug classifications and interactions',
      'Inventory management and ordering',
      'Insurance billing and claims',
      'Pharmacy law and ethics',
      'Sterile and non-sterile compounding'
    ],
    outcomes: [
      'Entry-level pharmacy technician',
      'Senior or lead pharmacy technician',
      'Specialty pharmacy technician',
      'Pharmacy supervisor or manager',
      'Advancement to pharmacist with additional education'
    ],
    requirements: [
      'High school diploma or GED, background check, drug screen, basic math skills'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=pharmacy-technician' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 5200,
  },
    {
    slug: 'plumbing',
    name: 'Plumbing Apprenticeship',
    heroTitle: 'Plumbing Apprenticeship',
    heroSubtitle: 'DOL-registered plumbing apprenticeship.',
    shortDescription: 'DOL-registered plumbing apprenticeship.',
    longDescription: `DOL-registered plumbing apprenticeship.`,
    heroImage: '/images/pages/plumbing.jpg',
    heroImageAlt: 'Plumbing Apprenticeship training at Elevate for Humanity',
    heroVideo: '/videos/electrician-trades.mp4',
    duration: 'Varies',
    clockHours: 0,
    schedule: 'Contact for schedule',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      'Earn: Certificate of Completion',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Plumbing Apprenticeship fundamentals',
      'Hands-on practical training',
      'Industry certification preparation',
      'Job readiness and placement support'
    ],
    outcomes: [
      'Plumbing Apprenticeship',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=plumbing' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 5500,
  },
    {
    slug: 'real-estate-agent',
    name: 'Real Estate Agent',
    heroTitle: 'Real Estate Agent',
    heroSubtitle: 'Help people buy and sell properties. Earn commission-based income with unlimited potential.',
    shortDescription: 'Help people buy and sell properties. Earn commission-based income with unlimited potential.',
    longDescription: `Our Real Estate Agent program prepares you for your state licensing exam and a successful real estate career. You'll learn property law, contracts, financing, and market analysis. The program covers listing properties, working with buyers, negotiation, and closing transactions. You'll understand ethics, fair housing, and professional practices. Real estate offers flexible schedules and unlimited income potential.`,
    heroImage: '/images/pages/admin-business-hero.jpg',
    heroImageAlt: 'Real Estate Agent training at Elevate for Humanity',
    heroVideo: '/videos/partner-business.mp4',
    duration: '12 weeks',
    clockHours: 480,
    schedule: '480 hours',
    delivery: 'Hybrid (Classroom + Online)',
    credential: 'Licensed Real Estate Agent',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans',
      'Self-funded',
      'Brokerage sponsorship'
    ],
    highlights: [
      '12 weeks program',
      '480 training hours',
      'Earn: Licensed Real Estate Agent',
      'Salary range: $30,000-$100,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Real estate law and regulations',
      'Property valuation and pricing',
      'Contracts and legal documents',
      'Financing and mortgages',
      'Marketing and lead generation',
      'Negotiation techniques',
      'Client relationship management',
      'Ethics and professional standards'
    ],
    outcomes: [
      'Licensed real estate agent',
      'Top-producing agent',
      'Team leader',
      'Real estate broker',
      'Brokerage owner'
    ],
    requirements: [
      'High school diploma or GED, age 18+, pass state exam, background check'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=real-estate-agent' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 4200,
  },
    {
    slug: 'recovery-coach',
    name: 'Recovery Coach Program',
    heroTitle: 'Recovery Coach Program',
    heroSubtitle: 'Guide recovery journey',
    shortDescription: 'Guide recovery journey',
    longDescription: `Training to guide and support individuals through their recovery journey.`,
    heroImage: '/images/pages/career-counseling.jpg',
    heroImageAlt: 'Recovery Coach Program training at Elevate for Humanity',
    heroVideo: '/videos/career-services-hero.mp4',
    duration: 'Varies',
    clockHours: 80,
    schedule: '80 hours',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'WRG'
    ],
    highlights: [
      '80 training hours',
      'Earn: Certificate of Completion',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'Motivational interviewing',
      'Recovery planning',
      'Relapse prevention',
      'Community resources'
    ],
    outcomes: [
      'Recovery Coach Program',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=recovery-coach' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 750,
  },
    {
    slug: 'sanitation-infection-control',
    name: 'Sanitation & Infection Control',
    heroTitle: 'Sanitation & Infection Control',
    heroSubtitle: 'Infection prevention and sanitation protocols.',
    shortDescription: 'Infection prevention and sanitation protocols.',
    longDescription: `Infection prevention and sanitation protocols.`,
    heroImage: '/images/pages/cna-patient-care.jpg',
    heroImageAlt: 'Sanitation & Infection Control training at Elevate for Humanity',
    heroVideo: '/videos/healthcare-cna.mp4',
    duration: 'Varies',
    clockHours: 0,
    schedule: 'Contact for schedule',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      'Earn: Certificate of Completion',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Sanitation & Infection Control fundamentals',
      'Hands-on practical training',
      'Industry certification preparation',
      'Job readiness and placement support'
    ],
    outcomes: [
      'Sanitation & Infection Control',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=sanitation-infection-control' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 575,
  },
    {
    slug: 'solar-panel-installation',
    name: 'Solar Panel Installation',
    heroTitle: 'Solar Panel Installation',
    heroSubtitle: 'Install solar energy systems. Green career in renewable energy with strong growth.',
    shortDescription: 'Install solar energy systems. Green career in renewable energy with strong growth.',
    longDescription: `Our Solar Panel Installation program prepares you for a career in renewable energy. You'll learn photovoltaic system design, electrical wiring, roof work, and safety procedures. The program covers system sizing, equipment selection, installation techniques, and maintenance. You'll gain hands-on experience with real solar installations and prepare for NABCEP certification. Solar installers are in high demand as clean energy adoption accelerates.`,
    heroImage: '/images/pages/electrical.jpg',
    heroImageAlt: 'Solar Panel Installation training at Elevate for Humanity',
    heroVideo: '/videos/electrician-trades.mp4',
    duration: '12 weeks',
    clockHours: 480,
    schedule: '480 hours',
    delivery: 'Hybrid (Classroom + Field)',
    credential: 'NABCEP PV Installation Professional',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans',
      'Green jobs funding'
    ],
    highlights: [
      '12 weeks program',
      '480 training hours',
      'Earn: NABCEP PV Installation Professional',
      'Salary range: $38,000-$65,000/year',
      'Funding: WIOA, Workforce Ready Grant'
    ],
    whatYouLearn: [
      'Photovoltaic system fundamentals',
      'Electrical theory and wiring',
      'Roof assessment and mounting',
      'System design and sizing',
      'Equipment installation and connection',
      'Safety procedures and fall protection',
      'System testing and commissioning',
      'Maintenance and troubleshooting'
    ],
    outcomes: [
      'Solar installer',
      'Lead installer',
      'Solar technician',
      'Project manager',
      'Solar company owner'
    ],
    requirements: [
      'High school diploma or GED, physical fitness, comfort with heights, basic electrical knowledge helpful'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=solar-panel-installation' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 4200,
  },
    {
    slug: 'web-development',
    name: 'Web Development',
    heroTitle: 'Web Development',
    heroSubtitle: 'Build modern websites and web applications. Full-stack development training.',
    shortDescription: 'Build modern websites and web applications. Full-stack development training.',
    longDescription: `Our Web Development program teaches you to create professional websites and web applications. You'll learn HTML, CSS, JavaScript, and modern frameworks like React. The program covers both front-end design and back-end programming, databases, and deployment. You'll build a portfolio of real projects and learn industry-standard tools. Web developers are in high demand with flexible work options including remote positions.`,
    heroImage: '/images/pages/technology-sector.jpg',
    heroImageAlt: 'Web Development training at Elevate for Humanity',
    heroVideo: '/videos/it-technology.mp4',
    duration: '24 weeks',
    clockHours: 960,
    schedule: '960 hours',
    delivery: 'Hybrid (Classroom + Online)',
    credential: 'Full-Stack Web Developer',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Workforce Ready Grant',
      'Payment Plans'
    ],
    highlights: [
      '24 weeks program',
      '960 training hours',
      'Earn: Full-Stack Web Developer',
      'Salary range: $50,000-$95,000/year',
      'Funding: WIOA, WRG'
    ],
    whatYouLearn: [
      'HTML, CSS, and JavaScript fundamentals',
      'Responsive web design',
      'React and modern frameworks',
      'Back-end development with Node.js',
      'Database design and SQL',
      'API development and integration',
      'Version control with Git',
      'Deployment and hosting'
    ],
    outcomes: [
      'Junior web developer',
      'Front-end developer',
      'Back-end developer',
      'Full-stack developer',
      'Lead developer or architect'
    ],
    requirements: [
      'High school diploma or GED, logical thinking, creativity, basic computer skills'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=web-development' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 7500,
  },
    {
    slug: 'welding',
    name: 'Welding Certification',
    heroTitle: 'Welding Certification',
    heroSubtitle: 'Welding certification covering MIG, TIG, and stick.',
    shortDescription: 'Welding certification covering MIG, TIG, and stick.',
    longDescription: `Welding certification covering MIG, TIG, and stick.`,
    heroImage: '/images/pages/welding-sparks.jpg',
    heroImageAlt: 'Welding Certification training at Elevate for Humanity',
    heroVideo: '/videos/welding-trades.mp4',
    duration: 'Varies',
    clockHours: 0,
    schedule: 'Contact for schedule',
    delivery: 'In-Person',
    credential: 'Certificate of Completion',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      'Earn: Certificate of Completion',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Welding Certification fundamentals',
      'Hands-on practical training',
      'Industry certification preparation',
      'Job readiness and placement support'
    ],
    outcomes: [
      'Welding Certification',
      'Entry-level positions in the field'
    ],
    requirements: [
      'High school diploma or GED'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=welding' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 5500,
  },
    {
    slug: 'youth-culinary-apprenticeship',
    name: 'Youth Culinary Apprenticeship',
    heroTitle: 'Youth Culinary Apprenticeship',
    heroSubtitle: 'DOL Registered Apprenticeship - Indiana. 144 hours classroom + OJT. RAPIDS Program: 2025-IN-132301.',
    shortDescription: 'DOL Registered Apprenticeship - Indiana. 144 hours classroom + OJT. RAPIDS Program: 2025-IN-132301.',
    longDescription: `Youth culinary program for ages 16-24. Learn cooking fundamentals, food safety, and kitchen skills while earning industry credentials.`,
    heroImage: '/images/pages/training-classroom.jpg',
    heroImageAlt: 'Youth Culinary Apprenticeship training at Elevate for Humanity',
    heroVideo: '/videos/program-hero.mp4',
    duration: '8 weeks',
    clockHours: 200,
    schedule: '200 hours',
    delivery: 'in-person',
    credential: 'ServSafe Food Handler',
    approvals: ['Elevate for Humanity Career & Technical Institute'],
    fundingOptions: [
      'WIOA',
      'Payment Plans'
    ],
    highlights: [
      '8 weeks program',
      '200 training hours',
      'Earn: ServSafe Food Handler',
      'Salary range: $24,000-$35,000/year',
      'Funding: WIOA, Payment Plans'
    ],
    whatYouLearn: [
      'Basic cooking techniques',
      'Food safety',
      'Kitchen sanitation',
      'Recipe reading',
      'Teamwork',
      'Time management'
    ],
    outcomes: [
      'Prep Cook',
      'Line Cook',
      'Food Service Worker',
      'Kitchen Assistant'
    ],
    requirements: [
      '{"Ages 16-24","Enrolled in school or GED program"}'
    ],
    ctaPrimary: { label: 'Apply Now', href: '/apply?program=youth-culinary-apprenticeship' },
    ctaSecondary: { label: 'Learn More', href: '/funding' },
    price: 1800,
  }];

/**
 * Get program by slug
 */
export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

/**
 * Get all programs
 */
export function getAllPrograms(): Program[] {
  return programs;
}

/**
 * Get programs by category (for filtering)
 */
export function getProgramsByCategory(category: string): Program[] {
  // Add category field to Program type if needed for filtering
  return programs;
}
