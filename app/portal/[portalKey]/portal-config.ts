import {
  Heart,
  Monitor,
  Wrench,
  Briefcase,
  Scissors,
  Users,
  BookOpen,
  Award,
  FileText,
  Clock,
  TrendingUp,
  GraduationCap,
  UtensilsCrossed,
  Shield,
} from 'lucide-react';
import type { PortalKey } from '@/lib/portal/router';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface PortalConfig {
  label: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  metaTitle: string;
  metaDescription: string;
  quickLinks: { name: string; href: string; icon: React.ElementType; description: string }[];
  availablePrograms: { title: string; slug: string; credential: string }[];
}

const SHARED_LINKS = [
  { name: 'My Programs', href: '/lms/courses', icon: BookOpen, description: 'Continue your coursework' },
  { name: 'Certificates', href: '/lms/certificates', icon: Award, description: 'View earned credentials' },
  { name: 'Schedule', href: '/lms/calendar', icon: Clock, description: 'Upcoming classes & labs' },
  { name: 'Documents', href: '/learner/dashboard', icon: FileText, description: 'Upload required documents' },
  { name: 'Grades', href: '/lms/grades', icon: TrendingUp, description: 'View quiz & exam scores' },
];

export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  healthcare: {
    label: 'Healthcare',
    icon: Heart,
    accentColor: 'text-rose-600',
    accentBg: 'bg-rose-600',
    metaTitle: 'Healthcare Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your healthcare training portal. Track CNA, Medical Assistant, Phlebotomy, and other healthcare program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'Exam preparation resources' },
    ],
    availablePrograms: [
      { title: 'Certified Nursing Assistant (CNA)', slug: 'cna', credential: 'Indiana ISDH CNA' },
      { title: 'Medical Assistant', slug: 'medical-assistant', credential: 'NHA CCMA' },
      { title: 'Phlebotomy Technician', slug: 'phlebotomy', credential: 'NHA CPT' },
      { title: 'Pharmacy Technician', slug: 'pharmacy-technician', credential: 'PTCB CPhT' },
    ],
  },
  technology: {
    label: 'Technology',
    icon: Monitor,
    accentColor: 'text-indigo-600',
    accentBg: 'bg-indigo-600',
    metaTitle: 'Technology Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your technology training portal. Track IT, Cybersecurity, Web Development, and other tech program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'CompTIA / vendor exam prep' },
    ],
    availablePrograms: [
      { title: 'IT Help Desk', slug: 'it-help-desk', credential: 'CompTIA A+' },
      { title: 'Cybersecurity Analyst', slug: 'cybersecurity', credential: 'CompTIA Security+' },
      { title: 'Network Administration', slug: 'network-admin', credential: 'CompTIA Network+' },
      { title: 'Web Development', slug: 'web-development', credential: 'Portfolio + Certificate' },
    ],
  },
  trades: {
    label: 'Skilled Trades',
    icon: Wrench,
    accentColor: 'text-amber-600',
    accentBg: 'bg-amber-600',
    metaTitle: 'Skilled Trades Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your skilled trades training portal. Track HVAC, CDL, Welding, Electrical, and other trades program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'EPA 608, OSHA, and industry exam prep' },
    ],
    availablePrograms: [
      { title: 'HVAC Technician', slug: 'hvac-technician', credential: 'EPA Section 608' },
      { title: 'CDL Training', slug: 'cdl-training', credential: 'Commercial Driver License' },
      { title: 'Welding', slug: 'welding', credential: 'AWS Certification' },
      { title: 'Construction Trades', slug: 'construction-trades', credential: 'NCCER / OSHA' },
    ],
  },
  business: {
    label: 'Business & Office',
    icon: Briefcase,
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-600',
    metaTitle: 'Business Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your business & office training portal. Track Office Administration, Bookkeeping, and other business program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'MOS, QuickBooks, and industry exams' },
    ],
    availablePrograms: [
      { title: 'Office Administration', slug: 'office-administration', credential: 'MOS Certification' },
      { title: 'Bookkeeping', slug: 'bookkeeping', credential: 'QuickBooks / NACPB' },
      { title: 'Project Management', slug: 'project-management', credential: 'CAPM Pathway' },
    ],
  },
  beauty: {
    label: 'Beauty & Barber',
    icon: Scissors,
    accentColor: 'text-pink-600',
    accentBg: 'bg-pink-600',
    metaTitle: 'Beauty & Barber Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your beauty & barber training portal. Track cosmetology, barber, and esthetics program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'State Board Prep', href: '/apprentice/state-board', icon: GraduationCap, description: 'Indiana state board exam prep' },
    ],
    availablePrograms: [
      { title: 'Barber Apprenticeship', slug: 'barber-apprenticeship', credential: 'Indiana Barber License' },
      { title: 'Cosmetology Apprenticeship', slug: 'cosmetology-apprenticeship', credential: 'Indiana Cosmetology License' },
      { title: 'Esthetics Apprenticeship', slug: 'esthetician-apprenticeship', credential: 'Indiana Esthetician License' },
      { title: 'Nail Technology', slug: 'nail-technology', credential: 'Indiana Nail Tech License' },
    ],
  },
  'social-services': {
    label: 'Social Services',
    icon: Users,
    accentColor: 'text-teal-600',
    accentBg: 'bg-teal-600',
    metaTitle: 'Social Services Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your social services training portal. Track Peer Recovery, DSP, and human services program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'CPRC and credential exam prep' },
    ],
    availablePrograms: [
      { title: 'Peer Recovery Specialist', slug: 'peer-recovery-specialist', credential: 'CPRC Pathway' },
      { title: 'Direct Support Professional', slug: 'direct-support-professional', credential: 'DSP Credential' },
      { title: 'Home Health Aide', slug: 'home-health-aide', credential: 'Indiana HHA' },
    ],
  },
  hospitality: {
    label: 'Hospitality',
    icon: UtensilsCrossed,
    accentColor: 'text-orange-600',
    accentBg: 'bg-orange-600',
    metaTitle: 'Hospitality Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your hospitality training portal. Track ServSafe, Guest Service, and food service program progress.',
    quickLinks: [
      ...SHARED_LINKS,
      { name: 'Certification Prep', href: '/lms/programs', icon: GraduationCap, description: 'ServSafe and NRF exam prep' },
    ],
    availablePrograms: [
      { title: 'ServSafe Food Handler', slug: 'servsafe-food-handler', credential: 'ServSafe Certificate' },
      { title: 'ServSafe Manager', slug: 'servsafe-manager', credential: 'ServSafe Manager Cert' },
      { title: 'Guest Service Gold', slug: 'guest-service-gold', credential: 'AHLEI Guest Service Gold' },
      { title: 'START Hospitality', slug: 'start-hospitality', credential: 'START Certificate' },
      { title: 'ServSuccess', slug: 'servsuccess', credential: 'NRA ServSuccess' },
    ],
  },
  jri: {
    label: 'Justice-Involved Workforce Readiness',
    icon: Shield,
    accentColor: 'text-violet-600',
    accentBg: 'bg-violet-600',
    metaTitle: 'JRI Portal — ' + PLATFORM_DEFAULTS.orgName + '',
    metaDescription: 'Your Justice Reinvestment Initiative portal. Complete workforce readiness badges via SCORM modules and prepare for career placement.',
    quickLinks: [
      { name: 'My Programs', href: '/lms/courses', icon: BookOpen, description: 'Continue SCORM modules' },
      { name: 'Badges', href: '/lms/certificates', icon: Award, description: 'View earned badges' },
      { name: 'Schedule', href: '/lms/calendar', icon: Clock, description: 'Class schedule' },
      { name: 'Documents', href: '/learner/dashboard', icon: FileText, description: 'Upload required documents' },
      { name: 'Progress', href: '/lms/grades', icon: TrendingUp, description: 'Badge progress tracking' },
      { name: 'Career Prep', href: '/lms/programs', icon: GraduationCap, description: 'Reentry career resources' },
    ],
    availablePrograms: [
      { title: 'JRI Introduction', slug: 'jri-introduction', credential: 'Introduction Badge' },
      { title: 'Badge 1: Mindsets', slug: 'jri-badge-1-mindsets', credential: 'Mindsets Badge' },
      { title: 'Badge 2: Self-Management', slug: 'jri-badge-2-self-management', credential: 'Self-Management Badge' },
      { title: 'Badge 3: Learning Strategies', slug: 'jri-badge-3-learning-strategies', credential: 'Learning Strategies Badge' },
      { title: 'Badge 4: Social Skills', slug: 'jri-badge-4-social-skills', credential: 'Social Skills Badge' },
      { title: 'Badge 5: Workplace Skills', slug: 'jri-badge-5-workplace-skills', credential: 'Workplace Skills Badge' },
      { title: 'Badge 6: Launch a Career', slug: 'jri-badge-6-launch-a-career', credential: 'Launch a Career Badge' },
      { title: 'Reentry Specialist', slug: 'reentry-specialist', credential: 'Reentry Specialist Cert' },
    ],
  },
};

export const VALID_PORTAL_KEYS = Object.keys(PORTAL_CONFIGS);
