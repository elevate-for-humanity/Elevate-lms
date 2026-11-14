import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  author: string;
  category: string;
  body: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'wioa-funding-guide-2026',
    title: 'How to Use WIOA Funding for Career Training in 2026',
    summary:
      'A practical guide to accessing Workforce Innovation and Opportunity Act funding for eligible Indiana residents.',
    date: '2026-03-15',
    author: 'Elevate for Humanity',
    category: 'Funding',
    body: 'WIOA funding covers tuition, fees, and support services for eligible adults and dislocated workers. Contact your local WorkOne center or apply through Elevate to get started.',
  },
  {
    slug: 'hvac-career-outlook-2026',
    title: 'HVAC Career Outlook: Why Now Is the Right Time to Get Certified',
    summary:
      'Demand for HVAC technicians is at a 10-year high. Here is what you need to know about entering the field.',
    date: '2026-02-20',
    author: 'Elevate for Humanity',
    category: 'Career Insights',
    body: 'The Bureau of Labor Statistics projects 6% growth in HVAC employment through 2032. EPA 608 Universal certification opens doors to residential, commercial, and industrial work.',
  },
  {
    slug: 'cna-certification-indiana',
    title: 'CNA Certification in Indiana: What to Expect',
    summary:
      'Everything you need to know about the Indiana CNA state exam, clinical hours, and job placement.',
    date: '2026-01-10',
    author: 'Elevate for Humanity',
    category: 'Healthcare',
    body: "Indiana requires 75 hours of training and a state competency exam for CNA certification. Elevate's 6-week program includes clinical rotations at licensed facilities and on-site state exam proctoring.",
  },
];

export const blogCategories = [...new Set(blogPosts.map((p) => p.category))];
export const blogAuthors = [...new Set(blogPosts.map((p) => p.author))];
