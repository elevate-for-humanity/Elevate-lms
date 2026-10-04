'use client';

import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { siteConfig as contactConfig } from '@/lib/config/site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { LEGAL_ENTITY_OPERATING_LINE } from '@/lib/config/legal-entity';
import { PARTNER_LINKS } from '@/config/social-links';
import { ROUTES } from '@/lib/navigation/routes';
import { ResponsiveDetails } from '@/components/ui/ResponsiveDetails';
import { Mail, Phone, MapPin, Facebook, Linkedin, Instagram, ExternalLink } from 'lucide-react';

const GROUPS = [
  { title: 'Programs', links: [[ROUTES.programs, 'All Programs'], [ROUTES.programsHealthcare, 'Healthcare'], ['/programs/skilled-trades', 'Skilled Trades'], [ROUTES.programsTechnology, 'Technology'], [ROUTES.storeDemo, 'Platform Demo']] },
  { title: 'Apprenticeships', links: [[ROUTES.apprenticeships, 'All Apprenticeships'], [ROUTES.programsBarber, 'Barber'], [ROUTES.programsCosmetology, 'Cosmetology'], [ROUTES.programsEsthetician, 'Esthetics'], [ROUTES.programsNailTech, 'Nail Technician']] },
  { title: 'Funding', links: [[ROUTES.funding, 'All Funding Options'], [ROUTES.fundingWIOA, 'WIOA / WorkOne'], ['/funding/wrg', 'Workforce Ready Grant'], [ROUTES.fundingJobReadyIndy, 'Job Ready Indy'], [ROUTES.scholarships, 'Scholarships'], [ROUTES.eligibility, 'Check Eligibility']] },
] as const;

const LEGAL_LINKS = [
  ['/privacy', 'Privacy Policy'],
  ['/terms-of-service', 'Terms of Service'],
  ['/security-and-data-protection', 'Security & Data'],
  ['/accessibility', 'Accessibility'],
  ['/federal-compliance', 'Federal Compliance'],
  ['/legal', 'Legal & Policies'],
] as const;

export function SiteFooter() {
  return (
    <footer data-public-footer className="border-t border-slate-200 bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <p className="mb-7 max-w-4xl text-sm leading-6 text-slate-700"><strong className="text-slate-950">Funding notice:</strong> Individual programs may be eligible for WIOA, Workforce Ready Grant, or other funding. Eligibility and availability vary by program and participant; funding is not guaranteed.</p>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5 lg:gap-7">
          <div>
            <p className="text-lg font-bold text-slate-950">{siteConfig.name}</p>
            <p className="mt-2 text-base leading-6 text-slate-700">{siteConfig.description}</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">Career programs are supported by our nonprofit partner, Selfish Inc. d/b/a Rise Forward Foundation, through available community and wraparound resources. Support is subject to eligibility and program availability.</p>
            <Link href={PARTNER_LINKS.riseForwardFoundation} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 hover:underline">Learn about Rise Forward Foundation</Link>
            <div className="mt-3 flex gap-3">
              <a href="https://www.facebook.com/61578240192934/" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-950" aria-label="Elevate for Humanity on Facebook"><Facebook className="h-5 w-5" aria-hidden="true" /></a>
              <a href="https://linkedin.com/company/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-950" aria-label="LinkedIn"><Linkedin className="h-5 w-5" aria-hidden="true" /></a>
              <a href="https://instagram.com/elevateforhumanity" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-950" aria-label="Instagram"><Instagram className="h-5 w-5" aria-hidden="true" /></a>
            </div>
          </div>
          {GROUPS.map(({ title, links }) => (
            <ResponsiveDetails key={title} title={title}>
              <nav aria-label={`Footer ${title.toLowerCase()}`}>
                <ul>{links.map(([href, label]) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center text-sm text-slate-700 hover:text-slate-950 hover:underline">{label}</Link></li>)}</ul>
              </nav>
            </ResponsiveDetails>
          ))}
          <div>
            <p className="text-base font-bold text-slate-950">Contact</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="flex min-h-11 items-center gap-2 hover:text-slate-950 hover:underline"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-all">{PLATFORM_DEFAULTS.supportEmail}</span></a>
              <a href={contactConfig.phone.href} className="flex min-h-11 items-center gap-2 hover:text-slate-950 hover:underline"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Main Phone: {contactConfig.phone.display}</span></a>
              <a href={contactConfig.technicalSupport.href} className="flex min-h-11 items-center gap-2 hover:text-slate-950 hover:underline"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" /><span>Technical Support: {contactConfig.technicalSupport.display}</span></a>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{siteConfig.address}</p>
              <Link href={ROUTES.contact} className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-4 py-2 font-bold text-white hover:bg-brand-red-800">Contact Us</Link>
            </div>
          </div>
        </div>
        <div className="mt-7 border-t border-slate-200 pt-5">
          <p className="text-sm leading-6 text-slate-700"><strong className="text-slate-950">Operating structure:</strong> {LEGAL_ENTITY_OPERATING_LINE}. Training, public funding, and charitable support remain separate functions with separate eligibility and authorization requirements.</p>
          <nav aria-label="Legal and policies" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
            {LEGAL_LINKS.map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center hover:text-slate-950 hover:underline">{label}</Link>)}
            <a href="https://www.dol.gov/agencies/eta/apprenticeship" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 hover:text-slate-950 hover:underline">DOL Apprenticeship <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
          </nav>
          <p className="mt-3 text-sm text-slate-600">© {new Date().getFullYear()} {PLATFORM_DEFAULTS.orgName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
