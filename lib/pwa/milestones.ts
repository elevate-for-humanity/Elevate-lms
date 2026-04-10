// Milestone definitions and achievement checking

export interface Milestone {
  id: string;
  hours: number;
  title: string;
  description: string;
  badge: string;
}

export const BARBER_MILESTONES: Milestone[] = [
  {
    id: 'first-week',
    hours: 40,
    title: 'First Week Complete',
    description: 'Completed your first week of training',
    badge: '🎯',
  },
  {
    id: 'foundation',
    hours: 250,
    title: 'Foundation Builder',
    description: 'Built a solid foundation with 250 hours',
    badge: '🏗️',
  },
  {
    id: 'developing',
    hours: 500,
    title: 'Developing Skills',
    description: 'Reached the halfway point to 1000 hours',
    badge: '📈',
  },
  {
    id: 'intermediate',
    hours: 750,
    title: 'Intermediate Level',
    description: 'Mastered intermediate techniques',
    badge: '⭐',
  },
  {
    id: 'advanced',
    hours: 1000,
    title: 'Advanced Practitioner',
    description: 'Reached 1000 hours of training',
    badge: '🌟',
  },
  {
    id: 'expert',
    hours: 1500,
    title: 'Expert Level',
    description: 'Achieved expert status with 1500 hours',
    badge: '💫',
  },
  {
    id: 'licensure-ready',
    hours: 2000,
    title: 'Licensure Ready',
    description: 'Completed all 2000 required hours!',
    badge: '🏆',
  },
];

export const COSMETOLOGY_MILESTONES: Milestone[] = [
  { id: 'first-100',      hours: 100,  title: 'First 100 Hours',       description: 'Completed your first 100 hours of salon training.',                    badge: '🎯' },
  { id: 'shampoo',        hours: 250,  title: 'Shampoo & Conditioning', description: 'Proficiency in scalp analysis and conditioning treatments.',            badge: '💧' },
  { id: 'quarter',        hours: 500,  title: 'Quarter Way There',      description: '500 hours complete. Building real salon skills.',                       badge: '📈' },
  { id: 'chemical',       hours: 750,  title: 'Chemical Services',      description: 'Demonstrated competency in color, perms, and relaxers.',                badge: '⭐' },
  { id: 'halfway',        hours: 1000, title: 'Halfway to Licensure',   description: '1,000 hours complete. Halfway to your Indiana Cosmetology License.',   badge: '🌟' },
  { id: 'skin-nail',      hours: 1250, title: 'Skin & Nail Services',   description: 'Proficiency in facials, waxing, manicures, and pedicures.',            badge: '💅' },
  { id: 'advanced',       hours: 1500, title: 'Advanced Techniques',    description: 'Mastery of advanced cutting, coloring, and styling techniques.',        badge: '💫' },
  { id: 'salon-mgmt',     hours: 1750, title: 'Salon Management',       description: 'Completed business, sanitation, and client management modules.',        badge: '🏢' },
  { id: 'state-board',    hours: 2000, title: 'State Board Ready',      description: 'All 2,000 hours complete. Eligible for the Indiana State Board exam.', badge: '🏆' },
];

export const ESTHETICIAN_MILESTONES: Milestone[] = [
  { id: 'first-75',      hours: 75,  title: 'First 75 Hours',        description: 'Completed your first 75 hours of esthetician training.',                badge: '🎯' },
  { id: 'skin-science',  hours: 150, title: 'Skin Science Basics',    description: 'Demonstrated understanding of skin anatomy, disorders, and analysis.',  badge: '🔬' },
  { id: 'facial',        hours: 250, title: 'Facial Specialist',      description: 'Proficiency in basic and advanced facial treatments.',                   badge: '✨' },
  { id: 'hair-removal',  hours: 350, title: 'Hair Removal Expert',    description: 'Competency in waxing, threading, and other hair removal techniques.',   badge: '⭐' },
  { id: 'chemical',      hours: 450, title: 'Chemical Services',      description: 'Demonstrated skill in chemical exfoliation and advanced skin care.',     badge: '🌟' },
  { id: 'makeup',        hours: 575, title: 'Makeup & Lashes',        description: 'Proficiency in makeup application and lash services.',                   badge: '💄' },
  { id: 'state-board',   hours: 700, title: 'State Board Ready',      description: 'All 700 hours complete. Eligible for the Indiana State Board exam.',    badge: '🏆' },
];

