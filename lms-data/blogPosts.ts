import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export interface BlogPost {
  slug: string;
  title: string;
  category: 'funding' | 'success-story' | 'employers' | 'lms' | 'community';
  summary: string;
  body: string;
  publishedDate: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-elevate-stacks-wrg-jri-and-philanthropy',
    title: 'How Elevate Stacks WRG, JRI, and Philanthropy to Reduce Tuition',
    category: 'funding',
    summary:
      'A plain-language walkthrough of how Elevate combines state grants, Job Ready Indy (JRI), and scholarship funds so learners pay less out of pocket.',
    publishedDate: '2025-11-20',
    body: `
At ' + PLATFORM_DEFAULTS.orgName + ', we don't believe that a zip code or bank account should decide who gets access to career training.

Behind the scenes, our team is constantly braiding together different funding streams:

- State grants like Workforce Ready Grant (when available)
- WIOA-aligned supports through local workforce partners
- Job Ready Indy (JRI) modules that build soft skills and employability
- Philanthropic funds for gap coverage, emergency needs, and wraparound supports

For learners, the experience is simple: you meet with an Elevate coach, share your goals and situation, and we help design a funding plan that fits. Sometimes that means your tuition is fully covered. Sometimes it means a mix of grant, employer sponsorship, and a small payment plan.

The goal is always the same: get you into a real program with real outcomes, not endless "interest lists."
`,
  },
  {
    slug: 'from-side-hustle-to-career',
    title: 'From Side Hustle to Career: A Barber Apprentice Story',
    category: 'success-story',
    summary:
      'How one learner turned a love for cutting hair into a formal barber apprenticeship and a full client book.',
    publishedDate: '2025-11-18',
    body: `
When Jay first connected with Elevate, he was already cutting hair in his living room. No license, no shop, just word of mouth.

Through the Barber Apprenticeship pathway, he was matched with a partner barbershop that was willing to invest in his growth. Elevate helped:

- Set up an apprenticeship schedule that worked around his family life
- Connect theory content and Milady-style curriculum to his real clients
- Cover parts of his kit and exam fees through wraparound support funds

Within a year, Jay went from "couch cuts" to a fully booked chair at a professional shop. The skills were already there; Elevate and the shop provided the structure, paperwork, and support to make it official.
`,
  },
  {
    slug: 'what-employers-get-when-they-partner-with-elevate',
    title: 'What Employers Get When They Partner with Elevate',
    category: 'employers',
    summary:
      'A quick overview for employers on WEX, OJT, apprenticeships, and how Elevate reduces hiring risk.',
    publishedDate: '2025-11-15',
    body: `
Employers today don't just need more applicants. They need the *right* applicants.

When an employer partners with Elevate for Humanity, they gain:

- Access to learners who are already building soft skills, professionalism, and technical basics
- Support in designing Work Experience (WEX) and On-the-Job Training (OJT) placements
- Help navigating grants and wage offsets where available
- A single point of contact for documentation, reporting, and problem-solving

Instead of random resumes, you get a pipeline of candidates who are screened, coached, and supported.

If you're an employer and want to explore partnership, reach out to the Elevate team—we can often start small with a pilot and grow from there.
`,
  },
];
