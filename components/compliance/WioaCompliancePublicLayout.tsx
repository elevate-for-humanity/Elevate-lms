import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function WioaCompliancePublicLayout({
  title,
  description,
  canonicalPath,
  breadcrumbItems,
  children,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  breadcrumbItems: { label: string; href?: string }[];
  children: React.ReactNode;
}) {
  const canonical = `${PLATFORM_DEFAULTS.siteUrl}${canonicalPath}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <section className="bg-slate-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
          <p className="text-slate-300 text-base md:text-lg">{description}</p>
          <p className="text-xs text-slate-500 mt-4 font-mono break-all">{canonical}</p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-slate max-w-none">{children}</div>
      <section className="border-t border-slate-200 py-8 px-4">
        <div className="max-w-3xl mx-auto text-sm text-slate-600">
          <p>
            Staff complete and sign forms in the{' '}
            <Link href="/login?redirect=/admin/compliance/wioa-etpl" className="text-brand-blue-600 hover:underline">
              admin compliance portal
            </Link>
            . Questions:{' '}
            <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="text-brand-blue-600 hover:underline">
              {PLATFORM_DEFAULTS.supportEmail}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
