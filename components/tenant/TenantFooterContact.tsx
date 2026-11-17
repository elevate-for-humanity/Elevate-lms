'use client';

import type { TenantSiteConfig } from '@/lib/tenant/site-types';
import { footerContactDetails } from '@/lib/tenant/footer-contact';
import { useReadOnlyTenantPreview } from './TenantPreviewContext';

export function TenantFooterContact({ config }: { config: TenantSiteConfig }) {
  const readOnly = useReadOnlyTenantPreview();
  const details = footerContactDetails(config);
  if (!details) return null;
  const linkClass = 'block min-h-11 break-words py-3 font-normal hover:underline focus-visible:outline focus-visible:outline-2';
  return <section aria-label="Business contact details" className="min-w-0 max-w-full text-sm font-normal">
    <h2 className="mb-2 text-base font-bold">Contact</h2>
    <address className="not-italic">
      {details.address ? <p className="whitespace-pre-line break-words leading-6">{details.address}</p> : null}
      {details.email ? !readOnly && details.emailHref ? <a className={`${linkClass} [overflow-wrap:anywhere]`} href={details.emailHref}>{details.email}</a> : <p className="min-h-11 py-3 [overflow-wrap:anywhere]">{details.email}</p> : null}
      {details.phone ? !readOnly && details.phoneHref ? <a className={linkClass} href={details.phoneHref}>{details.phone}</a> : <p className="min-h-11 break-words py-3">{details.phone}</p> : null}
    </address>
    {details.hours.length ? <ul aria-label="Business hours" className="mt-2 space-y-1">{details.hours.map((hours, index) => <li className="break-words" key={index}>{hours}</li>)}</ul> : null}
  </section>;
}
