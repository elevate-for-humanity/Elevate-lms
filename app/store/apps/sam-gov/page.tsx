import { Metadata } from 'next';
import { ProductPage } from '@/components/store/ProductPage';

export const metadata: Metadata = {
  title: 'SAM.gov Assistant - Federal Contractor Registration Tool | Elevate Store',
  description: 'Complete your SAM.gov registration in hours, not days. Step-by-step wizard, compliance monitoring, and automatic renewal reminders. Trusted by 2,500+ organizations.',
  openGraph: {
    title: 'SAM.gov Assistant - Federal Contractor Registration Made Simple',
    description: 'Complete your SAM.gov registration in hours, not days. Step-by-step wizard, compliance monitoring, and automatic renewal reminders.',
    images: ['/images/apps/sam-gov/hero.jpg'],
  },
};

const productData = {
  name: 'SAM.gov Assistant',
  tagline: 'Federal Contractor Registration Made Simple',
  description: 'Stop struggling with SAM.gov registration. Our step-by-step wizard guides you through every field, validates your data in real-time, and keeps you compliant year after year with automatic renewal reminders.',
  longDescription: `
    The SAM.gov Assistant is the most comprehensive tool for federal contractor registration and compliance management. Whether you're registering for the first time or managing multiple entity registrations, our platform streamlines the entire process.

    **Why Training Providers Choose SAM.gov Assistant:**
    
    Federal contracting opens doors to billions in workforce development funding. But the SAM.gov registration process is notoriously complex - with 7 major sections, hundreds of fields, and strict validation requirements. One mistake can delay your registration by weeks.

    Our wizard breaks down the entire process into manageable steps, validates your data before submission, and provides plain-English guidance for every field. We've helped over 2,500 organizations complete their registrations with a 99.8% first-time approval rate.

    **Key Benefits:**
    - Save 20+ hours on registration and renewals
    - Avoid common mistakes that cause rejections
    - Never miss a renewal deadline
    - Manage multiple entities from one dashboard
    - Import existing data from SAM.gov or legacy DUNS records
  `,
  category: 'Government Contracting',
  rating: 4.9,
  reviewCount: 127,
  images: [
    { src: '/images/apps/sam-gov/hero.jpg', alt: 'SAM.gov Assistant Dashboard', type: 'image' as const },
    { src: '/images/apps/sam-gov/dashboard.jpg', alt: 'Registration Progress', type: 'image' as const },
    { src: '/images/apps/sam-gov/compliance.jpg', alt: 'Compliance Monitoring', type: 'image' as const },
    { src: '/images/apps/sam-gov/registration.jpg', alt: 'Step-by-Step Wizard', type: 'image' as const },
    { src: '/images/apps/sam-gov/hero.jpg', alt: 'Product Demo Video', type: 'video' as const },
  ],
  features: [
    {
      icon: 'FileText',
      title: 'Step-by-Step Registration Wizard',
      description: 'Guided walkthrough of all 7 SAM.gov registration sections with real-time validation. Never miss a required field or make a formatting error.',
    },
    {
      icon: 'Shield',
      title: 'Compliance Monitoring Dashboard',
      description: 'Track your registration status, expiration dates, and compliance requirements in one place. Get alerts for any issues that need attention.',
    },
    {
      icon: 'Bell',
      title: 'Automatic Renewal Reminders',
      description: 'Receive email and in-app notifications at 90, 60, and 30 days before expiration. Never let your registration lapse.',
    },
    {
      icon: 'Building2',
      title: 'Multi-Entity Management',
      description: 'Manage multiple business entities from a single dashboard. Perfect for holding companies, franchises, and organizations with subsidiaries.',
    },
    {
      icon: 'Search',
      title: 'UEI Lookup & Validation',
      description: 'Search for existing UEI numbers, validate your entity information, and ensure accuracy before submission.',
    },
    {
      icon: 'RefreshCw',
      title: 'Data Import & Sync',
      description: 'Import existing data from SAM.gov, CSV files, or legacy DUNS records. Keep everything synchronized automatically.',
    },
    {
      icon: 'Users',
      title: 'Team Collaboration',
      description: 'Invite team members with role-based permissions. Control who can view, edit, or submit registrations.',
    },
    {
      icon: 'Zap',
      title: 'NAICS Code Management',
      description: 'Search and select the right NAICS codes for your business. Get suggestions based on your industry and services.',
    },
  ],
  pricing: [
    {
      name: 'Starter',
      price: 49,
      originalPrice: 99,
      period: '/month',
      description: 'For small businesses getting started',
      features: [
        '1 Entity Registration',
        'Registration Wizard',
        'Basic Compliance Alerts',
        'Email Support',
        'UEI Lookup Tool',
        'Document Storage (1GB)',
      ],
      cta: 'Start Free Trial',
    },
    {
      name: 'Professional',
      price: 149,
      originalPrice: 299,
      period: '/month',
      description: 'For growing contractors',
      features: [
        '5 Entity Registrations',
        'Everything in Starter',
        'Advanced Compliance Dashboard',
        'Priority Support',
        'CAGE Code Management',
        'Annual Renewal Automation',
        'Team Access (3 users)',
        'Document Storage (10GB)',
        'API Access',
      ],
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Enterprise',
      price: 399,
      originalPrice: 599,
      period: '/month',
      description: 'For large organizations',
      features: [
        'Unlimited Entities',
        'Everything in Professional',
        'White-label Options',
        'Dedicated Account Manager',
        'Custom Integrations',
        'SLA Guarantee (99.9%)',
        'Unlimited Team Members',
        'Unlimited Storage',
        'Priority Phone Support',
        'Custom Training',
      ],
      cta: 'Contact Sales',
    },
  ],
  reviews: [
    {
      id: '1',
      author: 'Maria Rodriguez',
      rating: 5,
      date: 'January 15, 2026',
      title: 'Saved us 20+ hours on our renewal',
      content: 'We used to dread SAM.gov renewal time. This tool made it painless. The step-by-step wizard caught several errors we would have missed, and the auto-save feature meant we could work on it over several days without losing progress.',
      helpful: 24,
      verified: true,
    },
    {
      id: '2',
      author: 'James Chen',
      rating: 5,
      date: 'January 10, 2026',
      title: 'Perfect for managing multiple entities',
      content: 'We manage 12 different entity registrations. Before this tool, it was a nightmare keeping track of all the expiration dates and compliance requirements. Now everything is in one dashboard with automatic alerts.',
      helpful: 18,
      verified: true,
    },
    {
      id: '3',
      author: 'Sarah Thompson',
      rating: 5,
      date: 'December 28, 2025',
      title: 'DUNS migration was seamless',
      content: 'When we had to migrate from DUNS to UEI, this tool made it easy. Imported all our legacy data and mapped it to the new format automatically. Highly recommend for anyone going through the transition.',
      helpful: 15,
      verified: true,
    },
    {
      id: '4',
      author: 'Robert Williams',
      rating: 4,
      date: 'December 15, 2025',
      title: 'Great tool, wish it had more integrations',
      content: 'The registration wizard is excellent and the compliance dashboard is very helpful. Would love to see more integrations with other government systems like FPDS and USASpending.',
      helpful: 8,
      verified: true,
    },
    {
      id: '5',
      author: 'Jennifer Martinez',
      rating: 5,
      date: 'December 1, 2025',
      title: 'First-time registration approved immediately',
      content: 'As a first-time federal contractor, I was intimidated by SAM.gov. This tool walked me through every step and my registration was approved on the first try. The support team was also very responsive when I had questions.',
      helpful: 31,
      verified: true,
    },
  ],
  faqs: [
    {
      question: 'Do I still need to go to SAM.gov to complete my registration?',
      answer: 'Yes, final submission must be done on SAM.gov. Our tool helps you prepare all your data, validate it for errors, and guides you through the official submission process. We also help you maintain compliance after registration with renewal reminders and monitoring.',
    },
    {
      question: 'Can I import my existing SAM.gov registration?',
      answer: 'Yes! You can sync your existing registration data directly from SAM.gov using your Login.gov credentials. You can also import from CSV/Excel files or migrate legacy DUNS records.',
    },
    {
      question: 'How do renewal reminders work?',
      answer: 'We send email and in-app notifications at 90, 60, and 30 days before your registration expires. You can also customize the reminder schedule and add additional recipients.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use bank-level encryption (AES-256), are SOC 2 compliant, and never store your Login.gov credentials. Your data is encrypted at rest and in transit.',
    },
    {
      question: 'Can multiple team members access the account?',
      answer: 'Yes, Professional and Enterprise plans include team access with role-based permissions. You can control who can view, edit, or submit registrations.',
    },
    {
      question: 'What if I need help during registration?',
      answer: 'All plans include email support. Professional plans get priority support with faster response times. Enterprise customers get a dedicated account manager and phone support.',
    },
  ],
  whatsIncluded: [
    'Full access to registration wizard',
    'Compliance monitoring dashboard',
    'Automatic renewal reminders',
    'UEI lookup and validation tool',
    'Document storage and management',
    'Data import/export tools',
    'Email support',
    'Knowledge base access',
    'Free product updates',
    '30-day money-back guarantee',
  ],
  requirements: [
    'Modern web browser (Chrome, Firefox, Safari, Edge)',
    'Internet connection',
    'Login.gov account (for SAM.gov submission)',
    'Valid EIN/Tax ID',
    'Business documentation (varies by entity type)',
  ],
  lastUpdated: 'January 20, 2026',
  version: '3.2.1',
  developer: 'Elevate for Humanity',
  supportEmail: 'elevate4humanityedu@gmail.com',
};

export default function SamGovProductPage() {
  return <ProductPage product={productData} />;
}
