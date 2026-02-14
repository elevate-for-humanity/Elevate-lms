'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw } from 'lucide-react';

interface GuideStep {
  title: string;
  script: string;
  videoUrl?: string; // Optional different video per step
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface AvatarCourseGuideProps {
  avatarName: string;
  avatarRole: string;
  defaultVideoUrl: string;
  steps: GuideStep[];
  onComplete?: () => void;
  position?: 'left' | 'right' | 'bottom';
}

export default function AvatarCourseGuide({
  avatarName,
  avatarRole,
  defaultVideoUrl,
  steps,
  onComplete,
  position = 'right',
}: AvatarCourseGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Delay showing
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-play video
  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isVisible, currentStep]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const restart = () => {
    setCurrentStep(0);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!isVisible) return null;

  const positionClasses = {
    right: 'fixed right-4 top-1/4 w-80',
    left: 'fixed left-4 top-1/4 w-80',
    bottom: 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[500px] max-w-[95vw]',
  };

  return (
    <div className={`${positionClasses[position]} z-50 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200`}>
      {/* Video Section */}
      <div className="bg-slate-900 relative">
        <video
          ref={videoRef}
          src={step.videoUrl || defaultVideoUrl}
          autoPlay
          playsInline
          className="w-full h-48 object-contain"
        />
        
        {/* Play/Pause overlay */}
        <button
          onClick={togglePlay}
          className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Avatar info */}
        <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-full">
          <span className="text-white text-sm font-medium">{avatarName}</span>
          <span className="text-gray-300 text-xs ml-2">{avatarRole}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{currentStep + 1}/{steps.length}</span>
        </div>

        {/* Step Title */}
        <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>

        {/* Script/Content */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{step.script}</p>

        {/* Action Button */}
        {step.action && (
          <a
            href={step.action.href}
            onClick={step.action.onClick}
            className="block w-full text-center bg-brand-blue-600 text-white py-2 rounded-lg font-medium hover:bg-brand-blue-700 transition-colors mb-3"
          >
            {step.action.label}
          </a>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          {isLastStep ? (
            <button
              onClick={restart}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Restart</span>
            </button>
          ) : null}

          <button
            onClick={nextStep}
            className="flex items-center gap-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 transition-colors"
          >
            <span className="text-sm font-medium">{isLastStep ? 'Finish' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Pre-built guide configurations
export const ORIENTATION_STEPS: GuideStep[] = [
  {
    title: 'Welcome to Elevate for Humanity!',
    script: "Hi! I'm so excited you're here. I'm going to walk you through everything you need to know to get started with your training. Let's begin!",
  },
  {
    title: 'Your Student Dashboard',
    script: "This is your home base. Here you'll see your enrolled courses, progress, upcoming deadlines, and announcements. Check it daily!",
    action: { label: 'View Dashboard', href: '/student/dashboard' },
  },
  {
    title: 'Accessing Your Courses',
    script: "Click on any course to start learning. Each course has video lessons, readings, quizzes, and hands-on activities. Work at your own pace!",
    action: { label: 'Browse Courses', href: '/lms/courses' },
  },
  {
    title: 'Getting Help',
    script: "Stuck on something? I'm always here to help! You can also reach your instructor, join study groups, or contact student support.",
    action: { label: 'Get Support', href: '/support' },
  },
  {
    title: 'Attendance & Progress',
    script: "Track your attendance and progress regularly. Completing lessons on time keeps you on track for certification. You've got this!",
  },
  {
    title: "You're All Set!",
    script: "That's everything you need to get started. Remember, I'm always here if you have questions. Now let's begin your journey to a new career!",
    action: { label: 'Start Learning', href: '/lms/dashboard' },
  },
];

export const ONBOARDING_STEPS: GuideStep[] = [
  {
    title: 'Welcome! Let\'s Get You Set Up',
    script: "Congratulations on taking the first step toward your new career! I'll guide you through the setup process. It only takes a few minutes.",
  },
  {
    title: 'Complete Your Profile',
    script: "First, let's complete your profile. Add your photo, contact info, and background. This helps instructors and employers get to know you.",
    action: { label: 'Edit Profile', href: '/account/profile' },
  },
  {
    title: 'Verify Your Identity',
    script: "For certification purposes, we need to verify your identity. Upload a government ID - this is required for official credentials.",
    action: { label: 'Verify Identity', href: '/verify-identity' },
  },
  {
    title: 'Review Your Program',
    script: "Take a moment to review your enrolled program. Check the schedule, requirements, and what you'll learn. Exciting stuff ahead!",
    action: { label: 'View Program', href: '/student/program' },
  },
  {
    title: 'Set Up Notifications',
    script: "Stay on track with notifications. We'll remind you about deadlines, new content, and important announcements. Don't miss anything!",
    action: { label: 'Notification Settings', href: '/settings/notifications' },
  },
  {
    title: 'Ready to Begin!',
    script: "You're all set up! Your first lesson is waiting. Remember, consistency is key - try to study a little every day. Let's do this!",
    action: { label: 'Start First Lesson', href: '/lms/courses' },
  },
];

export const COURSE_INTRO_STEPS = (courseName: string): GuideStep[] => [
  {
    title: `Welcome to ${courseName}!`,
    script: `I'm thrilled to be your guide through ${courseName}. This course will give you the skills and knowledge you need for a rewarding career. Let me show you around.`,
  },
  {
    title: 'Course Overview',
    script: "Here's what we'll cover: theory lessons, hands-on practice, quizzes to test your knowledge, and a final assessment. Each section builds on the last.",
  },
  {
    title: 'How to Succeed',
    script: "Watch each video completely, take notes, and complete all practice exercises. Don't rush - understanding is more important than speed.",
  },
  {
    title: 'Getting Help',
    script: "If you get stuck, don't worry! Ask me questions anytime, join the discussion forum, or schedule time with your instructor. We're here for you.",
  },
  {
    title: 'Let\'s Begin!',
    script: "Ready to start? Click below to begin your first lesson. Remember, every expert was once a beginner. You've got this!",
    action: { label: 'Start Lesson 1', href: '#lesson-1' },
  },
];

export const ENROLLMENT_STEPS: GuideStep[] = [
  {
    title: 'Let\'s Get You Enrolled!',
    script: "I'll walk you through the enrollment process step by step. It's quick and easy - most people finish in under 10 minutes.",
  },
  {
    title: 'Step 1: Basic Information',
    script: "First, we need some basic info - your name, contact details, and background. This helps us serve you better.",
    action: { label: 'Fill Out Form', href: '/apply' },
  },
  {
    title: 'Step 2: Check Eligibility',
    script: "Great! Now let's check if you qualify for FREE training through WIOA funding. Most adults do! Answer a few quick questions.",
    action: { label: 'Check Eligibility', href: '/eligibility' },
  },
  {
    title: 'Step 3: Choose Your Program',
    script: "Now the fun part - choosing your program! Healthcare, trades, technology, or barbering? Pick what excites you most.",
    action: { label: 'Browse Programs', href: '/programs' },
  },
  {
    title: 'Step 4: Submit Application',
    script: "Almost done! Review your information and submit. Our team will review it within 1-2 business days.",
    action: { label: 'Submit Application', href: '/apply/submit' },
  },
  {
    title: 'Application Submitted!',
    script: "Congratulations! Your application is in. We'll contact you soon with next steps. Get ready to start your new career journey!",
  },
];