export const NAIL_TECH_MILESTONES: Milestone[] = [
  { id: 'first-50',      hours: 50,  title: 'First 50 Hours',         description: 'Completed your first 50 hours of nail technician training.',             badge: '🎯' },
  { id: 'sanitation',    hours: 100, title: 'Sanitation Certified',   description: 'Mastery of infection control and sanitation protocols.',                  badge: '🧼' },
  { id: 'manicure',      hours: 150, title: 'Manicure Proficiency',   description: 'Proficiency in basic and spa manicure techniques.',                      badge: '💅' },
  { id: 'pedicure',      hours: 225, title: 'Pedicure Specialist',    description: 'Competency in pedicure services and foot care.',                         badge: '⭐' },
  { id: 'enhancements',  hours: 300, title: 'Nail Enhancements',      description: 'Demonstrated skill in acrylic, gel, and nail art applications.',         badge: '🌟' },
  { id: 'client-ready',  hours: 375, title: 'Client Ready',           description: 'Consistently delivering professional-quality services to clients.',       badge: '💫' },
  { id: 'state-board',   hours: 450, title: 'State Board Ready',      description: 'All 450 hours complete. Eligible for the Indiana State Board exam.',     badge: '🏆' },
];

type ProgramKey = 'barber' | 'cosmetology' | 'esthetician' | 'nail-tech';

const MILESTONE_MAP: Record<ProgramKey, Milestone[]> = {
  barber:       BARBER_MILESTONES,
  cosmetology:  COSMETOLOGY_MILESTONES,
  esthetician:  ESTHETICIAN_MILESTONES,
  'nail-tech':  NAIL_TECH_MILESTONES,
};

export function getAchievedMilestones(totalHours: number, program: ProgramKey = 'barber'): Milestone[] {
  const list = MILESTONE_MAP[program] ?? BARBER_MILESTONES;
  return list.filter(m => totalHours >= m.hours);
}

export function getNextMilestone(totalHours: number, program: ProgramKey = 'barber'): Milestone | null {
  const list = MILESTONE_MAP[program] ?? BARBER_MILESTONES;
  return list.find(m => totalHours < m.hours) || null;
}

export function checkNewMilestone(
  previousHours: number, 
  newHours: number
): Milestone | null {
  const previousMilestones = getAchievedMilestones(previousHours);
  const newMilestones = getAchievedMilestones(newHours);
  
  // Find newly achieved milestone
  const newlyAchieved = newMilestones.filter(
    m => !previousMilestones.some(pm => pm.id === m.id)
  );
  
  // Return the highest newly achieved milestone
  return newlyAchieved.length > 0 ? newlyAchieved[newlyAchieved.length - 1] : null;
}

export function getMilestoneProgress(totalHours: number): {
  current: Milestone | null;
  next: Milestone | null;
  progressPercent: number;
  hoursToNext: number;
} {
  const achieved = getAchievedMilestones(totalHours);
  const current = achieved.length > 0 ? achieved[achieved.length - 1] : null;
  const next = getNextMilestone(totalHours);
  
  let progressPercent = 0;
  let hoursToNext = 0;
  
  if (next) {
    const startHours = current?.hours || 0;
    const rangeHours = next.hours - startHours;
    const progressHours = totalHours - startHours;
    progressPercent = (progressHours / rangeHours) * 100;
    hoursToNext = next.hours - totalHours;
  } else {
    progressPercent = 100;
  }
  
  return { current, next, progressPercent, hoursToNext };
}
