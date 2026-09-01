import type { ProgramConfig } from '../ProgramLanding';

export const estheticsConfig: ProgramConfig = {
  // Hero
  title: 'Transform Skin, Transform Lives',
  tagline: 'DOL Registered Apprenticeship',
  subtitle: 'Learn advanced skincare treatments, facials, chemical peels, and spa services through luxury spa apprenticeships.',
  heroVideo: '/videos/programs/esthetics-hero.mp4',
  heroImage: '/images/beauty/esthetics-hero.webp',
  primaryCta: { label: 'Apply Now', href: '/programs/esthetician-apprenticeship/apply' },
  secondaryCta: { label: 'Schedule a Tour', href: '/contact' },
  stats: [
    { value: '20', label: 'Appendix A Competencies' },
    { value: '300', label: 'RTI Hours' },
    { value: '$0', label: 'with Funding' },
  ],

  // Story
  storyScenarios: [
    "Imagine performing your first luxury facial. Your client leaves glowing and grateful.",
    "Month after month, your skincare knowledge deepens. Your clients trust you with their skin concerns.",
    "By graduation, you're not just performing treatments—you're transforming people's confidence and self-esteem.",
    "That's the power of esthetics apprenticeship.",
  ],

  // Comparison
  traditionalItems: [
    { text: 'Mostly classroom instruction' },
    { text: 'Limited hands-on practice' },
    { text: 'Graduate, then find clients' },
    { text: 'Pay tuition upfront' },
    { text: 'Learn theory before practice' },
  ],
  apprenticeshipItems: [
    { text: 'Learn in a working spa' },
    { text: 'Mentorship from licensed estheticians' },
    { text: 'Real clients with real concerns' },
    { text: 'Build your book during training' },
    { text: 'Industry credentials earned' },
    { text: 'Medical esthetics exposure' },
  ],

  // Journey
  journeySteps: [
    { icon: '📝', title: 'Apply', description: 'Complete our simple application online' },
    { icon: '🤝', title: 'Meet Advisor', description: 'One-on-one consultation to discuss your goals' },
    { icon: '💰', title: 'Funding Review', description: 'Explore funding options and payment plans' },
    { icon: '🏪', title: 'Spa Match', description: 'Get matched with a host spa partner' },
    { icon: '🎓', title: 'Orientation', description: 'Learn the program, meet your mentor' },
    { icon: '✨', title: 'Training Begins', description: 'Start your apprenticeship journey' },
    { icon: '🎉', title: 'Graduation', description: 'Complete hours, pass state exam, get licensed' },
  ],

  // Skills
  skills: [
    { name: 'Skin Analysis', icon: '🔍' },
    { name: 'Facial Treatments', icon: '✨' },
    { name: 'Chemical Peels', icon: '🧪' },
    { name: 'Dermaplaning', icon: '💎' },
    { name: 'LED Therapy', icon: '💡' },
    { name: 'Waxing', icon: '🕯️' },
    { name: 'Microcurrent', icon: '⚡' },
    { name: 'Hydrafacials', icon: '💧' },
    { name: 'Product Knowledge', icon: '🧴' },
    { name: 'Client Consultation', icon: '💬' },
  ],

  // Career Outcomes
  salaries: [
    { title: 'Starting Salary', range: '$32K - $42K', description: 'per year' },
    { title: 'Mid-Career', range: '$42K - $60K', description: 'per year', popular: true },
    { title: 'Medical Spa', range: '$45K - $80K', description: 'potential annual' },
  ],
  careers: [
    { title: 'Luxury Spa', icon: '✨' },
    { title: 'Medical Spa', icon: '🏥' },
    { title: 'Dermatology Office', icon: '👩‍⚕️' },
    { title: 'Plastic Surgery Center', icon: '💉' },
    { title: 'Hotel & Resort Spa', icon: '🏨' },
    { title: 'Cruise Ship', icon: '🚢' },
    { title: 'Product Representative', icon: '💼' },
    { title: 'Spa Owner', icon: '🏢' },
  ],
  tuition: 4980,

  // Business
  businessItems: [
    'Building Your Clientele',
    'Social Media for Estheticians',
    'Retail Product Sales',
    'Package and Membership Models',
    'Medical Esthetics Expansion',
    'Mobile Esthetics Services',
    'Continuing Education Planning',
  ],
  businessImage: '/images/beauty/esthetics-hero.webp',

  // Mentors
  mentors: [
    {
      name: 'Jennifer Chen',
      role: 'Medical Esthetician',
      photo: '/images/beauty/esthetician-hero.webp',
      bio: 'Former dermatology nurse now leading our esthetics program. Expert in clinical skincare treatments.',
      credentials: ['Licensed Esthetician', 'Certified Medical Esthetician', 'PCA Skin Certified'],
    },
    {
      name: 'Sarah Martinez',
      role: 'Spa Director',
      photo: '/images/beauty/cosmetology-hero.webp',
      bio: '20+ years in luxury spa management. Specializes in creating exceptional client experiences.',
      credentials: ['Licensed Esthetician', 'Spa Management Certified', 'CIDESCO'],
    },
  ],

  // Testimonials
  testimonials: [
    {
      name: 'Sophia K.',
      program: 'Esthetics',
      quote: 'I was intimidated to start over. The flexible schedule and support system made it possible for me.',
      photo: '/images/pages/career-services-hero.webp',
      before: 'Stay-at-home mom returning to workforce',
      after: 'Medical spa esthetician, $55K annually + tips',
    },
    {
      name: 'Marcus L.',
      program: 'Cosmetology',
      quote: 'The mentorship made all the difference. I learned from the best and now I\'m the one teaching others.',
      photo: '/images/pages/career-coaching.webp',
      before: 'College dropout, unsure of career path',
      after: 'Senior stylist at luxury salon, $62K annually',
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
      ctaHref: '/programs/esthetician-apprenticeship/payment/bnpl',
      ctaLabel: 'Compare providers',
    },
  ],

  // FAQ
  faqs: [
    {
      question: 'What\'s the difference between esthetics and cosmetology?',
      answer: 'Esthetics focuses specifically on skincare — facials, chemical peels, hair removal, and advanced skin treatments. Cosmetology covers a broader range including hair, nails, and makeup. Estheticians can work in spas, medical offices, and skincare centers.',
    },
    {
      question: 'Can I work in a medical spa after graduation?',
      answer: 'Yes! Many of our graduates work in medical spas, dermatology offices, and plastic surgery centers. We provide training on advanced treatments and work with medical professionals.',
    },
    {
      question: 'What certifications will I earn?',
      answer: 'Upon completion, you\'ll be eligible to take the Indiana State Board examination for esthetics licensure. You\'ll also receive DOL Registered Apprenticeship credentials.',
    },
  ],

  // CTA
  ctaTitle: 'Transform Your Future in Skincare',
  ctaSubtitle: 'Whether your dream is working in a luxury spa, a medical office, or building your own skincare business, your journey begins here.',
  ctas: [
    { label: 'Apply for Esthetics', href: '/programs/esthetician-apprenticeship/apply', variant: 'primary' },
    { label: 'Schedule a Tour', href: '/contact', variant: 'secondary' },
    { label: 'Explore Funding', href: '/check-eligibility', variant: 'outline' },
  ],
};

export default estheticsConfig;
