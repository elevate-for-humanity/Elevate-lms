import Link from 'next/link';
import Image from 'next/image';
import { HeroSection } from '@/components/sections/HeroSection';
import { AtAGlanceSection } from '@/components/sections/AtAGlanceSection';
import { WhoThisIsForSection } from '@/components/sections/WhoThisIsForSection';
import { CTASection } from '@/components/sections/CTASection';
import { Award, Briefcase } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export interface ProgramDetailData {
  // Basic info
  slug: string;
  name: string;
  heroTitle?: string;
  heroSubtitle?: string;
  shortDescription?: string;
  longDescription?: string;

  // Hero
  heroImage?: string;
  heroImageAlt?: string;
  badges?: Array<{ text: string; color: string }>;
  heroGradient?: string;

  // At-a-Glance
  duration?: string;
  schedule?: string;
  delivery?: string;
  credential?: string;
  price?: string;

  // Details
  highlights?: string[];
  whatYouLearn?: string[];
  outcomes?: string[];
  requirements?: string[];
  fundingOptions?: string[];

  // CTA
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
}

interface ProgramDetailTemplateProps {
  data: ProgramDetailData;
}

export function ProgramDetailTemplate({ data }: ProgramDetailTemplateProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: data.name }]} />
        </div>
      </div>

      {/* Hero Section */}
      <HeroSection
        title={data.heroTitle || data.name}
        description={data.heroSubtitle || data.shortDescription || ''}
        badges={data.badges}
        primaryCTA={data.ctaPrimary || { text: 'Apply Now', href: '/apply' }}
        secondaryCTA={
          data.ctaSecondary || { text: 'Talk to an Advisor', href: '/contact' }
        }
      />

      {/* At-a-Glance Section */}
      <AtAGlanceSection
        duration={data.duration}
        cost={data.price || 'Free with funding when eligible'}
        format={data.delivery}
        outcome={data.credential}
      />

      {/* Program Description */}
      {data.longDescription && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-bold text-black mb-6">
              About This Program
            </h2>
            <div className="prose prose-lg max-w-none text-black">
              <p>{data.longDescription}</p>
            </div>
          </div>
        </section>
      )}

      {/* Program Highlights */}
      {data.highlights && data.highlights.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-bold text-black mb-6">
              Program Highlights
            </h2>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <ul className="space-y-4">
                {data.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-black">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* What You'll Learn */}
      {data.whatYouLearn && data.whatYouLearn.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-8 h-8 text-brand-blue-600" />
              <h2 className="text-3xl font-bold text-black">
                What You'll Learn
              </h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <ul className="space-y-4">
                {data.whatYouLearn.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-black">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Career Outcomes */}
      {data.outcomes && data.outcomes.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-black">Career Outcomes</h2>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <ul className="space-y-4">
                {data.outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-black">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Requirements */}
      {data.requirements && data.requirements.length > 0 && (
        <WhoThisIsForSection title="Requirements" items={data.requirements} />
      )}

      {/* Funding Options */}
      {data.fundingOptions && data.fundingOptions.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-bold text-black mb-6">
              Funding Options
            </h2>
            <div className="bg-brand-blue-50 rounded-xl p-8 border border-brand-blue-200">
              <ul className="space-y-4">
                {data.fundingOptions.map((option, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-black">{option}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <CTASection
        title="Ready to Start Your Career?"
        description="Apply now or talk to an advisor to learn more about this program."
        primaryCTA={data.ctaPrimary || { text: 'Apply Now', href: '/apply' }}
        secondaryCTA={
          data.ctaSecondary || { text: 'Contact Us', href: '/contact' }
        }
      />
    </main>
  );
}
