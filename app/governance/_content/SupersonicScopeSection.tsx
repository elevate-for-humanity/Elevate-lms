'use client';

import { Building2 } from 'lucide-react';

interface SupersonicScopeSectionProps {
  pageType: 'security' | 'compliance';
}

export function SupersonicScopeSection({ pageType }: SupersonicScopeSectionProps) {
  const content = {
    security: {
      title: 'Application to Supersonic Fast Cash LLC',
      description: 'This Security & Data Protection Statement applies to Supersonic Fast Cash LLC tax preparation services and optional refund-based advance products.',
      points: [
        'Tax preparation data is handled according to the same security standards described above',
        'Refund advance eligibility data follows the same access controls and retention policies',
        'No separate security policy exists for Supersonic services',
        'All data protection practices are inherited from the platform-wide security framework',
      ],
    },
    compliance: {
      title: 'Application to Supersonic Fast Cash LLC',
      description: 'This Compliance & Disclosure Framework applies to Supersonic Fast Cash LLC tax preparation services and optional refund-based advance products.',
      points: [
        'Tax preparation disclosures follow the same compliance standards described above',
        'Refund advance terms and eligibility are disclosed according to this framework',
        'No separate compliance policy exists for Supersonic services',
        'All disclosure requirements are inherited from the platform-wide compliance framework',
      ],
    },
  };

  const { title, description, points } = content[pageType];

  return (
    <section className="mb-12 bg-amber-50 rounded-xl p-6 border border-amber-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-amber-700" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      
      <p className="text-slate-700 mb-4">{description}</p>
      
      <ul className="space-y-2">
        {points.map((point, index) => (
          <li key={index} className="flex items-start gap-2 text-slate-700">
            <span className="text-amber-600 mt-1">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-slate-600 italic">
        This section clarifies scope only. It does not create separate rules, retention periods, 
        security claims, or disclosures beyond what is defined in the canonical governance documents.
      </p>
    </section>
  );
}
