'use client';

import {
  HeroSection,
  ImagineSection,
  ComparisonSection,
  JourneySection,
  SkillsSection,
  CareerOutcomesSection,
  BusinessSection,
  MentorsSection,
  TestimonialsSection,
  FundingSection,
  FAQSection,
  CTASection,
} from './sections';
import FlatFeePaymentCalculator from '@/components/payments/FlatFeePaymentCalculator';

// Program configuration types
export interface ProgramConfig {
  // Hero
  title: string;
  tagline: string;
  subtitle: string;
  heroVideo?: string;
  heroImage: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: Array<{ value: string; label: string }>;
  
  // Story
  storyScenarios: string[];
  
  // Comparison
  traditionalItems: Array<{ text: string }>;
  apprenticeshipItems: Array<{ text: string }>;
  
  // Journey
  journeySteps: Array<{ icon: string; title: string; description: string; image?: string }>;
  
  // Skills
  skills: Array<{ name: string; icon?: string; image?: string }>;
  
  // Career Outcomes
  salaries: Array<{
    title: string;
    range: string;
    description?: string;
    popular?: boolean;
  }>;
  careers: Array<{ title: string; icon?: string; image?: string }>;
  tuition: number;
  programName?: string;
  
  // Business
  businessItems: string[];
  businessImage?: string;
  
  // Mentors
  mentors: Array<{
    name: string;
    role: string;
    photo: string;
    bio: string;
    credentials: string[];
  }>;
  
  // Testimonials
  testimonials: Array<{
    name: string;
    program: string;
    quote: string;
    photo: string;
    before: string;
    after: string;
  }>;
  
  // Funding
  fundingOptions: Array<{
    icon: string;
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
  }>;
  
  // FAQ
  faqs: Array<{ question: string; answer: string }>;
  
  // CTA
  ctaTitle: string;
  ctaSubtitle?: string;
  ctas: Array<{
    label: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
}

interface ProgramLandingProps {
  config: ProgramConfig;
  showCalculator?: boolean;
}

export default function ProgramLanding({ config, showCalculator = true }: ProgramLandingProps) {
  return (
    <main className="bg-white">
      {/* Hero */}
      <HeroSection
        title={config.title}
        tagline={config.tagline}
        subtitle={config.subtitle}
        heroVideo={config.heroVideo}
        heroImage={config.heroImage}
        primaryCta={config.primaryCta}
        secondaryCta={config.secondaryCta}
        stats={config.stats}
      />

      {/* Imagine Your Future */}
      <ImagineSection scenarios={config.storyScenarios} />

      {/* Why Apprenticeship */}
      <ComparisonSection
        traditionalItems={config.traditionalItems}
        apprenticeshipItems={config.apprenticeshipItems}
      />

      {/* Journey Timeline */}
      <JourneySection steps={config.journeySteps} />

      {/* Skills */}
      <SkillsSection skills={config.skills} />

      {/* Career Outcomes (Salary + Calculator + Jobs - unified) */}
      <CareerOutcomesSection
        salaries={config.salaries}
        careers={config.careers}
        calculatorEnabled={showCalculator}
        tuition={config.tuition}
      />

      {/* Business Ownership */}
      <BusinessSection
        items={config.businessItems}
        imageSrc={config.businessImage}
      />

      {/* Mentors */}
      <MentorsSection mentors={config.mentors} />

      {/* Success Stories */}
      <TestimonialsSection testimonials={config.testimonials} />

      {/* Funding */}
      <FundingSection options={config.fundingOptions} />

      {/* Payment Calculator */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-2xl mx-auto">
          <FlatFeePaymentCalculator
            programName={config.programName || config.title}
            programFee={config.tuition}
            onSelectPlan={(plan) => {
              window.location.href = '/programs/barber-apprenticeship/payment/bnpl';
            }}
          />
        </div>
      </section>

      {/* FAQ */}
      <FAQSection faqs={config.faqs} />

      {/* Final CTA */}
      <CTASection
        title={config.ctaTitle}
        subtitle={config.ctaSubtitle}
        ctas={config.ctas}
        videoSrc={config.heroVideo}
        videoPoster={config.heroImage}
      />
    </main>
  );
}
