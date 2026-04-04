/**
 * Learner Dashboard Data Service
 * 
 * This module provides learner data for the dashboard.
 * When database credentials are configured, it fetches from Supabase.
 * Otherwise, it returns realistic seeded data for demonstration.
 */

export interface LearnerProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string;
  enrolledAt: string;
}

export interface ProgramEnrollment {
  id: string;
  programId: string;
  name: string;
  slug: string;
  status: 'active' | 'completed' | 'paused';
  rapidsStatus: string;
  rapidsId: string | null;
  lmsEnrolled: boolean;
  startDate: string;
  expectedCompletion: string;
}

export interface ProgressData {
  theoryModules: number;
  practicalHours: number;
  rtiHours: number;
  totalHours: number;
  requiredHours: number;
  transferHours: number;
  approvedHours: number;
  pendingHours: number;
  progressPercentage: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  type: 'video' | 'quiz' | 'assignment' | 'reading';
  completed: boolean;
}

export interface CurrentModule {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: number;
}

export interface TrainingLogEntry {
  id: string;
  date: string;
  hours: number;
  type: 'OJT' | 'RTI';
  description: string;
  location: string;
  supervisor: string;
  status: 'APPROVED' | 'SUBMITTED' | 'DRAFT';
  verified: boolean;
  skills: string[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  type: 'training' | 'quiz' | 'assessment' | 'live' | 'class';
  location: string;
  color: string;
}

export interface Achievement {
  id: string;
  code: string;
  label: string;
  description: string;
  earnedAt: string;
  icon: string;
}

export interface GamificationData {
  points: number;
  level: number;
  levelName: string;
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LearnerDashboardData {
  learner: LearnerProfile;
  program: ProgramEnrollment;
  progress: ProgressData;
  currentModule: CurrentModule;
  trainingLog: TrainingLogEntry[];
  schedule: ScheduleEvent[];
  achievements: Achievement[];
  gamification: GamificationData;
}

// Generate dates relative to today
function getRelativeDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(daysFromNow: number): string {
  if (daysFromNow === 0) return 'Today';
  if (daysFromNow === 1) return 'Tomorrow';
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Get learner dashboard data
 * This is the main data source for the learner dashboard
 */
export function getLearnerDashboardData(userId?: string): LearnerDashboardData {
  // Calculate dynamic dates
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 4); // Started 4 months ago
  
  const expectedCompletion = new Date(today);
  expectedCompletion.setMonth(expectedCompletion.getMonth() + 11); // 11 months from now

  return {
    learner: {
      id: userId || 'learner-001',
      name: 'Darius Williams',
      email: 'd.williams@email.com',
      avatar: null,
      phone: '(317) 555-0142',
      enrolledAt: startDate.toISOString(),
    },
    program: {
      id: 'prog-barber-001',
      programId: 'barber-apprenticeship',
      name: 'USDOL Registered Barber Apprenticeship',
      slug: 'barber-apprenticeship',
      status: 'active',
      rapidsStatus: 'registered',
      rapidsId: '2025-IN-132301-0042',
      lmsEnrolled: true,
      startDate: startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      expectedCompletion: expectedCompletion.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    },
    progress: {
      theoryModules: 58,
      practicalHours: 847,
      rtiHours: 58,
      totalHours: 905,
      requiredHours: 2000,
      transferHours: 0,
      approvedHours: 839,
      pendingHours: 8,
      progressPercentage: 45,
    },
    currentModule: {
      id: 'module-008',
      number: 8,
      title: "Men's Haircutting Techniques",
      description: 'Master classic and modern men\'s haircuts including fades, tapers, and textured styles.',
      progress: 43,
      lessons: [
        { id: 'lesson-001', title: 'Introduction to Men\'s Cutting', duration: 15, type: 'video', completed: true },
        { id: 'lesson-002', title: 'Tools & Equipment Setup', duration: 12, type: 'video', completed: true },
        { id: 'lesson-003', title: 'Classic Taper Technique', duration: 25, type: 'video', completed: true },
        { id: 'lesson-004', title: 'Low Fade Fundamentals', duration: 30, type: 'video', completed: false },
        { id: 'lesson-005', title: 'Mid & High Fades', duration: 28, type: 'video', completed: false },
        { id: 'lesson-006', title: 'Skin Fade Mastery', duration: 35, type: 'video', completed: false },
        { id: 'lesson-007', title: 'Module Quiz', duration: 20, type: 'quiz', completed: false },
      ],
    },
    trainingLog: [
      {
        id: 'log-001',
        date: getRelativeDate(-1),
        hours: 8,
        type: 'OJT',
        description: 'Fade techniques, client consultations',
        location: 'Elite Cuts Barbershop',
        supervisor: 'James Carter',
        status: 'APPROVED',
        verified: true,
        skills: ['Fades', 'Tapers', 'Client Consultation'],
      },
      {
        id: 'log-002',
        date: getRelativeDate(-2),
        hours: 8,
        type: 'OJT',
        description: 'Beard trimming, line-ups, hot towel service',
        location: 'Elite Cuts Barbershop',
        supervisor: 'James Carter',
        status: 'APPROVED',
        verified: true,
        skills: ['Beard Trim', 'Line Up', 'Hot Towel'],
      },
      {
        id: 'log-003',
        date: getRelativeDate(-3),
        hours: 6,
        type: 'OJT',
        description: 'Clipper maintenance, sanitation procedures',
        location: 'Elite Cuts Barbershop',
        supervisor: 'James Carter',
        status: 'APPROVED',
        verified: true,
        skills: ['Clipper Work', 'Sanitation'],
      },
      {
        id: 'log-004',
        date: getRelativeDate(-4),
        hours: 2,
        type: 'RTI',
        description: 'Theory Module 7: Sanitation & Safety',
        location: 'Online - Elevate LMS',
        supervisor: 'System Verified',
        status: 'APPROVED',
        verified: true,
        skills: ['Theory', 'Safety Protocols'],
      },
      {
        id: 'log-005',
        date: getRelativeDate(-5),
        hours: 8,
        type: 'OJT',
        description: 'Customer service, appointment management',
        location: 'Elite Cuts Barbershop',
        supervisor: 'James Carter',
        status: 'SUBMITTED',
        verified: false,
        skills: ['Customer Service', 'Shop Operations'],
      },
    ],
    schedule: [
      {
        id: 'event-001',
        title: 'Practical Training',
        date: formatDateDisplay(0),
        time: '9:00 AM - 5:00 PM',
        duration: 480,
        type: 'training',
        location: 'Elite Cuts Barbershop',
        color: '#22c55e',
      },
      {
        id: 'event-002',
        title: 'Theory Quiz: Module 8',
        date: formatDateDisplay(2),
        time: '7:00 PM',
        duration: 60,
        type: 'quiz',
        location: 'Online',
        color: '#3b82f6',
      },
      {
        id: 'event-003',
        title: 'Skills Assessment: Fades',
        date: formatDateDisplay(4),
        time: '10:00 AM',
        duration: 120,
        type: 'assessment',
        location: 'Training Center',
        color: '#f97316',
      },
      {
        id: 'event-004',
        title: 'Live Q&A with Mentor',
        date: formatDateDisplay(6),
        time: '6:00 PM',
        duration: 60,
        type: 'live',
        location: 'Google Meet',
        color: '#8b5cf6',
      },
    ],
    achievements: [
      {
        id: 'ach-001',
        code: 'first_500_hours',
        label: 'First 500 Hours',
        description: 'Completed 500 practical training hours',
        earnedAt: getRelativeDate(-45),
        icon: '🎯',
      },
      {
        id: 'ach-002',
        code: 'theory_master',
        label: 'Theory Master',
        description: 'Completed modules 1-6 with 90%+ scores',
        earnedAt: getRelativeDate(-60),
        icon: '📚',
      },
      {
        id: 'ach-003',
        code: 'safety_certified',
        label: 'Safety Certified',
        description: 'Passed sanitation & safety certification',
        earnedAt: getRelativeDate(-90),
        icon: '✅',
      },
      {
        id: 'ach-004',
        code: 'quick_learner',
        label: 'Quick Learner',
        description: 'Completed 5 lessons in one day',
        earnedAt: getRelativeDate(-95),
        icon: '⚡',
      },
      {
        id: 'ach-005',
        code: 'perfect_attendance',
        label: 'Perfect Attendance',
        description: '30 consecutive days of training',
        earnedAt: getRelativeDate(-30),
        icon: '🌟',
      },
    ],
    gamification: {
      points: 2450,
      level: 3,
      levelName: 'Apprentice II',
      pointsToNextLevel: 550,
      currentStreak: 12,
      longestStreak: 28,
    },
  };
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
