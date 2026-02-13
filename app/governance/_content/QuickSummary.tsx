'use client';

import Link from 'next/link';
import { ExternalLink, FileText, Shield, Scale, Receipt } from 'lucide-react';

interface QuickSummaryProps {
  title: string;
  bullets: string[];
  showSupersonicScope?: boolean;
  elevateCanonicalPath: string;
}

const ELEVATE_BASE = 'https://www.elevateforhumanity.org';

export function QuickSummary({ 
  title, 
  bullets, 
  showSupersonicScope = false,
  elevateCanonicalPath 
}: QuickSummaryProps) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
          Quick Summary
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      
      <ul className="space-y-2 mb-4">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2 text-slate-700">
            <span className="text-emerald-600 mt-1">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-slate-600 mb-4 italic">
        Supersonic Fast Cash governance is defined by the canonical Elevate for Humanity governance documents.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`${ELEVATE_BASE}${elevateCanonicalPath}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Canonical Page
        </Link>
        <Link
          href={`${ELEVATE_BASE}/governance/authoritative-docs`}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-emerald-300 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Authoritative Documents
        </Link>
        <Link
          href={`${ELEVATE_BASE}/governance/security`}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-emerald-300 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          Security Statement
        </Link>
        <Link
          href={`${ELEVATE_BASE}/governance/compliance`}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-emerald-300 transition-colors"
        >
          <Scale className="w-3.5 h-3.5" />
          Compliance Framework
        </Link>
        <Link
          href={`${ELEVATE_BASE}/governance/authoritative-docs#doc-6`}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-emerald-300 transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          Tax Operations (Doc #6)
        </Link>
      </div>

      {showSupersonicScope && (
        <div className="mt-4 pt-4 border-t border-emerald-200">
          <p className="text-xs text-slate-500">
            This page applies to Supersonic Fast Cash LLC tax preparation and optional refund-based advance services.
          </p>
        </div>
      )}
    </div>
  );
}
