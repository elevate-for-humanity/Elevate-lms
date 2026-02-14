// Template for 90% of pages - NO HERO, text-first
import { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface ContentPageTemplateProps {
  title: string;
  description?: string;
  children: ReactNode;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
}

export default function ContentPageTemplate({
  title,
  description,
  children,
  breadcrumbItems,
}: ContentPageTemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={breadcrumbItems || [{ label: title }]} />
        </div>
      </div>

      {/* Simple header - no image */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          {description && (
            <p className="text-xl text-brand-blue-100 max-w-3xl">{description}</p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {children}
      </div>
    </div>
  );
}
