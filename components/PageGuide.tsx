'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Lazy load the chat assistant - only loads when user interacts
const AvatarChatAssistant = dynamic(() => import('./AvatarChatAssistant'), {
  ssr: false,
  loading: () => null, // No loading state, invisible until ready
});

// Page guide configurations
const PAGE_GUIDES: Record<string, {
  avatarName: string;
  avatarRole: string;
  welcomeMessage: string;
  context: 'store' | 'home' | 'course' | 'financial' | 'vita' | 'general' | 'healthcare' | 'trades' | 'technology' | 'barber' | 'supersonic' | 'programs';
  videoFile: string;
}> = {
  home: {
    avatarName: 'Sarah',
    avatarRole: 'Welcome Guide',
    welcomeMessage: "Hi! I'm Sarah, your guide to Elevate for Humanity. Looking for free career training? I can help you find the right program. What interests you - healthcare, trades, technology, or barbering?",
    context: 'home',
    videoFile: '/videos/avatars/avatar-welcome.mp4',
  },
  store: {
    avatarName: 'Victoria',
    avatarRole: 'Store Assistant',
    welcomeMessage: "Welcome to our store! I'm Victoria, here to help you find study materials, workbooks, and certification prep resources. What are you looking for today?",
    context: 'store',
    videoFile: '/videos/avatars/avatar-store.mp4',
  },
  programs: {
    avatarName: 'Emma',
    avatarRole: 'Programs Guide',
    welcomeMessage: "Hi! I'm Emma. I can help you explore our training programs and find the perfect fit for your career goals. What field interests you?",
    context: 'programs',
    videoFile: '/videos/avatars/avatar-programs.mp4',
  },
  healthcare: {
    avatarName: 'Dr. Maria',
    avatarRole: 'Healthcare Instructor',
    welcomeMessage: "Welcome to healthcare training! I'm Dr. Maria. Our CNA, phlebotomy, and medical assistant programs can launch your healthcare career in just weeks. What would you like to know?",
    context: 'healthcare',
    videoFile: '/videos/avatars/avatar-healthcare.mp4',
  },
  cna: {
    avatarName: 'Nurse Angela',
    avatarRole: 'CNA Instructor',
    welcomeMessage: "Hi! I'm Nurse Angela. CNA training takes just 8-12 weeks and opens doors to nursing careers. Ready to start helping patients? Ask me anything!",
    context: 'healthcare',
    videoFile: '/videos/avatars/avatar-cna.mp4',
  },
  phlebotomy: {
    avatarName: 'Dr. Lisa',
    avatarRole: 'Phlebotomy Instructor',
    welcomeMessage: "Welcome! I'm Dr. Lisa. Phlebotomy is a great entry into healthcare - you'll learn blood collection techniques and patient care. How can I help?",
    context: 'healthcare',
    videoFile: '/videos/avatars/avatar-phlebotomy.mp4',
  },
  trades: {
    avatarName: 'Mike',
    avatarRole: 'Trades Instructor',
    welcomeMessage: "Hey! I'm Mike. Skilled trades mean good pay and job security. HVAC, electrical, welding - these careers can't be outsourced. What trade interests you?",
    context: 'trades',
    videoFile: '/videos/avatars/avatar-trades.mp4',
  },
  hvac: {
    avatarName: 'James',
    avatarRole: 'HVAC Instructor',
    welcomeMessage: "Welcome! I'm James. HVAC technicians are always in demand - hot or cold, people need climate control. Ready to learn about heating and cooling systems?",
    context: 'trades',
    videoFile: '/videos/avatars/avatar-hvac.mp4',
  },
  cdl: {
    avatarName: 'Guide',
    avatarRole: 'CDL Instructor',
    welcomeMessage: "Hey there! I'm Guide. CDL training gets you behind the wheel of a commercial truck. Great pay, see the country, be your own boss. Interested?",
    context: 'trades',
    videoFile: '/videos/avatars/avatar-cdl.mp4',
  },
  technology: {
    avatarName: 'Alex',
    avatarRole: 'Technology Instructor',
    welcomeMessage: "Hi! I'm Alex. Tech careers are the future - IT support, cybersecurity, cloud computing. No coding experience needed to start. What interests you?",
    context: 'technology',
    videoFile: '/videos/avatars/avatar-technology.mp4',
  },
  barber: {
    avatarName: 'Darius',
    avatarRole: 'Barber Instructor',
    welcomeMessage: "What's up! I'm Darius. Our barber apprenticeship is USDOL registered - you earn while you learn! 2,000 hours of training leads to your Indiana license. Ready to cut it up?",
    context: 'barber',
    videoFile: '/videos/avatars/avatar-barber.mp4',
  },
  financial: {
    avatarName: 'Michelle',
    avatarRole: 'Financial Aid Advisor',
    welcomeMessage: "Hi! I'm Michelle. Good news - most students qualify for FREE training through WIOA funding. Let me help you understand your options. What would you like to know?",
    context: 'financial',
    videoFile: '/videos/avatars/avatar-financial-aid.mp4',
  },
  vita: {
    avatarName: 'Patricia',
    avatarRole: 'VITA Tax Guide',
    welcomeMessage: "Welcome! I'm Patricia. If you earn under $64,000, you qualify for FREE tax preparation through VITA. Save $200+ and get your maximum refund. How can I help?",
    context: 'vita',
    videoFile: '/videos/avatars/avatar-vita.mp4',
  },
  supersonic: {
    avatarName: 'Rachel',
    avatarRole: 'Tax Preparation Guide',
    welcomeMessage: "Hey! I'm Rachel from Supersonic Fast Cash. Get your tax refund TODAY - up to $7,500 in just 15 minutes! Ready to get paid?",
    context: 'supersonic',
    videoFile: '/videos/avatars/avatar-supersonic.mp4',
  },
  aiTutor: {
    avatarName: 'Sophia',
    avatarRole: 'AI Learning Assistant',
    welcomeMessage: "Hi! I'm Sophia, your AI tutor. I can explain concepts, create study guides, and help you prepare for exams. What would you like to learn today?",
    context: 'course',
    videoFile: '/videos/avatars/avatar-ai-tutor.mp4',
  },
  resume: {
    avatarName: 'Jennifer',
    avatarRole: 'Resume Coach',
    welcomeMessage: "Hi! I'm Jennifer, your resume coach. I can help you build a professional resume, write cover letters, and prepare for interviews. What do you need help with?",
    context: 'resume',
    videoFile: '/videos/avatars/avatar-resume.mp4',
  },
  careerServices: {
    avatarName: 'David',
    avatarRole: 'Career Advisor',
    welcomeMessage: "Welcome! I'm David from Career Services. I help graduates find jobs, prepare for interviews, and connect with employers. How can I assist you today?",
    context: 'career',
    videoFile: '/videos/avatars/avatar-career.mp4',
  },
  enrollment: {
    avatarName: 'Lisa',
    avatarRole: 'Enrollment Advisor',
    welcomeMessage: "Hi! I'm Lisa. I can walk you through the enrollment process, help with your application, and answer questions about getting started. Ready to enroll?",
    context: 'enrollment',
    videoFile: '/videos/avatars/avatar-enrollment.mp4',
  },
  support: {
    avatarName: 'Chris',
    avatarRole: 'Student Support',
    welcomeMessage: "Hey! I'm Chris from Student Support. Having issues with your account, courses, or need help with something? I'm here for you!",
    context: 'support',
    videoFile: '/videos/avatars/avatar-support.mp4',
  },
  employers: {
    avatarName: 'Robert',
    avatarRole: 'Employer Relations',
    welcomeMessage: "Welcome! I'm Robert. Looking to hire trained graduates? We have job-ready candidates in healthcare, trades, and technology. How can we help your business?",
    context: 'employers',
    videoFile: '/videos/avatars/avatar-employers.mp4',
  },
};

// Fallback video for pages without specific avatars
const DEFAULT_VIDEO = '/videos/avatars/avatar-welcome.mp4';

interface PageGuideProps {
  page: keyof typeof PAGE_GUIDES;
  position?: 'bottom-right' | 'bottom-left';
  autoOpen?: boolean;
  delay?: number; // Delay in ms before showing the guide button
}

export default function PageGuide({ 
  page, 
  position = 'bottom-right',
  autoOpen = false,
  delay = 2000, // Default 2 second delay - lets page load first
}: PageGuideProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const config = PAGE_GUIDES[page];
  
  // Delay rendering to not impact initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);

  if (!config || !shouldRender) {
    return null;
  }

  // Check if video exists, use default if not
  const videoUrl = config.videoFile || DEFAULT_VIDEO;

  return (
    <AvatarChatAssistant
      avatarVideoUrl={videoUrl}
      avatarName={config.avatarName}
      avatarRole={config.avatarRole}
      welcomeMessage={config.welcomeMessage}
      context={config.context}
      position={position}
      autoOpen={autoOpen}
      autoPlayVideo={true}
    />
  );
}

// Export for use in other components
export { PAGE_GUIDES };
