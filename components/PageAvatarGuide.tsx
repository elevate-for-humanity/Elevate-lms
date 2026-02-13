'use client';

import dynamic from 'next/dynamic';

// Lazy load to not impact page load
const SideAvatarGuide = dynamic(() => import('./SideAvatarGuide'), {
  ssr: false,
  loading: () => null,
});

// Avatar configurations for each page/section
export const AVATAR_CONFIGS: Record<string, {
  avatarName: string;
  avatarRole: string;
  welcomeMessage: string;
  context: string;
  videoFile: string;
}> = {
  // === MAIN PAGES ===
  home: {
    avatarName: 'Sarah',
    avatarRole: 'Welcome Guide',
    welcomeMessage: "Hi! I'm Sarah. Welcome to Elevate for Humanity! We offer FREE career training in healthcare, trades, tech, and barbering. What career interests you?",
    context: 'home',
    videoFile: '/videos/avatars/home-guide.mp4',
  },
  programs: {
    avatarName: 'Emma',
    avatarRole: 'Programs Advisor',
    welcomeMessage: "Hi! I'm Emma. I can help you find the perfect training program. We have healthcare, skilled trades, technology, and barber programs. What sounds interesting?",
    context: 'programs',
    videoFile: '/videos/avatars/programs-guide.mp4',
  },
  
  // === STORE ===
  store: {
    avatarName: 'Victoria',
    avatarRole: 'Store Assistant',
    welcomeMessage: "Welcome! I'm Victoria. Need study materials, workbooks, or certification prep? I can help you find exactly what you need. What are you looking for?",
    context: 'store',
    videoFile: '/videos/avatars/store-guide.mp4',
  },
  
  // === HEALTHCARE ===
  healthcare: {
    avatarName: 'Dr. Maria',
    avatarRole: 'Healthcare Instructor',
    welcomeMessage: "Welcome to healthcare training! I'm Dr. Maria. CNA, phlebotomy, medical assistant - these careers are in high demand. Which one interests you?",
    context: 'healthcare',
    videoFile: '/videos/avatars/healthcare-guide.mp4',
  },
  cna: {
    avatarName: 'Nurse Angela',
    avatarRole: 'CNA Instructor',
    welcomeMessage: "Hi! I'm Nurse Angela. CNA training takes just 8-12 weeks and opens doors to nursing careers. Ready to start helping patients?",
    context: 'healthcare',
    videoFile: '/videos/avatars/cna-guide.mp4',
  },
  phlebotomy: {
    avatarName: 'Dr. Lisa',
    avatarRole: 'Phlebotomy Instructor',
    welcomeMessage: "Welcome! I'm Dr. Lisa. Phlebotomy is a great entry into healthcare. You'll learn blood collection and patient care. Any questions?",
    context: 'healthcare',
    videoFile: '/videos/avatars/phlebotomy-guide.mp4',
  },
  
  // === TRADES ===
  trades: {
    avatarName: 'Mike',
    avatarRole: 'Trades Instructor',
    welcomeMessage: "Hey! I'm Mike. Skilled trades mean good pay and job security. HVAC, electrical, welding - what trade interests you?",
    context: 'trades',
    videoFile: '/videos/avatars/trades-guide.mp4',
  },
  hvac: {
    avatarName: 'James',
    avatarRole: 'HVAC Instructor',
    welcomeMessage: "Welcome! I'm James. HVAC techs are always in demand. You'll get EPA certified and ready for a great career. Questions?",
    context: 'trades',
    videoFile: '/videos/avatars/hvac-guide.mp4',
  },
  cdl: {
    avatarName: 'Guide',
    avatarRole: 'CDL Instructor',
    welcomeMessage: "Hey! I'm Guide. CDL training gets you on the road earning good money. Ready to become a truck driver?",
    context: 'trades',
    videoFile: '/videos/avatars/cdl-guide.mp4',
  },
  
  // === TECHNOLOGY ===
  technology: {
    avatarName: 'Alex',
    avatarRole: 'Tech Instructor',
    welcomeMessage: "Hi! I'm Alex. Tech careers are the future. IT support, cybersecurity, cloud computing - no coding needed to start. Interested?",
    context: 'technology',
    videoFile: '/videos/avatars/tech-guide.mp4',
  },
  
  // === BARBER ===
  barber: {
    avatarName: 'Darius',
    avatarRole: 'Barber Instructor',
    welcomeMessage: "What's up! I'm Darius. Our barber apprenticeship is USDOL registered - you EARN while you learn! Ready to cut it up?",
    context: 'barber',
    videoFile: '/videos/avatars/barber-guide.mp4',
  },
  
  // === FINANCIAL ===
  financial: {
    avatarName: 'Michelle',
    avatarRole: 'Financial Aid Advisor',
    welcomeMessage: "Hi! I'm Michelle. Good news - most students qualify for FREE training through WIOA funding. Let me explain your options!",
    context: 'financial',
    videoFile: '/videos/avatars/financial-guide.mp4',
  },
  vita: {
    avatarName: 'Patricia',
    avatarRole: 'VITA Tax Guide',
    welcomeMessage: "Welcome! I'm Patricia. Earn under $64,000? You qualify for FREE tax preparation! Save $200+ on tax prep fees. How can I help?",
    context: 'vita',
    videoFile: '/videos/avatars/vita-guide.mp4',
  },
  elevate: {
    avatarName: 'Rachel',
    avatarRole: 'Tax Prep Guide',
    welcomeMessage: "Hey! I'm Rachel. Get your tax refund TODAY - up to $7,500 in just 15 minutes! Ready to get paid fast?",
    context: 'elevate',
    videoFile: '/videos/avatars/elevate-guide.mp4',
  },
  
  // === LMS ===
  lms: {
    avatarName: 'Sophia',
    avatarRole: 'AI Tutor',
    welcomeMessage: "Hi! I'm Sophia, your AI tutor. I can explain concepts, create study guides, and help you prepare for exams. What do you need help with?",
    context: 'course',
    videoFile: '/videos/avatars/ai-tutor.mp4',
  },
  dashboard: {
    avatarName: 'Sophia',
    avatarRole: 'Learning Assistant',
    welcomeMessage: "Welcome back! I'm Sophia. I can help you with your courses, track your progress, or answer questions. How can I help today?",
    context: 'course',
    videoFile: '/videos/avatars/ai-tutor.mp4',
  },
  
  // === PORTALS ===
  studentPortal: {
    avatarName: 'Chris',
    avatarRole: 'Student Support',
    welcomeMessage: "Hi! I'm Chris from Student Support. Need help with your account, courses, or have questions? I'm here for you!",
    context: 'support',
    videoFile: '/videos/avatars/student-support.mp4',
  },
  employerPortal: {
    avatarName: 'Robert',
    avatarRole: 'Employer Relations',
    welcomeMessage: "Welcome! I'm Robert. Looking to hire trained graduates? We have job-ready candidates in healthcare, trades, and tech. How can I help?",
    context: 'employers',
    videoFile: '/videos/avatars/employer-guide.mp4',
  },
  staffPortal: {
    avatarName: 'Admin Assistant',
    avatarRole: 'Staff Helper',
    welcomeMessage: "Hi! I can help you navigate the staff portal, find reports, or answer questions about processes. What do you need?",
    context: 'general',
    videoFile: '/videos/avatars/staff-guide.mp4',
  },
  
  // === CAREER SERVICES ===
  resume: {
    avatarName: 'Jennifer',
    avatarRole: 'Resume Coach',
    welcomeMessage: "Hi! I'm Jennifer, your resume coach. I can help you build a professional resume, write cover letters, and prepare for interviews. Where should we start?",
    context: 'resume',
    videoFile: '/videos/avatars/resume-guide.mp4',
  },
  careerServices: {
    avatarName: 'David',
    avatarRole: 'Career Advisor',
    welcomeMessage: "Welcome! I'm David from Career Services. I help graduates find jobs and connect with employers. How can I assist you?",
    context: 'career',
    videoFile: '/videos/avatars/career-guide.mp4',
  },
  
  // === ENROLLMENT ===
  apply: {
    avatarName: 'Lisa',
    avatarRole: 'Enrollment Advisor',
    welcomeMessage: "Hi! I'm Lisa. I'll walk you through the application process step by step. It's quick and easy. Ready to get started?",
    context: 'enrollment',
    videoFile: '/videos/avatars/enrollment-guide.mp4',
  },
  eligibility: {
    avatarName: 'Michelle',
    avatarRole: 'Eligibility Specialist',
    welcomeMessage: "Hi! I'm Michelle. Let me help you check if you qualify for FREE training. Most adults do! What's your situation?",
    context: 'financial',
    videoFile: '/videos/avatars/eligibility-guide.mp4',
  },
  
  // === STORE DEMOS ===
  storeDemo: {
    avatarName: 'Victoria',
    avatarRole: 'Demo Guide',
    welcomeMessage: "Welcome to the platform demo! I'm Victoria. Let me show you how our LMS works - student dashboards, course delivery, and admin features. What would you like to see?",
    context: 'storeDemo',
    videoFile: '/videos/avatars/store-demo-guide.mp4',
  },
  storeDemoAdmin: {
    avatarName: 'Victoria',
    avatarRole: 'Admin Demo Guide',
    welcomeMessage: "This is the admin dashboard demo. I'll show you reporting, student management, and program administration. What feature interests you most?",
    context: 'storeDemo',
    videoFile: '/videos/avatars/admin-demo-guide.mp4',
  },
  storeDemoStudent: {
    avatarName: 'Victoria',
    avatarRole: 'Student Demo Guide',
    welcomeMessage: "This is the student experience demo. See how learners access courses, track progress, and earn certificates. Want me to walk you through it?",
    context: 'storeDemo',
    videoFile: '/videos/avatars/student-demo-guide.mp4',
  },
  
  // === COURSES ===
  courses: {
    avatarName: 'Emma',
    avatarRole: 'Course Advisor',
    welcomeMessage: "Welcome to our course catalog! I'm Emma. We have healthcare, trades, technology, and business courses. What field interests you?",
    context: 'courses',
    videoFile: '/videos/avatars/courses-guide.mp4',
  },
  courseCNA: {
    avatarName: 'Nurse Angela',
    avatarRole: 'CNA Instructor',
    welcomeMessage: "Welcome to CNA Training! I'm Nurse Angela. This course prepares you for state certification in 8-12 weeks. Ready to start your healthcare career?",
    context: 'healthcare',
    videoFile: '/videos/avatars/cna-course.mp4',
  },
  coursePhlebotomy: {
    avatarName: 'Dr. Lisa',
    avatarRole: 'Phlebotomy Instructor',
    welcomeMessage: "Welcome to Phlebotomy Training! I'm Dr. Lisa. You'll learn blood collection, safety protocols, and patient care. Any questions about the course?",
    context: 'healthcare',
    videoFile: '/videos/avatars/phlebotomy-course.mp4',
  },
  courseMedicalAssistant: {
    avatarName: 'Dr. Karen',
    avatarRole: 'Medical Assistant Instructor',
    welcomeMessage: "Welcome to Medical Assistant Training! I'm Dr. Karen. This comprehensive program covers clinical and administrative skills. How can I help?",
    context: 'healthcare',
    videoFile: '/videos/avatars/ma-course.mp4',
  },
  courseHVAC: {
    avatarName: 'James',
    avatarRole: 'HVAC Instructor',
    welcomeMessage: "Welcome to HVAC Training! I'm James. You'll learn heating, cooling, refrigeration, and get EPA 608 certified. Ready to start?",
    context: 'trades',
    videoFile: '/videos/avatars/hvac-course.mp4',
  },
  courseCDL: {
    avatarName: 'Guide',
    avatarRole: 'CDL Instructor',
    welcomeMessage: "Welcome to CDL Training! I'm Guide. I'll help you get your Commercial Driver's License and start earning. Questions about the program?",
    context: 'trades',
    videoFile: '/videos/avatars/cdl-course.mp4',
  },
  courseElectrical: {
    avatarName: 'Robert',
    avatarRole: 'Electrical Instructor',
    welcomeMessage: "Welcome to Electrical Training! I'm Robert. Learn electrical fundamentals, safety, and hands-on skills. What would you like to know?",
    context: 'trades',
    videoFile: '/videos/avatars/electrical-course.mp4',
  },
  courseWelding: {
    avatarName: 'Mike',
    avatarRole: 'Welding Instructor',
    welcomeMessage: "Welcome to Welding Training! I'm Mike. MIG, TIG, stick welding - you'll learn it all. Ready to strike an arc?",
    context: 'trades',
    videoFile: '/videos/avatars/welding-course.mp4',
  },
  courseBarber: {
    avatarName: 'Darius',
    avatarRole: 'Barber Instructor',
    welcomeMessage: "Welcome to Barber Apprenticeship! I'm Darius. This USDOL program lets you earn while you learn. 2,000 hours to your license. Let's go!",
    context: 'barber',
    videoFile: '/videos/avatars/barber-course.mp4',
  },
  courseCosmetology: {
    avatarName: 'Jasmine',
    avatarRole: 'Cosmetology Instructor',
    welcomeMessage: "Welcome to Cosmetology Training! I'm Jasmine. Hair, nails, skincare - express your creativity while building a career. Interested?",
    context: 'beauty',
    videoFile: '/videos/avatars/cosmetology-course.mp4',
  },
  courseITSupport: {
    avatarName: 'David',
    avatarRole: 'IT Instructor',
    welcomeMessage: "Welcome to IT Support Training! I'm David. No experience needed - we'll teach you troubleshooting, networking, and customer service. Ready?",
    context: 'technology',
    videoFile: '/videos/avatars/it-course.mp4',
  },
  courseCybersecurity: {
    avatarName: 'Nina',
    avatarRole: 'Cybersecurity Instructor',
    welcomeMessage: "Welcome to Cybersecurity Training! I'm Nina. Learn to protect networks, detect threats, and launch a high-demand career. Questions?",
    context: 'technology',
    videoFile: '/videos/avatars/cybersecurity-course.mp4',
  },
  courseTaxPrep: {
    avatarName: 'Rachel',
    avatarRole: 'Tax Prep Instructor',
    welcomeMessage: "Welcome to Tax Preparation Training! I'm Rachel. Learn to prepare taxes and start your own business. It's easier than you think!",
    context: 'business',
    videoFile: '/videos/avatars/tax-course.mp4',
  },
};

// Default fallback
const DEFAULT_CONFIG = {
  avatarName: 'Assistant',
  avatarRole: 'Help Guide',
  welcomeMessage: "Hi! I'm here to help. Ask me anything about Elevate for Humanity's programs and services!",
  context: 'general',
  videoFile: '/videos/avatars/default-guide.mp4',
};

interface PageAvatarGuideProps {
  page: keyof typeof AVATAR_CONFIGS | string;
  side?: 'left' | 'right';
  autoStart?: boolean;
  showOnLoad?: boolean;
}

export default function PageAvatarGuide({
  page,
  side = 'right',
  autoStart = true,
  showOnLoad = true,
}: PageAvatarGuideProps) {
  const config = AVATAR_CONFIGS[page] || DEFAULT_CONFIG;

  return (
    <SideAvatarGuide
      avatarVideoUrl={config.videoFile}
      avatarName={config.avatarName}
      avatarRole={config.avatarRole}
      welcomeMessage={config.welcomeMessage}
      context={config.context}
      side={side}
      autoStart={autoStart}
      showOnLoad={showOnLoad}
    />
  );
}
