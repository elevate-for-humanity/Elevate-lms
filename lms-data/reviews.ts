export interface ProgramReview {
  id: string;
  programId: string;
  reviewerName: string;
  rating: number;
  quote: string;
  outcomeHighlight?: string;
}

export interface ProgramQuestion {
  id: string;
  programId: string;
  question: string;
  answer?: string;
}

export const programReviews: ProgramReview[] = [
  {
    id: 'rev-1',
    programId: 'prog-cna',
    reviewerName: 'Tiana, CNA Graduate',
    rating: 5,
    quote:
      'Elevate helped me go from working random shifts to a stable CNA job with benefits. The soft skills piece made a huge difference.',
    outcomeHighlight: 'Hired full-time at a local long-term care facility.',
  },
  {
    id: 'rev-2',
    programId: 'prog-hvac',
    reviewerName: 'Marcus, HVAC Apprentice',
    rating: 4.5,
    quote:
      "The HVAC program wasn't just book work. I was on job sites with a tech while finishing my classes and got hired before graduating.",
    outcomeHighlight: 'Transitioned from warehouse work to HVAC helper.',
  },
  {
    id: 'rev-3',
    programId: 'prog-barber',
    reviewerName: 'Jay, Barber Apprentice',
    rating: 5,
    quote:
      "I always wanted to cut hair but didn't know where to start. Elevate connected me to a shop, set up my hours, and kept me on track.",
    outcomeHighlight: 'Running a full chair at a partner barbershop.',
  },
  {
    id: 'rev-4',
    programId: 'prog-tax-vita',
    reviewerName: 'Ana, Tax & VITA Trainee',
    rating: 4.5,
    quote:
      'The VITA path let me learn real tax skills while helping families in my neighborhood. Now I have seasonal income every year.',
    outcomeHighlight: 'Returning seasonal tax preparer with community impact.',
  },
];

export const programQuestions: ProgramQuestion[] = [
  {
    id: 'q-1',
    programId: 'prog-cna',
    question: 'Do I need prior healthcare experience to start CNA training?',
    answer:
      'No. You just need a willingness to learn, complete the required hours, and meet basic background requirements.',
  },
  {
    id: 'q-2',
    programId: 'prog-hvac',
    question: 'Will I be working while I go through the HVAC pathway?',
    answer:
      'In most cases, yes. Many learners are placed with employer partners for WEX/OJT while completing modules.',
  },
  {
    id: 'q-3',
    programId: 'prog-barber',
    question: 'How long does the barber apprenticeship usually take?',
    answer:
      'Timing depends on state hours and shop schedule, but many learners build up a strong client base within 12–18 months.',
  },
  {
    id: 'q-4',
    programId: 'prog-tax-vita',
    question: 'Is the Tax & VITA track paid or volunteer?',
    answer:
      'Most training is grant-funded with volunteer hours, but many learners also secure paid seasonal roles after certification.',
  },
];
