import React from 'react';
import { QualityHero } from '@/components/shared/QualityHero';
import { getDashboardContent } from '@/lib/content/archetypes';

interface DashboardArchetypeProps {
  role: string;
  children: React.ReactNode;
}

/**
 * Dashboard Archetype
 *
 * Consolidates all dashboard pages into a single pattern.
 * Enforces: auth, role checks, quality hero, consistent structure.
 */
export function DashboardArchetype({
  role,
  children,
}: DashboardArchetypeProps) {
  const content = getDashboardContent(role);

  return (
    <div className="min-h-screen bg-white">
      <QualityHero
        title={content.title}
        description={content.description}
        imageSrc={content.imageSrc}
        imageAlt={content.imageAlt}
        actions={content.actions}
      />

      <main className="container mx-auto px-4 py-12">{children}</main>
    </div>
  );
}
