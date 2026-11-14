import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import type { ApprenticePortalConfig } from '@/components/portal/ApprenticePortalShell';

type Props = {
  config: ApprenticePortalConfig;
  links: { label: string; href: string }[];
};

export function ComplianceLinksCard({ config, links }: Props) {
  if (links.length === 0) return null;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Compliance & verification</h2>
        <div className="grid sm:grid-cols-3 gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-sm font-medium text-slate-800"
            >
              <ClipboardCheck className={`w-4 h-4 ${config.accentText} shrink-0`} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
