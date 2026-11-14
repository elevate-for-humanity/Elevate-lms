import Link from 'next/link';
import { Download } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  getHostShopMouMeta,
  getHostShopMouSections,
  type HostShopMouProgram,
} from '@/lib/partners/host-shop-mou-sections';

type Props = {
  program: HostShopMouProgram;
  /** Anchor id for in-page links from acknowledgment checkboxes */
  id?: string;
  className?: string;
};

export default function HostShopMouPreview({ program, id = 'host-shop-mou', className = '' }: Props) {
  const meta = getHostShopMouMeta(program);
  const sections = getHostShopMouSections(program);

  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <InstitutionalHeader
            documentType={meta.documentType}
            title={meta.title}
            subtitle={meta.subtitle}
            noDivider
          />
          <div className="text-sm text-slate-700 border-t border-slate-200 pt-4 mt-2 space-y-1">
            <p>
              <strong>Between:</strong> 2Exclusive LLC-S d/b/a {PLATFORM_DEFAULTS.orgName} Career
              &amp; Technical Institute (&ldquo;Sponsor&rdquo;)
            </p>
            <p>
              <strong>And:</strong> {meta.worksiteLabel} (&ldquo;Worksite Partner&rdquo;)
            </p>
            <p>
              <strong>RAPIDS Program ID:</strong> {meta.rapidsId}
            </p>
          </div>
          <p className="text-sm text-slate-600 mt-3">
            Read the full agreement below before acknowledging. After your application is approved,
            you will digitally sign this MOU in your partner onboarding portal.
          </p>
        </div>
        <div className="p-6 space-y-6 max-h-[28rem] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-slate-900 mb-1">{section.title}</h3>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t bg-slate-50 rounded-b-xl flex flex-wrap items-center gap-4">
          <Link
            href={meta.handbookHref}
            className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
          >
            Partner Handbook
          </Link>
          {meta.fullDocHref ? (
            <Link
              href={meta.fullDocHref}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Download / print full MOU
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
