export type ImplementationPackageId =
  | 'standalone-launch'
  | 'standalone-growth'
  | 'standalone-professional';

export interface ImplementationPackage {
  id: ImplementationPackageId;
  name: string;
  shortDescription: string;
  totalCents: number;
  depositCents: number;
  installmentCount: number;
  installmentCents: number;
  deliveryWindow: string;
  recommended?: boolean;
  features: string[];
  initialContent: string[];
}

export const IMPLEMENTATION_PACKAGES: Record<ImplementationPackageId, ImplementationPackage> = {
  'standalone-launch': {
    id: 'standalone-launch',
    name: 'Standalone Launch',
    shortDescription:
      'A branded standalone website, client portal and learning platform for an affordable first launch.',
    totalCents: 300_000,
    depositCents: 75_000,
    installmentCount: 6,
    installmentCents: 37_500,
    deliveryWindow: '2–3 weeks',
    features: [
      'Separate branded deployment, database and user accounts',
      'Website builder with editable branded pages',
      'Unlimited courses, modules and lessons',
      'Course runner, client dashboard and progress tracking',
      'Text, video, PDF, external-link and quiz lessons',
      'One intake quiz and appointment-request workflow',
      'Basic PARIS assistant for navigation and approved FAQs',
      'Domain connection, launch testing and administrator training',
    ],
    initialContent: ['1 example course', 'Up to 10 lessons', '1 intake quiz'],
  },
  'standalone-growth': {
    id: 'standalone-growth',
    name: 'Standalone Growth',
    shortDescription:
      'A complete client journey from intake and assessment through paid learning and completion.',
    totalCents: 650_000,
    depositCents: 150_000,
    installmentCount: 10,
    installmentCents: 50_000,
    deliveryWindow: '3–5 weeks',
    recommended: true,
    features: [
      'Everything included in Standalone Launch',
      'Advanced drag-and-drop course builder',
      'Unlimited quizzes, assessments, courses and lessons',
      'Quiz → discovery → assessment → recommended-program workflow',
      'Stripe payments, subscriptions and calendar booking',
      'Certificates, client files and transactional email notifications',
      'PARIS with text and microphone support',
      'PARIS knowledge base built from approved business materials',
      'Basic administrative reporting and 30-day defect warranty',
    ],
    initialContent: [
      '2 example courses',
      'Up to 25 lessons',
      '2 assessments',
      '1 certificate',
      '1 payment plan',
    ],
  },
  'standalone-professional': {
    id: 'standalone-professional',
    name: 'Standalone Professional',
    shortDescription:
      'A broader business and learning platform for multiple coaches, pathways, workshops and client management.',
    totalCents: 1_000_000,
    depositCents: 250_000,
    installmentCount: 12,
    installmentCents: 62_500,
    deliveryWindow: '5–7 weeks',
    features: [
      'Everything included in Standalone Growth',
      'Four service-area or program pathways',
      'Multiple administrator and coach roles',
      'Coaching sessions, workshops and event management',
      'Client community, notes and follow-up workflows',
      'Advanced reports and multiple payment-plan configurations',
      'Advanced PARIS intake, voice and course guidance',
      'Activity logs, backup and recovery configuration',
      'Two administrator training sessions and 60-day defect warranty',
    ],
    initialContent: [
      '4 example courses',
      'Up to 50 lessons',
      '4 assessments',
      'Expanded automation',
    ],
  },
};

export function getImplementationPackage(id: string): ImplementationPackage | null {
  return IMPLEMENTATION_PACKAGES[id as ImplementationPackageId] ?? null;
}

export function formatImplementationPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
