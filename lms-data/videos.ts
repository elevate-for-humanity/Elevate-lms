import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string; // ISO 8601 duration format
  uploadDate: string; // ISO 8601 date
  category: string;
}

export const videos: VideoData[] = [
  {
    id: 'hero-home',
    title: '' + PLATFORM_DEFAULTS.orgName + ' - Free Career Training Programs',
    description:
      'Discover 100% free, funded workforce training programs in Indianapolis. WIOA-funded programs in healthcare, skilled trades, technology, and business. No tuition, no debt, real careers.',
    videoUrl: '/videos/hero-home.mp4',
    thumbnailUrl: '/images/heroes/hero-homepage.jpg',
    duration: 'PT1M30S',
    uploadDate: '2025-01-01',
    category: 'Overview',
  },
  {
    id: 'cna-hero',
    title: 'CNA Training Program - Certified Nursing Assistant',
    description:
      'CNA training in Indianapolis. State-approved program, 6 weeks, job placement assistance. FSSA IMPACT funded for eligible participants. Self-pay: $1,800.',
    videoUrl: '/videos/cna-hero.mp4',
    thumbnailUrl: '/images/healthcare/video-thumbnail-cna-training.jpg',
    duration: 'PT45S',
    uploadDate: '2025-01-01',
    category: 'Healthcare',
  },
  {
    id: 'barber-hero',
    title: 'Barber Apprenticeship Program - Licensed Barber Training',
    description:
      'Registered barber apprenticeship in Indianapolis. Earn while you learn, 2000 hours, state licensure pathway. Free training with experienced mentors.',
    videoUrl:
      'https://cms-artifacts.artlist.io/content/generated-video-v1/video__3/video-7b329d1f-3f92-4ec5-acdf-9d2d7ff6de5f.mp4?Expires=2083752835&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=PwinNDJ~aDGbHoMI8-Hfr28QIj7s~0mwzn92P-muIHO0bW86~4gW6MzRyslLtk~TOzdfX8aTYA9OeGF-sbBPwCBUw8gTpXO6QvhwpJsFW5DiLHnEP6q6vCTvQ-jEpwV20izIuWVSpY-txGY7bDGHhkSq6-wP26b0J-lstFIMwxRHQjJ9rKmX9i4pzNruZJEQ2ILvO-LdWivm98j5TMLm09HgYzesifHFPPzUzNH7NlYwwvIO2-NtXWEuixrQFdJ2Zt4ocgdmqP9auvaeYr9hbS~F6k6CBybWLlnGoLggGkluqp1vFzt-eIslYgFKl8m4Du4UFJawNl3KmcyA9uTWtA__',
    thumbnailUrl: '/images/barber-hero.webp',
    duration: 'PT1M',
    uploadDate: '2025-01-01',
    category: 'Skilled Trades',
  },
  {
    id: 'cdl-hero',
    title: 'CDL Training - Commercial Driver License Program',
    description:
      'Free CDL training in Indianapolis. Class A, B, and C commercial driving licenses. WIOA-funded, job placement with local carriers.',
    videoUrl: '/videos/cdl-hero.mp4',
    thumbnailUrl: '/images/cdl-hero.jpg',
    duration: 'PT50S',
    uploadDate: '2025-01-01',
    category: 'Transportation',
  },
  {
    id: 'hvac-hero',
    title: 'HVAC Technician Training Program',
    description:
      'Free HVAC training in Indianapolis. Learn heating, ventilation, air conditioning, and refrigeration. EPA certification included.',
    videoUrl: '/videos/hvac-hero-final.mp4',
    thumbnailUrl: '/images/hvac-hero.jpg',
    duration: 'PT40S',
    uploadDate: '2025-01-01',
    category: 'Skilled Trades',
  },
  {
    id: 'programs-overview',
    title: 'Programs Overview - All Training Programs',
    description:
      'Overview of all free career training programs at Elevate for Humanity. Healthcare, skilled trades, technology, business, and more.',
    videoUrl: '/videos/programs-overview-video-with-narration.mp4',
    thumbnailUrl: '/images/programs-catalog-hero.jpg',
    duration: 'PT30S',
    uploadDate: '2025-01-01',
    category: 'Overview',
  },
  {
    id: 'training-providers',
    title: 'Training Providers - Partner Network',
    description:
      'Learn about our network of training providers and partners. Quality education from certified instructors and industry experts.',
    videoUrl: '/videos/training-providers-video-with-narration.mp4',
    thumbnailUrl: '/images/training-providers-hero.jpg',
    duration: 'PT1M10S',
    uploadDate: '2025-01-01',
    category: 'About',
  },
  {
    id: 'getting-started',
    title: 'Getting Started - How to Apply',
    description:
      'Step-by-step guide to applying for free career training programs. Learn about eligibility, application process, and what to expect.',
    videoUrl: '/videos/getting-started-hero.mp4',
    thumbnailUrl: '/images/getting-started-hero.jpg',
    duration: 'PT35S',
    uploadDate: '2025-01-01',
    category: 'How To',
  },
];

export function getVideoById(id: string): VideoData | undefined {
  return videos.find((v) => v.id === id);
}

export function getVideosByCategory(category: string): VideoData[] {
  return videos.filter((v) => v.category === category);
}
