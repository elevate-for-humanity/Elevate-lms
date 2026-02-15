import Link from 'next/link';
import { HeroSection } from '@/components/sections/HeroSection';
import { AtAGlanceSection } from '@/components/sections/AtAGlanceSection';
import { WhoThisIsForSection } from '@/components/sections/WhoThisIsForSection';
import { ProgramsGridSection } from '@/components/sections/ProgramsGridSection';
import { CTASection } from '@/components/sections/CTASection';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export interface CategoryPageData {
  // Hero
  title: string;
  description: string;
  badges?: Array<{ text: string; color: string }>;
  heroGradient?: string;

  // At-a-Glance
  duration?: string;
  cost?: string;
  format?: string;
  outcome?: string;

  // Who This Is For
  targetAudience?: string[];

  // Programs in this category
  programs: Array<{
    slug: string;
    name: string;
    shortDescription: string;
    duration: string;
    price?: string;
    heroImage?: string;
  }>;

  // CTA
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
}

interface CategoryPageTemplateProps {
  data: CategoryPageData;
}

export function CategoryPageTemplate({ data }: CategoryPageTemplateProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: data.title }]} />
        </div>
      </div>

      {/* Hero Section */}
      <HeroSection
        title={data.title}
        description={data.description}
        badges={data.badges}
        primaryCTA={data.ctaPrimary || { text: 'Apply Now', href: '/apply' }}
        secondaryCTA={
          data.ctaSecondary || { text: 'Talk to an Advisor', href: '/contact' }
        }
      />

      {/* At-a-Glance Section */}
      {(data.duration || data.cost || data.format || data.outcome) && (
        <AtAGlanceSection
          duration={data.duration}
          cost={data.cost}
          format={data.format}
          outcome={data.outcome}
        />
      )}

      {/* Who This Is For Section */}
      {data.targetAudience && data.targetAudience.length > 0 && (
        <WhoThisIsForSection items={data.targetAudience} />
      )}

      {/* Programs Grid */}
      <ProgramsGridSection
        title={`${data.title} Programs`}
        programs={data.programs}
      />

      {/* CTA Section */}
      <CTASection
        title="Ready to Get Started?"
        description="Apply now or talk to an advisor to learn more about our programs."
        primaryCTA={data.ctaPrimary || { text: 'Apply Now', href: '/apply' }}
        secondaryCTA={
          data.ctaSecondary || { text: 'Contact Us', href: '/contact' }
        }
      />
    </main>
  );
}
