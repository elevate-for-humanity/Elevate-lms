import type { ProgramConfig } from '../ProgramLanding';

export const barberConfig: ProgramConfig = {
  // Hero
  programName: 'Barber Apprenticeship Program',
  title: 'Master the Art of Barbering',
  tagline: 'DOL Registered Apprenticeship',
  subtitle: 'Learn precision cutting, straight razor shaves, beard design, and shop management through our DOL-registered apprenticeship.',
  heroVideo: '/videos/programs/barber-hero.mp4',
  heroImage: '/images/beauty/barber-hero.webp',
  primaryCta: { label: 'Apply Now', href: '/programs/barber-apprenticeship/apply' },
  secondaryCta: { label: 'Tour the Shop', href: '/programs/barber-apprenticeship/orientation' },
  stats: [
    { value: '2,000', label: 'Training Hours' },
    { value: '12-18', label: 'Months' },
    { value: '$0', label: 'with Funding' },
  ],

  // Story
  storyScenarios: [
    "Imagine walking into your salon on your very first day. Your mentor welcomes you. Clients begin arriving.",
    "Week after week your skills improve. Month after month your clientele grows.",
    "By graduation you won't just have classroom experience—you'll already have worked with real clients inside a professional salon.",
    "That's the power of apprenticeship.",
  ],

  // Comparison
  traditionalItems: [
    { text: 'Mostly classroom instruction' },
    { text: 'Limited real-world experience' },
    { text: 'Graduate, then find work' },
    { text: 'Pay tuition upfront' },
    { text: 'Build theory before practice' },
  ],
  apprenticeshipItems: [
    { text: 'Learn inside a working salon' },
    { text: 'Employer mentorship from day one' },
    { text: 'Real clients, real experience' },
    { text: 'Get paid while you learn' },
    { text: 'Career coaching included' },
    { text: 'Industry credentials earned' },
    { text: 'Professional portfolio built' },
  ],

  // Journey
  journeySteps: [
    { 
      icon: '📝', 
      title: 'Apply', 
      description: 'Complete our simple application online',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop&crop=face'
    },
    { 
      icon: '🤝', 
      title: 'Meet Advisor', 
      description: 'One-on-one consultation to discuss your goals and career path',
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=100&h=100&fit=crop&crop=face'
    },
    { 
      icon: '💰', 
      title: 'Funding Review', 
      description: 'Explore funding options including WIOA, grants, and payment plans',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=100&h=100&fit=crop'
    },
    { 
      icon: '🏪', 
      title: 'Salon Match', 
      description: 'Get matched with a host barbershop partner in your area',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop'
    },
    { 
      icon: '🎓', 
      title: 'Orientation', 
      description: 'Learn the program, meet your mentor, and get set up for success',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=100&h=100&fit=crop'
    },
    { 
      icon: '✂️', 
      title: 'Training Begins', 
      description: 'Start your apprenticeship with hands-on work at your host shop',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&h=100&fit=crop'
    },
    { 
      icon: '🎉', 
      title: 'Graduate & License', 
      description: 'Complete 2,000 hours, pass the state exam, and earn your Barber License',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&h=100&fit=crop'
    },
  ],

  // Skills
  skills: [
    { 
      name: 'Precision Haircutting', 
      image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=100&h=100&fit=crop'
    },
    { 
      name: 'Beard Sculpting', 
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=100&h=100&fit=crop'
    },
    { 
      name: 'Straight Razor Shaves', 
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop'
    },
    { 
      name: 'Hot Towel Treatments', 
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop'
    },
    { 
      name: 'Shop Management', 
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&h=100&fit=crop'
    },
    { 
      name: 'Client Consultation', 
      image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=100&h=100&fit=crop'
    },
    { 
      name: 'Sanitation & Safety', 
      image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=100&h=100&fit=crop'
    },
    { 
      name: 'Product Knowledge', 
      image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=100&h=100&fit=crop'
    },
    { 
      name: 'Business & Marketing', 
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop'
    },
    { 
      name: 'Portfolio Building', 
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100&h=100&fit=crop'
    },
  ],

  // Career Outcomes
  salaries: [
    { title: 'Starting Salary', range: '$35K - $55K', description: 'per year' },
    { title: 'Mid-Career', range: '$55K - $80K', description: 'per year', popular: true },
    { title: 'Booth/Suite Rental', range: '$60K - $100K+', description: 'potential annual' },
  ],
  careers: [
    { title: 'Traditional Barbershop', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop' },
    { title: 'Modern Grooming Lounge', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=100&h=100&fit=crop' },
    { title: 'Luxury Hotel Spa', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&h=100&fit=crop' },
    { title: 'Men\'s Grooming Brand', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=100&h=100&fit=crop' },
    { title: 'Film & TV Production', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=100&h=100&fit=crop' },
    { title: 'Social Media Influencer', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop' },
    { title: 'Barber Instructor', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=100&h=100&fit=crop' },
    { title: 'Shop Owner/Entrepreneur', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop' },
  ],
  tuition: 4980,
  minDownPayment: 1000,

  // Business
  businessItems: [
    'Branding & Social Media Marketing',
    'Pricing Your Services',
    'Client Retention Strategies',
    'Taxes & Business Registration',
    'Booth Rental vs. Suite Ownership',
    'Financial Literacy',
    'Building Multiple Income Streams',
  ],
  businessImage: '/images/beauty/barber-hero.webp',

  // Mentors
  mentors: [
    {
      name: 'Marcus Thompson',
      role: 'Master Barber Instructor',
      photo: '/images/pages/barber-apprenticeship-hero.webp',
      bio: '15+ years experience in traditional and modern barbering. Specializes in precision cuts and straight razor techniques.',
      credentials: ['Licensed Barber', 'DOL Registered Instructor', 'Master Barber'],
    },
    {
      name: 'Keisha Williams',
      role: 'Color Specialist',
      photo: '/images/beauty/cosmetology-hero.webp',
      bio: 'Award-winning colorist specializing in balayage and color correction. Trained at Vidal Sassoon Academy.',
      credentials: ['Licensed Cosmetologist', 'Goldwell Color Certified', 'Pravana Elite Artist'],
    },
    {
      name: 'Jennifer Chen',
      role: 'Medical Esthetician',
      photo: '/images/beauty/esthetician-hero.webp',
      bio: 'Former dermatology nurse now leading our esthetics program. Expert in clinical skincare treatments.',
      credentials: ['Licensed Esthetician', 'Certified Medical Esthetician', 'PCA Skin Certified'],
    },
  ],

  // Testimonials
  testimonials: [
    {
      name: 'Destiny R.',
      program: 'Barber Apprenticeship',
      quote: 'I thought beauty school was out of reach. The apprenticeship let me earn while I learned. Now I\'m building my own empire.',
      photo: '/images/pages/about-supportive-services.webp',
      before: 'Working fast food, no career direction',
      after: 'Owns her own barbershop, $85K+ annually',
    },
    {
      name: 'Marcus L.',
      program: 'Cosmetology',
      quote: 'The mentorship made all the difference. I learned from the best and now I\'m the one teaching others.',
      photo: '/images/pages/career-coaching.webp',
      before: 'College dropout, unsure of career path',
      after: 'Senior stylist at luxury salon, $62K annually',
    },
    {
      name: 'Sophia K.',
      program: 'Esthetics',
      quote: 'I was intimidated to start over. The flexible schedule and support system made it possible for me.',
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
      ctaHref: '/programs/barber-apprenticeship/payment/bnpl',
      ctaLabel: 'Compare providers',
    },
  ],

  // FAQ
  faqs: [
    {
      question: 'How does an apprenticeship differ from beauty school?',
      answer: 'In an apprenticeship, you learn by working alongside experienced professionals in a real barbershop. You earn wages while you train and gain hands-on experience with real clients. Traditional beauty school is classroom-based and you pay tuition before you start working.',
    },
    {
      question: 'Will I work with real clients during training?',
      answer: 'Yes! One of the main benefits of apprenticeship is that you\'ll be working with real clients from day one. This gives you practical experience that you can\'t get from classroom instruction alone.',
    },
    {
      question: 'Do I get paid while training?',
      answer: 'Yes. As an apprentice, you\'ll earn wages (typically $12-15/hour) while you complete your training hours at your host barbershop.',
    },
    {
      question: 'How many hours are required for licensure?',
      answer: 'The Indiana Barber License requires 2,000 hours of training, which includes both Related Technical Instruction (RTI) and On-the-Job Training (OJT).',
    },
    {
      question: 'What certifications will I earn?',
      answer: 'Upon completion, you\'ll be eligible to take the Indiana State Barber Examination and earn your Barber License. You\'ll also earn DOL Registered Apprenticeship credentials.',
    },
    {
      question: 'Can I open my own salon after graduating?',
      answer: 'Absolutely! Many of our graduates go on to open their own barbershops or salons. Our program includes business training to help you succeed as an entrepreneur.',
    },
  ],

  // CTA
  ctaTitle: 'Your Future Starts Behind the Chair',
  ctaSubtitle: 'Whether your dream is working in a luxury salon, owning your own studio, or building a beauty brand, your journey begins here.',
  ctas: [
    { label: 'Apply for Apprenticeship', href: '/programs/barber-apprenticeship/apply', variant: 'primary' },
    { label: 'Schedule a Tour', href: '/contact', variant: 'secondary' },
    { label: 'Explore Funding', href: '/check-eligibility', variant: 'outline' },
  ],
};

export default barberConfig;
