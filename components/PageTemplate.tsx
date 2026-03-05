import React from 'react';
import Link from 'next/link';
import { ClickableImage } from './ClickableImage';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface PageTemplateProps {
  title: string;
  description: string;
  heroImage: string;
  heroImageAlt?: string;
  ctaPrimaryText?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryText?: string;
  ctaSecondaryHref?: string;
  features?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
  contentSections?: Array<{
    title: string;
    description: string;
    image?: string;
    imageAlt?: string;
    imageHref?: string;
    bullets?: string[];
    reverse?: boolean;
  }>;
  cards?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    href?: string;
  }>;
  gallery?: Array<{
    src: string;
    alt: string;
    href?: string;
  }>;
  finalCTA?: {
    title: string;
    description: string;
    primaryText: string;
    primaryHref: string;
    secondaryText?: string;
    secondaryHref?: string;
  };
}

export function PageTemplate({
  title,
  description,
  heroImage,
  heroImageAlt,
  ctaPrimaryText = 'Get Started',
  ctaPrimaryHref = '/contact',
  ctaSecondaryText = 'View Programs',
  ctaSecondaryHref = '/programs',
  features,
  contentSections,
  cards,
  gallery,
  finalCTA,
}: PageTemplateProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: title }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <ClickableImage src={heroImage} alt={heroImageAlt || title} fill priority sizes="100vw" objectFit="cover" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
            <p className="text-lg text-slate-300 mb-6 max-w-3xl mx-auto">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={ctaPrimaryHref} className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">{ctaPrimaryText}</Link>
              <Link href={ctaSecondaryHref} className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">{ctaSecondaryText}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Feature Highlights */}
            {features && features.length > 0 && (
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-black">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Content Sections */}
            {contentSections &&
              contentSections.map((section, index) => (
                <div
                  key={index}
                  className={`grid md:grid-cols-2 gap-12 items-center mb-16 ${
                    section.reverse ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className={section.reverse ? 'md:order-2' : ''}>
                    <h2 className="text-3xl font-bold mb-6">{section.title}</h2>
                    <p className="text-black mb-6">{section.description}</p>
                    {section.bullets && (
                      <ul className="space-y-3">
                        {section.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-slate-400 flex-shrink-0">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {section.image && (
                    <div
                      className={`relative h-96 rounded-2xl overflow-hidden shadow-xl ${section.reverse ? 'md:order-1' : ''}`}
                    >
                      <ClickableImage
                        src={section.image}
                        alt={section.imageAlt || section.title}
                        href={section.imageHref}
                        fill
                        quality={100}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                </div>
              ))}

            {/* Feature Cards */}
            {cards && cards.length > 0 && (
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {cards.map((card, index) => {
                  const CardContent = (
                    <>
                      <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                        {card.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {card.title}
                      </h3>
                      <p className="text-black">{card.description}</p>
                    </>
                  );

                  return card.href ? (
                    <Link
                      key={index}
                      href={card.href}
                      className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                    >
                      {CardContent}
                    </Link>
                  ) : (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm border p-6"
                    >
                      {CardContent}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gallery */}
            {gallery && gallery.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6 mb-16">
                {gallery.map((item, index) => (
                  <div
                    key={index}
                    className="relative h-64 rounded-lg overflow-hidden shadow-md"
                  >
                    <ClickableImage
                      src={item.src}
                      alt={item.alt}
                      href={item.href}
                      fill
                      quality={90}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {finalCTA && (
        <section className="py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">{finalCTA.title}</h2>
              <p className="text-xl text-brand-blue-100 mb-8">
                {finalCTA.description}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href={finalCTA.primaryHref}
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg transition-colors"
                >
                  {finalCTA.primaryText}
                </Link>
                {finalCTA.secondaryText && finalCTA.secondaryHref && (
                  <Link
                    href={finalCTA.secondaryHref}
                    className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg transition-colors"
                  >
                    {finalCTA.secondaryText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
