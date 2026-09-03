import type { ProgramConfig } from '../ProgramLanding';

export const nailConfig: ProgramConfig = {
  // Hero
  title: 'Turn Creativity Into a Career',
  tagline: 'DOL Registered Apprenticeship',
  subtitle: 'Master nail artistry, gel, acrylics, and spa pedicures through professional salon apprenticeships.',
  heroVideo: '/videos/programs/nails-hero.mp4',
  heroImage: '/images/beauty/nails-hero.webp',
  primaryCta: { label: 'Apply Now', href: '/programs/nail-technician-apprenticeship/apply' },
  secondaryCta: { label: 'Schedule a Tour', href: '/contact' },
  stats: [
    { value: '700+', label: 'Training Hours' },
    { value: '6-12', label: 'Months' },
    { value: '$0', label: 'with Funding' },
  ],

  // Story
  storyScenarios: [
    "Imagine perfecting your first gel manicure. Your client loves the attention to detail.",
    "Week after week, your artistry improves. Your nail art becomes your signature.",
    "By graduation, you have a loyal clientele who books with you specifically for your designs.",
    "That's the power of nail technician apprenticeship.",
  ],

  // Comparison
  traditionalItems: [
    { text: 'Mostly classroom instruction' },
    { text: 'Limited real practice time' },
    { text: 'Graduate, then find clients' },
    { text: 'Pay tuition upfront' },
    { text: 'Learn theory before technique' },
  ],
  apprenticeshipItems: [
    { text: 'Learn in a working salon' },
    { text: 'Mentorship from day one' },
    { text: 'Real clients with real feedback' },
    { text: 'Build your clientele during training' },
    { text: 'Industry credentials earned' },
    { text: 'Specialize in your passion' },
  ],

  // Journey
  journeySteps: [
    { icon: '📝', title: 'Apply', description: 'Complete our simple application online' },
    { icon: '🤝', title: 'Meet Advisor', description: 'One-on-one consultation to discuss your goals' },
    { icon: '💰', title: 'Funding Review', description: 'Explore funding options and payment plans' },
    { icon: '🏪', title: 'Salon Match', description: 'Get matched with a host salon partner' },
    { icon: '🎓', title: 'Orientation', description: 'Learn the program, meet your mentor' },
    { icon: '💅', title: 'Training Begins', description: 'Start your apprenticeship journey' },
    { icon: '🎉', title: 'Graduation', description: 'Complete hours, pass state exam, get licensed' },
  ],

  // Skills
  skills: [
    { name: 'Gel Manicures', icon: '💅' },
    { name: 'Acrylic Extensions', icon: '✨' },
    { name: 'Nail Art & Design', icon: '🎨' },
    { name: 'Luxury Pedicures', icon: '🦶' },
    { name: 'Dip Powder', icon: '💎' },
    { name: 'Nail Repair', icon: '🔧' },
    { name: 'Sanitation', icon: '✅' },
    { name: 'Product Knowledge', icon: '🧴' },
    { name: 'Retail Sales', icon: '🛍️' },
    { name: 'Client Retention', icon: '💝' },
  ],

  // Career Outcomes
  salaries: [
    { title: 'Starting Salary', range: '$25K - $35K', description: 'per year' },
    { title: 'Booth Rental', range: '$35K - $50K', description: 'potential annual', popular: true },
    { title: 'Mobile/Suite', range: '$40K - $70K', description: 'potential annual' },
  ],
  careers: [
    { title: 'Nail Salon', icon: '💅' },
    { title: 'Luxury Spa', icon: '✨' },
    { title: 'Hotel Spa', icon: '🏨' },
    { title: 'Mobile Nail Artist', icon: '🚗' },
    { title: 'Salon Suite', icon: '🏠' },
    { title: 'Nail Art Specialist', icon: '🎨' },
    { title: 'Education', icon: '📚' },
    { title: 'Brand Ambassador', icon: '⭐' },
  ],
  tuition: 2980,

  // Business
  businessItems: [
    'Building Your Brand',
    'Social Media Marketing for Nail Artists',
    'Pricing Your Services',
    'Client Loyalty Programs',
    'Mobile Services',
    'Salon Suite Business Model',
    'Product Sponsorship Opportunities',
  ],
  businessImage: '/images/beauty/nails-hero.webp',

  // Mentors
  mentors: [
    {
      name: 'Luna Park',
      role: 'Master Nail Artist',
      photo: '/images/beauty/cosmetology-hero.webp',
      bio: 'International nail artist with experience in editorial and bridal nail design.',
      credentials: ['Licensed Nail Technician', 'CND Education', 'OPI Certified'],
    },
  ],

  // Testimonials
  testimonials: [
    {
      name: 'Emma R.',
      program: 'Nail Technology',
      quote: 'I started doing nails at home for friends. The apprenticeship helped me turn my hobby into a real career.',
      photo: '/images/pages/career-services-hero.webp',
      before: 'Working retail, no career direction',
      after: 'Mobile nail artist, $45K+ annually',
    },
  ],

  // Funding
  fundingOptions: [
    {
      icon: '🏛️',
      title: 'Workforce Funding',
      description: 'Potentially $0 out-of-pocket through WIOA, Workforce Ready Grant, or VR',
      ctaHref: '/check-eligibility',
      ctaLabel: 'Check eligibility',
    },
    {
      icon: '💼',
      title: 'Employer Sponsored',
      description: 'Partner employers may cover tuition in exchange for commitment',
    },
    {
      icon: '💳',
      title: 'Self Pay + BNPL',
      description: 'Flexible weekly payments or Buy Now, Pay Later options',
      ctaHref: '/programs/nail-technician-apprenticeship/payment/bnpl',
      ctaLabel: 'Compare providers',
    },
  ],

  // FAQ
  faqs: [
    {
      question: 'How long does it take to become a licensed nail technician?',
      answer: 'The nail technician apprenticeship typically takes 6-12 months to complete, including both Related Technical Instruction (RTI) and On-the-Job Training (OJT).',
    },
    {
      question: 'Can I specialize in nail art?',
      answer: 'Absolutely! Many nail technicians develop their own unique style and specialize in areas like nail art, gel extensions, or natural nail care. We encourage you to develop your signature services.',
    },
    {
      question: 'What\'s the difference between mobile and salon work?',
      answer: 'Salon work offers a steady clientele and built-in marketing. Mobile work offers flexibility and potentially higher per-service rates. Many technicians do both!',
    },
  ],

  // CTA
  ctaTitle: 'Your Nail Career Starts Here',
  ctaSubtitle: 'Whether your dream is working in a luxury spa, building a mobile business, or creating stunning nail art, your journey begins here.',
  ctas: [
    { label: 'Apply for Nail Technology', href: '/programs/nail-technician-apprenticeship/apply', variant: 'primary' },
    { label: 'Schedule a Tour', href: '/contact', variant: 'secondary' },
    { label: 'Explore Funding', href: '/check-eligibility', variant: 'outline' },
  ],
};

export default nailConfig;
