import type { InterviewQuestion, ScoringRubric } from './types';

/**
 * Program-specific interview questions for PARS AI Interview System
 * Each program has 8 questions with domain-specific content
 */

// Barber Apprenticeship Questions
const barberApprenticeshipQuestions: InterviewQuestion[] = [
  {
    id: 'barber-1',
    question: 'Describe your experience with sanitation and hygiene practices in a barber shop or similar setting. What sanitization procedures are you familiar with?',
    domain: 'Technical Skills',
    followUps: [
      'What specific sanitation products or equipment have you used?',
      'How do you maintain a clean workstation between clients?'
    ],
    scoringRubric: {
      excellent: 'Detailed knowledge of OSHA-compliant sanitation protocols, specific product names, and systematic workstation cleaning procedures',
      good: 'General understanding of sanitation importance with some specific examples',
      fair: 'Basic awareness of hygiene importance without detailed knowledge',
      poor: 'No relevant experience or minimal awareness of sanitation requirements'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'barber-2',
    question: 'Tell me about a time when you had to deal with a difficult customer. How did you handle the situation?',
    domain: 'Customer Service',
    followUps: [
      'What was the outcome of that interaction?',
      'What would you do differently if faced with a similar situation?'
    ],
    scoringRubric: {
      excellent: 'Clear conflict resolution story with empathy, professionalism, and positive outcome',
      good: 'Reasonable approach to customer service with some communication details',
      fair: 'General idea of customer service without specific examples',
      poor: 'No relevant experience or defensive approach'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'barber-3',
    question: 'The barber industry requires standing for extended periods and performing repetitive motions. Are you able to stand for 6-8 hours and perform detailed hand movements?',
    domain: 'Physical Requirements',
    followUps: [
      'Have you had any physical limitations that might affect your ability to stand or perform detailed work?',
      'How do you maintain stamina during long work sessions?'
    ],
    scoringRubric: {
      excellent: 'Confirmed ability to meet physical requirements with specific strategies for maintaining stamina',
      good: 'Affirms ability with minor health considerations that can be managed',
      fair: 'Uncertain about physical capabilities or requires accommodations',
      poor: 'Physical limitations that would prevent completion of program'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'barber-4',
    question: 'What attracts you to the barbering profession, and where do you see yourself in this career field in 5 years?',
    domain: 'Motivation',
    followUps: [
      'What specific skills or techniques do you want to master?',
      'Have you considered opening your own barbershop?'
    ],
    scoringRubric: {
      excellent: 'Clear career vision with specific goals, passion for the craft, and entrepreneurial mindset',
      good: 'Shows genuine interest with some career planning',
      fair: 'General interest without specific goals',
      poor: 'Vague or purely financial motivation'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'barber-5',
    question: 'Describe your experience with different hair types and textures. How do you adapt your techniques for different clients?',
    domain: 'Technical Skills',
    followUps: [
      'What hair types have you worked with?',
      'How do you stay updated on current trends and techniques?'
    ],
    scoringRubric: {
      excellent: 'Knowledge of diverse hair types with specific technique adaptations',
      good: 'Basic understanding with willingness to learn more',
      fair: 'Limited experience but eager to learn',
      poor: 'No relevant experience and no interest in learning'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'barber-6',
    question: 'Have you ever worked in a commission-based or tip-based compensation environment? How do you feel about that structure?',
    domain: 'Workplace Expectations',
    followUps: [
      'What experience do you have with sales or upselling services?',
      'How do you build rapport with clients to encourage repeat business?'
    ],
    scoringRubric: {
      excellent: 'Positive attitude toward earning potential through service quality, understanding of business model',
      good: 'Accepts structure with some questions',
      fair: 'Neutral attitude, needs more information',
      poor: 'Negative attitude or expectation of guaranteed income'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'barber-7',
    question: 'What safety protocols are important in a barber shop, and how would you handle an emergency situation?',
    domain: 'Safety & Compliance',
    followUps: [
      'Are you familiar with bloodborne pathogen training?',
      'How would you handle a client who becomes ill during a service?'
    ],
    scoringRubric: {
      excellent: 'Comprehensive safety knowledge including OSHA requirements, first aid awareness',
      good: 'Basic safety awareness with willingness to learn protocols',
      fair: 'Some awareness but gaps in knowledge',
      poor: 'No safety awareness or cavalier attitude'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'barber-8',
    question: 'Do you have any experience with business management, marketing, or social media for a salon/barber shop?',
    domain: 'Entrepreneurship',
    followUps: [
      'How do you plan to build your client base?',
      'Are you interested in eventually owning your own business?'
    ],
    scoringRubric: {
      excellent: 'Proactive business mindset with specific marketing/social media experience',
      good: 'Some business awareness with interest in learning',
      fair: 'Limited business experience but open to learning',
      poor: 'No interest in business aspects'
    },
    weight: 1,
    requiredDomain: false
  }
];

// CDL Training Questions
const cdlTrainingQuestions: InterviewQuestion[] = [
  {
    id: 'cdl-1',
    question: 'Please describe your complete driving history, including any accidents, violations, or suspensions. Be specific about dates and circumstances.',
    domain: 'Driving Record',
    followUps: [
      'What have you learned from any incidents on your record?',
      'How has your driving behavior changed since any violations?'
    ],
    scoringRubric: {
      excellent: 'Complete transparency with verifiable clean record or fully explained incidents with documented improvement',
      good: 'Honest disclosure with reasonable explanations',
      fair: 'Partial disclosure with some concerns',
      poor: 'Concealed violations, license issues, or excessive violations'
    },
    weight: 3,
    requiredDomain: true
  },
  {
    id: 'cdl-2',
    question: 'Are you familiar with DOT (Department of Transportation) regulations? What aspects of DOT compliance are you aware of?',
    domain: 'DOT Compliance',
    followUps: [
      'Have you had any DOT audits or inspections?',
      'What do you know about DOT drug and alcohol testing requirements?'
    ],
    scoringRubric: {
      excellent: 'Comprehensive knowledge of DOT regulations including hours of service, medical requirements',
      good: 'Basic DOT awareness with specific areas of knowledge',
      fair: 'Limited DOT knowledge but willing to learn',
      poor: 'No DOT knowledge and no interest in learning'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'cdl-3',
    question: 'Explain your understanding of HOS (Hours of Service) regulations. Why are they important for commercial drivers?',
    domain: 'HOS Regulations',
    followUps: [
      'How do you plan to maintain logs under HOS requirements?',
      'What would you do if you were pressured to exceed HOS limits?'
    ],
    scoringRubric: {
      excellent: 'Detailed HOS knowledge including 11-hour driving limit, 14-hour window, 30-minute breaks',
      good: 'Basic understanding with awareness of importance',
      fair: 'Heard of HOS but limited understanding',
      poor: 'No knowledge or dismissive attitude toward regulations'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'cdl-4',
    question: 'Describe any experience you have with driving manual transmission vehicles or large commercial vehicles.',
    domain: 'Technical Skills',
    followUps: [
      'What types of vehicles have you operated?',
      'Are you comfortable with backing and maneuvering large vehicles?'
    ],
    scoringRubric: {
      excellent: 'Extensive experience with manual transmissions and CDL-class vehicles',
      good: 'Some experience with manual vehicles or smaller trucks',
      fair: 'No experience but strong willingness to learn',
      poor: 'No experience and hesitant about manual transmissions'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'cdl-5',
    question: 'The trucking industry involves extended time away from home. How do you feel about overnight driving and being on the road for days at a time?',
    domain: 'Lifestyle Fit',
    followUps: [
      'What is your experience with being away from home for extended periods?',
      'How do you plan to maintain work-life balance in this career?'
    ],
    scoringRubric: {
      excellent: 'Clear understanding of lifestyle demands with realistic expectations and coping strategies',
      good: 'Accepts lifestyle with minor concerns',
      fair: 'Mixed feelings, needs more information',
      poor: 'Strong objections to time away from home'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'cdl-6',
    question: 'What would you do in an emergency situation on the road, such as a breakdown, accident, or severe weather?',
    domain: 'Safety & Problem Solving',
    followUps: [
      'Are you trained in basic vehicle maintenance or emergency procedures?',
      'How do you handle high-stress situations while driving?'
    ],
    scoringRubric: {
      excellent: 'Systematic emergency response knowledge including communication protocols, safety measures',
      good: 'Basic emergency awareness with reasonable approach',
      fair: 'Limited emergency knowledge',
      poor: 'No plan or panic response'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'cdl-7',
    question: 'Have you had any experience with loading and unloading cargo, securing loads, or understanding weight distribution?',
    domain: 'Technical Skills',
    followUps: [
      'What types of cargo have you handled?',
      'Are you familiar with load securement regulations?'
    ],
    scoringRubric: {
      excellent: 'Detailed cargo handling experience with weight distribution knowledge',
      good: 'Some cargo handling experience',
      fair: 'No experience but willing to learn',
      poor: 'No experience and no interest in cargo operations'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'cdl-8',
    question: 'Why are you pursuing CDL training now, and what are your career goals in the trucking industry?',
    domain: 'Motivation',
    followUps: [
      'What specific driving jobs or industries are you interested in?',
      'Where do you see yourself in 5 years as a commercial driver?'
    ],
    scoringRubric: {
      excellent: 'Clear career motivation with specific goals (dedicated routes, owner-operator, specialized driving)',
      good: 'Reasonable motivation with some career planning',
      fair: 'General interest in driving jobs',
      poor: 'Vague motivation or purely financial without career focus'
    },
    weight: 1,
    requiredDomain: false
  }
];

// HVAC Questions
const hvacQuestions: InterviewQuestion[] = [
  {
    id: 'hvac-1',
    question: 'Describe any technical or mechanical background you have. Have you worked with electrical systems, plumbing, or building maintenance?',
    domain: 'Technical Background',
    followUps: [
      'What specific mechanical skills have you developed?',
      'Have you used any technical diagnostic equipment?'
    ],
    scoringRubric: {
      excellent: 'Strong mechanical/technical background with specific examples of electrical, plumbing, or HVAC-adjacent work',
      good: 'Some technical experience with eagerness to learn more',
      fair: 'Limited technical background but interested in the field',
      poor: 'No technical background and no mechanical aptitude'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'hvac-2',
    question: 'HVAC technicians often work in confined spaces like attics, crawl spaces, and ductwork. Are you comfortable working in tight, enclosed areas?',
    domain: 'Physical Requirements',
    followUps: [
      'What is the most confined space you have worked in?',
      'Are you comfortable with heights such as ladders and rooftops?'
    ],
    scoringRubric: {
      excellent: 'Confirmed comfort in confined spaces with experience in crawl spaces and attics',
      good: 'Generally comfortable with minor concerns',
      fair: 'Uncertain but willing to try',
      poor: 'Severe claustrophobia or physical limitations preventing confined space work'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'hvac-3',
    question: 'What do you know about EPA Section 608 certification requirements for handling refrigerants?',
    domain: 'EPA 608',
    followUps: [
      'Are you aware of the different refrigerant types and their regulations?',
      'Have you had any environmental safety training?'
    ],
    scoringRubric: {
      excellent: 'Detailed knowledge of EPA 608 requirements, refrigerant types, and environmental compliance',
      good: 'Basic awareness of EPA certification importance',
      fair: 'Limited knowledge but willing to become certified',
      poor: 'No knowledge and dismissive of environmental regulations'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'hvac-4',
    question: 'HVAC work involves working with tools, reading blueprints, and troubleshooting problems. How do you approach learning new technical skills?',
    domain: 'Learning Ability',
    followUps: [
      'What technical skills have you taught yourself?',
      'How do you stay updated with new HVAC technologies?'
    ],
    scoringRubric: {
      excellent: 'Demonstrated self-learning ability with specific examples, enthusiasm for technical challenges',
      good: 'Positive attitude toward learning with some examples',
      fair: 'Willingness to learn but no specific examples',
      poor: 'Reluctance to learn new skills or defensive about current abilities'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'hvac-5',
    question: 'Describe your experience with customer service in a technical or trade setting. How do you communicate technical concepts to non-technical customers?',
    domain: 'Customer Communication',
    followUps: [
      'How do you handle customer complaints about costs or service issues?',
      'What experience do you have with service agreements or maintenance contracts?'
    ],
    scoringRubric: {
      excellent: 'Strong customer communication skills with ability to explain technical issues simply',
      good: 'Some customer service experience with reasonable communication',
      fair: 'Limited customer service but willing to develop skills',
      poor: 'Poor customer service attitude or communication skills'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'hvac-6',
    question: 'HVAC technicians must be able to lift heavy equipment and work in various weather conditions. What is your physical capability for this type of work?',
    domain: 'Physical Requirements',
    followUps: [
      'What is the heaviest object you have regularly lifted?',
      'Are you comfortable working in extreme heat or cold?'
    ],
    scoringRubric: {
      excellent: 'Confirmed ability to meet physical demands with specific examples of heavy lifting',
      good: 'Generally capable with minor limitations',
      fair: 'Uncertain about capabilities',
      poor: 'Physical limitations that would prevent HVAC work'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'hvac-7',
    question: 'Safety is critical in HVAC work involving electricity, gas, and refrigerants. What safety practices are you familiar with?',
    domain: 'Safety Knowledge',
    followUps: [
      'Have you had any safety certifications or training?',
      'How do you ensure safety when working with gas lines or electrical systems?'
    ],
    scoringRubric: {
      excellent: 'Comprehensive safety knowledge including lockout/tagout, gas leak procedures, electrical safety',
      good: 'Basic safety awareness with specific examples',
      fair: 'Limited safety knowledge but understands importance',
      poor: 'Dismissive attitude toward safety or no awareness'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'hvac-8',
    question: 'Why are you interested in pursuing an HVAC career, and what aspects of the field appeal to you most?',
    domain: 'Motivation',
    followUps: [
      'What specific HVAC certifications are you planning to obtain?',
      'Where do you see yourself in the HVAC industry in 5 years?'
    ],
    scoringRubric: {
      excellent: 'Clear motivation with specific interests (installation, service, refrigeration, energy efficiency)',
      good: 'Genuine interest with some career planning',
      fair: 'General interest in trades work',
      poor: 'Vague motivation or solely financial reasons'
    },
    weight: 1,
    requiredDomain: false
  }
];

// Medical Assistant Questions
const medicalAssistantQuestions: InterviewQuestion[] = [
  {
    id: 'medical-1',
    question: 'What do you understand about HIPAA regulations and the importance of patient confidentiality in healthcare settings?',
    domain: 'HIPAA',
    followUps: [
      'Can you describe situations where patient confidentiality might be challenged?',
      'How do you handle requests for patient information from family members?'
    ],
    scoringRubric: {
      excellent: 'Comprehensive HIPAA knowledge with specific examples of confidentiality scenarios',
      good: 'Basic understanding with awareness of importance',
      fair: 'Limited HIPAA knowledge but willing to learn',
      poor: 'No HIPAA awareness or dismissive of confidentiality requirements'
    },
    weight: 3,
    requiredDomain: true
  },
  {
    id: 'medical-2',
    question: 'Describe your experience with direct patient care. What patient interaction experience do you have?',
    domain: 'Patient Care',
    followUps: [
      'How do you approach patients who are anxious or in pain?',
      'What experience do you have with taking patient histories or vital signs?'
    ],
    scoringRubric: {
      excellent: 'Direct patient care experience with specific examples of patient interaction',
      good: 'Some healthcare experience with eagerness to learn',
      fair: 'No direct patient care but genuine interest in helping people',
      poor: 'No interest in patient interaction or uncomfortable with care duties'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'medical-3',
    question: 'Medical assistants perform clinical tasks including taking vital signs, drawing blood, and administering medications. What clinical skills are you comfortable with?',
    domain: 'Clinical Skills',
    followUps: [
      'Have you had any phlebotomy or injection training?',
      'How do you stay calm during medical procedures?'
    ],
    scoringRubric: {
      excellent: 'Current clinical skills with certifications (phlebotomy, EKG, CPR) and specific procedure experience',
      good: 'Some clinical exposure with willingness to obtain certifications',
      fair: 'No clinical skills but committed to learning',
      poor: 'Reluctance to perform clinical procedures'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'medical-4',
    question: 'Healthcare settings can be fast-paced and stressful. How do you handle pressure and prioritize tasks when things get busy?',
    domain: 'Workplace Resilience',
    followUps: [
      'Describe a high-pressure situation you have faced. How did you handle it?',
      'How do you maintain accuracy when working quickly?'
    ],
    scoringRubric: {
      excellent: 'Demonstrated stress management with specific coping strategies and examples',
      good: 'Reasonable stress tolerance with some strategies',
      fair: 'Some concern about stress but willing to develop skills',
      poor: 'Significant stress management issues or unable to prioritize'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'medical-5',
    question: 'What experience do you have with electronic health records (EHR) or medical software systems?',
    domain: 'Technical Skills',
    followUps: [
      'What medical software have you used?',
      'How do you ensure accuracy when documenting patient information?'
    ],
    scoringRubric: {
      excellent: 'EHR experience with specific system names and documentation proficiency',
      good: 'Basic computer skills with willingness to learn EHR systems',
      fair: 'Limited computer experience but eager to learn',
      poor: 'Uncomfortable with computers or resistant to EHR systems'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'medical-6',
    question: 'Medical assistants often work with diverse patient populations. How do you approach cultural differences and language barriers in patient care?',
    domain: 'Cultural Competency',
    followUps: [
      'What languages do you speak besides English?',
      'How would you use interpreter services if needed?'
    ],
    scoringRubric: {
      excellent: 'Cultural awareness with specific strategies for diverse patient populations',
      good: 'Basic cultural competency with openness to learning',
      fair: 'Limited experience but willing to develop awareness',
      poor: 'Cultural insensitivity or dismissive attitude'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'medical-7',
    question: 'Are you comfortable with exposure to blood, bodily fluids, and infectious diseases? What precautions do you take?',
    domain: 'Clinical Comfort',
    followUps: [
      'Have you had OSHA bloodborne pathogen training?',
      'What is your vaccination status for hepatitis B?'
    ],
    scoringRubric: {
      excellent: 'Comfortable with clinical environment, up-to-date on required vaccinations, OSHA trained',
      good: 'Generally comfortable with minor concerns',
      fair: 'Some hesitation but committed to clinical work',
      poor: 'Significant discomfort or refusal to work with infectious materials'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'medical-8',
    question: 'Why do you want to become a medical assistant, and what specific areas of healthcare are you most interested in?',
    domain: 'Motivation',
    followUps: [
      'What medical assistant certifications are you planning to obtain?',
      'Where do you see yourself in healthcare in 5 years?'
    ],
    scoringRubric: {
      excellent: 'Clear motivation with specific healthcare interests and career goals',
      good: 'Genuine interest in patient care with some planning',
      fair: 'General interest in healthcare work',
      poor: 'Vague motivation or solely financial reasons'
    },
    weight: 1,
    requiredDomain: false
  }
];

// Cosmetology Questions
const cosmetologyQuestions: InterviewQuestion[] = [
  {
    id: 'cosmetology-1',
    question: 'Describe your manual dexterity and hand steadiness. Cosmetologists need precise control for cutting, coloring, and styling.',
    domain: 'Manual Dexterity',
    followUps: [
      'What activities have you done that demonstrate your hand-eye coordination?',
      'Do you have any hobbies that require fine motor skills?'
    ],
    scoringRubric: {
      excellent: 'Demonstrated fine motor skills with specific examples from hobbies or work',
      good: 'Generally good dexterity with some examples',
      fair: 'Some concerns about dexterity but willing to practice',
      poor: 'Significant motor skill limitations that would affect performance'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'cosmetology-2',
    question: 'What experience do you have with chemical treatments like hair coloring, perming, relaxing, or lash extensions?',
    domain: 'Chemical Safety',
    followUps: [
      'Have you had any reactions to beauty products or chemicals?',
      'What safety precautions do you take when working with chemicals?'
    ],
    scoringRubric: {
      excellent: 'Extensive chemical treatment experience with safety knowledge',
      good: 'Some chemical experience with awareness of safety',
      fair: 'Limited experience but eager to learn',
      poor: 'No experience and no interest in chemical treatments'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'cosmetology-3',
    question: 'Are you aware of your state cosmetology licensing requirements? What do you know about the exam and training hours needed?',
    domain: 'State Licensing',
    followUps: [
      'Have you started preparing for the state board exam?',
      'What is your understanding of continuing education requirements?'
    ],
    scoringRubric: {
      excellent: 'Complete understanding of licensing requirements, exam format, and renewal process',
      good: 'Basic awareness of licensing needs',
      fair: 'Limited knowledge but committed to obtaining license',
      poor: 'No awareness of licensing requirements'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'cosmetology-4',
    question: 'Describe your experience with customer consultation. How do you help clients choose styles, colors, or treatments that suit them?',
    domain: 'Customer Consultation',
    followUps: [
      'How do you handle a client who wants an unsuitable style?',
      'What tools do you use for consultation (face shapes, color wheels, etc.)?'
    ],
    scoringRubric: {
      excellent: 'Strong consultation skills with specific techniques and communication examples',
      good: 'Basic consultation experience with some communication skills',
      fair: 'Limited consultation but eager to learn',
      poor: 'No consultation skills or dismissive of client needs'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'cosmetology-5',
    question: 'The beauty industry involves standing for long periods and repeated arm movements. Are you physically prepared for this?',
    domain: 'Physical Requirements',
    followUps: [
      'What is your stamina for standing and performing detailed work?',
      'Do you have any physical limitations that might affect your work?'
    ],
    scoringRubric: {
      excellent: 'Confirmed physical capability with strategies for maintaining stamina',
      good: 'Generally capable with minor considerations',
      fair: 'Uncertain about physical demands',
      poor: 'Physical limitations that would prevent cosmetology work'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'cosmetology-6',
    question: 'What is your experience with trend awareness and continuing education in the beauty industry?',
    domain: 'Industry Awareness',
    followUps: [
      'What beauty influencers or educators do you follow?',
      'How do you stay updated on new techniques and products?'
    ],
    scoringRubric: {
      excellent: 'Active engagement with industry trends, social media presence, continuing education',
      good: 'Some awareness with interest in staying current',
      fair: 'Limited trend awareness but willing to learn',
      poor: 'No interest in trends or professional development'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'cosmetology-7',
    question: 'Have you built a portfolio of your work? Describe any styling, coloring, or makeup work you have done.',
    domain: 'Portfolio Development',
    followUps: [
      'Do you have before/after photos of your work?',
      'Have you practiced on models or mannequins?'
    ],
    scoringRubric: {
      excellent: 'Active portfolio development with specific examples and photos',
      good: 'Some practice work with willingness to build portfolio',
      fair: 'Limited portfolio but committed to developing one',
      poor: 'No portfolio and no interest in building one'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'cosmetology-8',
    question: 'Why are you passionate about cosmetology, and what specific areas of the beauty industry interest you most?',
    domain: 'Motivation',
    followUps: [
      'What is your dream job in the beauty industry?',
      'Have you considered specialization (colorist, extensions, makeup artistry)?'
    ],
    scoringRubric: {
      excellent: 'Clear passion with specific interests and creative vision',
      good: 'Genuine interest with some career ideas',
      fair: 'General interest in beauty work',
      poor: 'Vague motivation or solely financial reasons'
    },
    weight: 1,
    requiredDomain: false
  }
];

// Phlebotomy Questions
const phlebotomyQuestions: InterviewQuestion[] = [
  {
    id: 'phlebotomy-1',
    question: 'Phlebotomy involves working with needles and drawing blood. Can you describe your comfort level with this aspect of the job?',
    domain: 'Needle Phobia Screening',
    followUps: [
      'Have you ever had blood drawn? How did you handle it?',
      'Are you comfortable helping patients who are nervous about needles?'
    ],
    scoringRubric: {
      excellent: 'Comfortable with blood draw procedures, calm demeanor, able to help anxious patients',
      good: 'Generally comfortable with minor concerns',
      fair: 'Some hesitation but committed to overcoming it',
      poor: 'Severe needle phobia or significant discomfort with blood'
    },
    weight: 3,
    requiredDomain: true
  },
  {
    id: 'phlebotomy-2',
    question: 'Phlebotomy requires excellent attention to detail for identifying patients, labeling specimens, and maintaining documentation. How do you ensure accuracy?',
    domain: 'Attention to Detail',
    followUps: [
      'Describe a time when your attention to detail prevented an error.',
      'How do you double-check your work in high-pressure situations?'
    ],
    scoringRubric: {
      excellent: 'Strong attention to detail with specific examples of accuracy-focused work',
      good: 'Generally careful with some strategies for accuracy',
      fair: 'Some concern about detail but willing to develop habits',
      poor: 'Careless attitude or history of errors'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'phlebotomy-3',
    question: 'What do you understand about HIPAA regulations and specimen handling confidentiality?',
    domain: 'HIPAA',
    followUps: [
      'How do you protect patient information when handling specimens?',
      'What steps do you take to ensure correct patient identification?'
    ],
    scoringRubric: {
      excellent: 'Comprehensive HIPAA knowledge with specimen chain of custody understanding',
      good: 'Basic HIPAA awareness with patient ID understanding',
      fair: 'Limited HIPAA knowledge but willing to learn',
      poor: 'No HIPAA awareness or dismissive of confidentiality'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'phlebotomy-4',
    question: 'Describe your experience with veins and venipuncture techniques. Have you had any training in blood collection?',
    domain: 'Technical Skills',
    followUps: [
      'What veins are most difficult to draw from and how do you handle them?',
      'Are you familiar with different blood draw equipment and tubes?'
    ],
    scoringRubric: {
      excellent: 'Phlebotomy training or certification with specific technique knowledge',
      good: 'Some phlebotomy exposure with eagerness to learn',
      fair: 'No experience but committed to obtaining training',
      poor: 'No interest in phlebotomy procedures'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'phlebotomy-5',
    question: 'How do you handle difficult draws, such as patients with small veins, scar tissue, or movement disorders?',
    domain: 'Problem Solving',
    followUps: [
      'What techniques do you use to find difficult veins?',
      'How do you stay calm when a draw is unsuccessful?'
    ],
    scoringRubric: {
      excellent: 'Multiple vein-finding techniques, warm packs, proper positioning strategies',
      good: 'Basic problem-solving approach with some techniques',
      fair: 'Limited experience but willing to learn techniques',
      poor: 'No strategies for difficult draws'
    },
    weight: 2,
    requiredDomain: false
  },
  {
    id: 'phlebotomy-6',
    question: 'Patient comfort and communication are crucial in phlebotomy. How do you prepare patients and keep them at ease during blood draws?',
    domain: 'Patient Communication',
    followUps: [
      'How do you explain the procedure to nervous patients?',
      'What do you say when a patient asks about test results?'
    ],
    scoringRubric: {
      excellent: 'Excellent patient communication with specific calming techniques',
      good: 'Reasonable communication with some patient care experience',
      fair: 'Some hesitation but committed to improving',
      poor: 'Poor communication or dismissive of patient concerns'
    },
    weight: 1,
    requiredDomain: false
  },
  {
    id: 'phlebotomy-7',
    question: 'Phlebotomists must follow strict safety protocols including OSHA bloodborne pathogen standards. What safety training have you had?',
    domain: 'Safety & Compliance',
    followUps: [
      'What PPE do you use during blood draws?',
      'How do you dispose of sharps and handle exposure incidents?'
    ],
    scoringRubric: {
      excellent: 'Comprehensive OSHA training with specific safety protocol knowledge',
      good: 'Basic safety awareness with willingness to learn',
      fair: 'Limited safety knowledge but understands importance',
      poor: 'No safety awareness or dismissive attitude'
    },
    weight: 2,
    requiredDomain: true
  },
  {
    id: 'phlebotomy-8',
    question: 'Why are you interested in pursuing phlebotomy certification, and what are your career goals in healthcare?',
    domain: 'Motivation',
    followUps: [
      'What healthcare certifications are you planning to obtain beyond phlebotomy?',
      'Where do you see yourself in 5 years?'
    ],
    scoringRubric: {
      excellent: 'Clear career path with phlebotomy as step toward healthcare goals',
      good: 'Genuine interest with some career planning',
      fair: 'General interest in phlebotomy work',
      poor: 'Vague motivation or solely financial reasons'
    },
    weight: 1,
    requiredDomain: false
  }
];

// Questions bank by program slug
const questionsByProgram: Record<string, InterviewQuestion[]> = {
  'barber-apprenticeship': barberApprenticeshipQuestions,
  'cdl-training': cdlTrainingQuestions,
  'hvac': hvacQuestions,
  'medical-assistant': medicalAssistantQuestions,
  'cosmetology': cosmetologyQuestions,
  'phlebotomy': phlebotomyQuestions
};

/**
 * Get all interview questions for a specific program
 * @param programSlug - The program identifier (e.g., 'barber-apprenticeship', 'cdl-training')
 * @returns Array of InterviewQuestion objects for the program
 */
export function getQuestionsForProgram(programSlug: string): InterviewQuestion[] {
  return questionsByProgram[programSlug] || [];
}

/**
 * Get a specific question by ID
 * @param questionId - The question identifier (e.g., 'barber-1', 'cdl-2')
 * @returns InterviewQuestion object or null if not found
 */
export function getQuestionById(questionId: string): InterviewQuestion | null {
  for (const questions of Object.values(questionsByProgram)) {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      return question;
    }
  }
  return null;
}

/**
 * Get the scoring rubric for a specific question
 * @param questionId - The question identifier
 * @returns ScoringRubric object or null if question not found
 */
export function getScoringRubric(questionId: string): ScoringRubric | null {
  const question = getQuestionById(questionId);
  return question?.scoringRubric || null;
}

/**
 * Get all supported programs
 * @returns Array of program slugs
 */
export function getSupportedPrograms(): string[] {
  return Object.keys(questionsByProgram);
}

/**
 * Get program metadata
 * @param programSlug - The program identifier
 * @returns Program metadata object or null if not found
 */
export function getProgramMetadata(programSlug: string): { 
  name: string; 
  questionCount: number;
  requiredDomains: string[];
  estimatedDuration: string;
} | null {
  const questions = questionsByProgram[programSlug];
  if (!questions) return null;

  const requiredDomains = [...new Set(
    questions.filter(q => q.requiredDomain).map(q => q.domain)
  )];

  return {
    name: formatProgramName(programSlug),
    questionCount: questions.length,
    requiredDomains,
    estimatedDuration: `${questions.length * 5}-${questions.length * 8} minutes`
  };
}

/**
 * Format program slug to display name
 * @param programSlug - The program identifier
 * @returns Human-readable program name
 */
function formatProgramName(programSlug: string): string {
  const names: Record<string, string> = {
    'barber-apprenticeship': 'Barber Apprenticeship',
    'cdl-training': 'CDL Training',
    'hvac': 'HVAC Technology',
    'medical-assistant': 'Medical Assistant',
    'cosmetology': 'Cosmetology',
    'phlebotomy': 'Phlebotomy'
  };
  return names[programSlug] || programSlug;
}

export default {
  getQuestionsForProgram,
  getQuestionById,
  getScoringRubric,
  getSupportedPrograms,
  getProgramMetadata
};
