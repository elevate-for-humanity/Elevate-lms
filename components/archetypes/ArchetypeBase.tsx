"use client";

import React from 'react';

import {
  getArchetypeContent,
  type ArchetypeContent,
} from '@/lib/content/archetype-content';
import Image from 'next/image';

interface ArchetypeBaseProps {
  archetype: string;
  locale?: 'en' | 'es';
  children?: React.ReactNode;
  overrides?: Partial<ArchetypeContent>;
}

/**
 * Base component for all archetype pages
 * Ensures consistent structure and content inheritance
 */
export function ArchetypeBase({
  archetype,
  locale = 'en',
  children,
  overrides,
}: ArchetypeBaseProps) {
  const content = getArchetypeContent(archetype, locale);
  const finalContent = { ...content, ...overrides };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px]">
        {finalContent.hero.image && (
          <Image
            src={finalContent.hero.image}
            alt={finalContent.hero.imageAlt || ''}
            fill
            className="object-cover"
            priority
           sizes="100vw" />
        )}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl text-white">
              <h1 className="text-5xl font-bold mb-4">
                {finalContent.hero.title}
              </h1>
              <p className="text-xl mb-6">{finalContent.hero.purpose}</p>
              {finalContent.cta && (
                <div className="flex gap-4">
                  {finalContent.cta.primary && (
                    <a
                      href={finalContent.cta.primaryHref || '#'}
                      className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition"
                    >
                      {finalContent.cta.primary}
                    </a>
                  )}
                  {finalContent.cta.secondary && (
                    <a
                      href={finalContent.cta.secondaryHref || '#'}
                      className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition"
                    >
                      {finalContent.cta.secondary}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12">
        {Object.entries(finalContent.sections).map(([key, section]) => (
          <section key={key} className="mb-12">
            <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
            <p className="text-lg text-black mb-4">{section.content}</p>
            {section.emptyState && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-black">{section.emptyState}</p>
              </div>
            )}
          </section>
        ))}

        {/* Custom content from children */}
        {children}
      </div>
    </div>
  );
}
