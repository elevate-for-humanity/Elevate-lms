import type { ProgramConfig } from '../ProgramLanding';

export const cosmetologyConfig: ProgramConfig = {
  // Hero
  title: 'Transform Hair Into Art',
  tagline: 'DOL Registered Apprenticeship',
  subtitle: 'Master hair coloring, cutting, styling, and client services through paid apprenticeship in professional salons.',
  heroVideo: '/videos/programs/cosmetology-hero.mp4',
  heroImage: '/images/beauty/cosmetology-hero.webp',
  primaryCta: { label: 'Apply Now', href: '/programs/cosmetology-apprenticeship/apply' },
  secondaryCta: { label: 'Schedule a Tour', href: '/contact' },
  stats: [
    { value: '2,000', label: 'Training Hours' },
    { value: '18-24', label: 'Months' },
    { value: '$0', label: 'with Funding' },
  ],

  // Story
  storyScenarios: [
    "Imagine walking into your salon on your very first day. Your colorist mentor guides your first balayage client.",
    "Week after week your technique improves. Month after month your client list grows.",
    "By graduation you'll have built a loyal clientele and mastered the skills that clients pay premium prices for.",
    "That's the power of cosmetology apprenticeship.",
  ],

  // Comparison
  traditionalItems: [
    { text: 'Mostly classroom instruction' },
    { text: 'Limited real-world experience' },
    { text: 'Graduate, then build a clientele' },
    { text: 'Pay tuition upfront' },
    { text: 'Learn theory before practice' },
  ],
  apprenticeshipItems: [
    { text: 'Learn in a working salon' },
    { text: 'Mentorship from day one' },
    { text: 'Real clients, real feedback' },
    { text: 'Get paid while you learn' },
    { text: 'Build your book during training' },
    { text: 'Industry credentials earned' },
    { text: 'Portfolio built with real work' },
  ],

  // Journey
  journeySteps: [
    { icon: '📝', title: 'Apply', description: 'Complete our simple application online' },
    { icon: '🤝', title: 'Meet Advisor', description: 'One-on-one consultation to discuss your goals' },
    { icon: '💰', title: 'Funding Review', description: 'Explore funding options and payment plans' },
    { icon: '🏪', title: 'Salon Match', description: 'Get matched with a host salon partner' },
    { icon: '🎓', title: 'Orientation', description: 'Learn the program, meet your mentor' },
    { icon: '💇', title: 'Training Begins', description: 'Start your apprenticeship journey' },
    { icon: '🎉', title: 'Graduation', description: 'Complete hours, pass state exam, get licensed' },
  ],

  // Skills
  skills: [
    { name: 'Color Theory', icon: '🎨' },
    { name: 'Balayage', icon: '🌅' },
    { name: 'Hair Cutting', icon: '✂️' },
    { name: 'Blowouts & Styling', icon: '💨' },
    { name: 'Extensions', icon: '💇‍♀️' },
    { name: 'Bridal Styling', icon: '👰' },
    { name: 'Makeup Application', icon: '💄' },
    { name: 'Retail Sales', icon: '🛍️' },
    { name: 'Client Retention', icon: '💝' },
    { name: 'Business Building', icon: '📈' },
  ],

  // Career Outcomes
  salaries: [
    { title: 'Starting Salary', range: '$30K - $45K', description: 'per year' },
    { title: 'Mid-Career', range: '$45K - $65K', description: 'per year', popular: true },
    { title: 'Booth Rental', range: '$50K - $90K+', description: 'potential annual' },
  ],
  careers: [
    { title: 'Luxury Salon', icon: '✨' },
    { title: 'Full-Service Spa', icon: '💆' },
    { title: 'Hair Colorist', icon: '🎨' },
    { title: 'Styling Specialist', icon: '💇' },
    { title: 'Bridal Stylist', icon: '👰' },
    { title: 'Education', icon: '📚' },
    { title: 'Product Development', icon: '🧴' },
    { title: 'Salon Owner', icon: '🏢' },
  ],
  tuition: 5980,

  // Business
  businessItems: [
    'Building Your Personal Brand',
    'Social Media Marketing',
    'Pricing Your Services',
    'Client Retention Strategies',
    ' Booth Rental vs. Suite Ownership',
    'Building Multiple Revenue Streams',
    'Professional Photography for Portfolio',
  ],
  businessImage: '/images/beauty/cosmetology-hero.webp',

  // Mentors
  mentors: [
    {
      name: 'Keisha Williams',
      role: 'Master Colorist',
      photo: '/images/beauty/cosmetology-hero.webp',
      bio: 'Award-winning colorist specializing in balayage and color correction. Trained at Vidal Sassoon Academy.',
      credentials: ['Licensed Cosmetologist', 'Goldwell Color Certified', 'Pravana Elite Artist'],
    },
    {
      name: 'Marcus Thompson',
      role: 'Cutting Specialist',
      photo: '/images/pages/barber-apprenticeship-hero.webp',
      bio: '15+ years experience in precision cutting and modern styling techniques.',
      credentials: ['Licensed Barber', 'Master Stylist', 'Industry Educator'],
    },
    {
      name: 'Jennifer Chen',
      role: 'Makeup Artist',
      photo: '/images/beauty/esthetician-hero.webp',
      bio: 'Celebrity makeup artist with experience in editorial and bridal styling.',
      credentials: ['Licensed Esthetician', 'MAC Certified', 'Kim Kardashian Stylist Trained'],
    },
  ],

  // Testimonials
  testimonials: [
    {
      name: 'Marcus L.',
      program: 'Cosmetology',
      quote: 'The mentorship made all the difference. I learned from the best and now I\'m the one teaching others.',
      photo: '/images/pages/career-coaching.webp',
      before: 'College dropout, unsure of career path',
      after: 'Senior stylist at luxury salon, $62K annually',
    },
    {
      name: 'Destiny R.',
      program: 'Barber Apprenticeship',
      quote: 'I thought beauty school was out of reach. The apprenticeship let me earn while I learned.',
      photo: '/images/pages/about-supportive-services.webp',
      before: 'Working fast food, no career direction',
      after: 'Owns her own barbershop, $85K+ annually',
    },
    {
      name: 'Sophia K.',
      program: 'Esthetics',
      quote: 'I was intimidated to start over. The flexible schedule and support system made it possible.',
      photo: '/images/pages/career-services-hero.webp',
      before: 'Stay-at-home mom returning to workforce',
      after: 'Medical spa esthetician, $55K annually + tips',
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
      ctaHref: '/programs/cosmetology-apprenticeship/payment/bnpl',
      ctaLabel: 'Compare providers',
    },
  ],

  // FAQ
  faqs: [
    {
      question: 'What\'s the difference between cosmetology and barbering?',
      answer: 'Cosmetology covers a broader range of services including hair coloring, chemical treatments, makeup, and nail care. Barbering focuses primarily on men\'s haircutting and shaving. Cosmetology licenses allow you to work in both traditional salons and barbershops.',
    },
    {
      question: 'Will I learn advanced coloring techniques?',
      answer: 'Yes! Our apprenticeship program includes extensive training in color theory, balayage, highlights, color correction, and the latest trends. You\'ll work with real clients to build your portfolio.',
    },
    {
      question: 'Do I need a cosmetology license to work in Indiana?',
      answer: 'Yes, you need to pass the Indiana State Board of Cosmetology examination to become a licensed cosmetologist. Our program prepares you thoroughly for this exam.',
    },
    {
      question: 'Can I specialize in one area?',
      answer: 'Absolutely. While you\'ll receive comprehensive training, many stylists choose to specialize in areas like color, cutting, bridal styling, or extensions. We help you develop your unique path.',
    },
  ],

  // CTA
  ctaTitle: 'Your Future in Beauty Starts Here',
  ctaSubtitle: 'Whether your dream is working in a luxury salon, becoming a platform artist, or building your own brand, your journey begins here.',
  ctas: [
    { label: 'Apply for Cosmetology', href: '/programs/cosmetology-apprenticeship/apply', variant: 'primary' },
    { label: 'Schedule a Tour', href: '/contact', variant: 'secondary' },
    { label: 'Explore Funding', href: '/check-eligibility', variant: 'outline' },
  ],
};

export default cosmetologyConfig;
