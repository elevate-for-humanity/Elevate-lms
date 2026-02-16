import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import type { MarketingPage, MarketingSection } from '@/lib/api/marketing';

interface MarketingPageContentProps {
  page: MarketingPage;
}

/**
 * Renders marketing page content from database.
 * Strict rendering: Only renders what exists in DB.
 */
export function MarketingPageContent({ page }: MarketingPageContentProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center">
        <Image
          src={page.hero_image}
          alt={page.hero_image_alt}
          fill
          className="object-cover"
          priority
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
              {page.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Sections */}
      {page.sections.map((section) => (
        <MarketingSectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

function MarketingSectionRenderer({ section }: { section: MarketingSection }) {
  switch (section.section_type) {
    case 'text':
      return <TextSection section={section} />;
    case 'features':
      return <FeaturesSection section={section} />;
    case 'cta':
      return <CTASection section={section} />;
    case 'stats':
      return <StatsSection section={section} />;
    case 'faq':
      return <FAQSection section={section} />;
    default:
      return <TextSection section={section} />;
  }
}

function TextSection({ section }: { section: MarketingSection }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">{section.heading}</h2>
        <div 
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body || '') }}
        />
      </div>
    </section>
  );
}

function FeaturesSection({ section }: { section: MarketingSection }) {
  // Parse body as JSON array of features if possible
  let features: string[] = [];
  try {
    features = JSON.parse(section.body);
  } catch {
    features = section.body.split('\n').filter(Boolean);
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.heading}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <p className="text-gray-700">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ section }: { section: MarketingSection }) {
  return (
    <section className="py-16 bg-brand-blue-600">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">{section.heading}</h2>
        <p className="text-xl text-brand-blue-100 mb-8">{section.body}</p>
        <Link
          href="/apply"
          className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-50 transition"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}

function StatsSection({ section }: { section: MarketingSection }) {
  // Parse body as JSON array of stats
  let stats: { value: string; label: string }[] = [];
  try {
    stats = JSON.parse(section.body);
  } catch {
    return null;
  }

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-12 text-center">{section.heading}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl font-bold text-brand-blue-400 mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ section }: { section: MarketingSection }) {
  // Parse body as JSON array of FAQs
  let faqs: { question: string; answer: string }[] = [];
  try {
    faqs = JSON.parse(section.body);
  } catch {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.heading}</h2>
        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
