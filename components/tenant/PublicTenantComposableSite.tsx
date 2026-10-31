/* eslint-disable @next/next/no-img-element */
'use client';

import type { MouseEvent, ReactNode } from 'react';
import './legacy83-premium.css';
import { ChartNoAxesCombined, UsersRound, Sprout, Flag } from 'lucide-react';
import { TenantIntroduction } from '@/components/tenant/TenantIntroduction';
import { TenantParis } from '@/components/tenant/TenantParis';
import { TenantHiringApplication } from '@/components/tenant/TenantHiringApplication';
import { tenantSiteHref as hrefFor } from '@/lib/tenant/site-links';
import type { PublishedTenantSite, TenantSiteSection } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig, normalizePageSlug } from '@/lib/tenant/site-composition';
import { TenantAssessment, TenantEvents, TenantJournal } from '@/components/tenant/TenantInteractiveSections';
import {
  TenantCustomLeadForm,
  TenantLeadForm,
  TenantTrackedLink,
  type TenantCustomFormField,
} from '@/components/tenant/TenantSiteClientOps';

function external(href: string) {
  return /^https?:\/\//i.test(href);
}


function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function list(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>
    : [];
}

function customFields(value: unknown): TenantCustomFormField[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(['text', 'email', 'tel', 'textarea', 'select']);
  return value.slice(0, 20).flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const raw = entry as Record<string, unknown>;
    const name = text(raw.name).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
    const label = text(raw.label).slice(0, 160);
    if (!name || !label) return [];
    const requestedType = text(raw.type);
    const type = allowed.has(requestedType)
      ? requestedType as TenantCustomFormField['type']
      : 'text';
    return [{
      name,
      label,
      type,
      required: raw.required === true,
      options: Array.isArray(raw.options)
        ? raw.options.map((option) => text(option).slice(0, 120)).filter(Boolean).slice(0, 30)
        : undefined,
    }];
  });
}

function ActionLink({
  href,
  children,
  primary,
  basePath,
  eventName = 'cta_click',
}: {
  href: string;
  children: ReactNode;
  primary: string;
  basePath: string;
  eventName?: 'cta_click' | 'booking_click' | 'product_click';
}) {
  const resolved = hrefFor(href, basePath);
  return (
    <TenantTrackedLink
      href={resolved}
      eventName={eventName}
      external={external(resolved)}
      className="inline-flex rounded-full px-6 py-3 font-black text-white shadow-sm"
      style={{ backgroundColor: primary }}
    >
      {children}
    </TenantTrackedLink>
  );
}

function Section({ section, primary, secondary, basePath, websiteId, businessName, isPageHeading = false }: { section: TenantSiteSection; primary: string; secondary: string; basePath: string; websiteId: string; businessName: string; isPageHeading?: boolean }) {
  if (section.visible === false) return null;
  const c = section.content || {};
  const align = text(section.settings?.align) || 'left';
  const centered = align === 'center';
  const variant = text(section.settings?.variant);

  if (section.type === 'hiring_application') return <TenantHiringApplication websiteId={websiteId} businessName={businessName} accent={primary} />;

  if (section.type === 'hero') {
    const image = text(c.image);
    const Heading = isPageHeading ? 'h1' : 'h2';
    const title = text(c.title);
    const highlight = text(c.titleHighlight);
    const highlightAt = highlight ? title.indexOf(highlight) : -1;
    const titleLines = Array.isArray(c.titleLines) ? c.titleLines.map(text).filter(Boolean) : [];
    const highlights = list(c.highlights);
    const highlightIcons = [ChartNoAxesCombined, UsersRound, Sprout];
    const imageSegment = typeof c.imageSegment === 'number' && c.imageSegment >= 0 && c.imageSegment <= 3 ? c.imageSegment : null;
    return (
      <section className="tenant-hero border-b border-black/5" data-has-image={Boolean(image)} data-variant={variant}>
        <div className={`mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 lg:py-28 ${image ? 'lg:grid-cols-2' : ''}`}>
          <div className={centered || !image ? 'text-center' : ''}>
            {text(c.eyebrow) ? <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: secondary }}>{text(c.eyebrow)}</p> : null}
            <Heading className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{titleLines.length ? titleLines.map((line, index) => <span className="tenant-title-line" key={index}>{index > 0 ? ' ' : ''}{highlight && line.includes(highlight) ? <>{line.slice(0, line.indexOf(highlight))}<em>{highlight}</em>{line.slice(line.indexOf(highlight) + highlight.length)}</> : line}</span>) : highlightAt >= 0 ? <><span className="tenant-title-prefix">{title.slice(0, highlightAt)}</span><span className="tenant-title-highlight">{highlight}</span>{title.slice(highlightAt + highlight.length)}</> : title}</Heading>
            {text(c.text) ? <p className={`mt-5 text-lg leading-8 text-slate-600 ${centered || !image ? 'mx-auto max-w-3xl' : 'max-w-2xl'}`}>{text(c.text)}</p> : null}
            {text(c.veteranAcknowledgement) ? <p className="tenant-veteran-note"><Flag aria-hidden="true" /><span>{text(c.veteranAcknowledgement)}</span></p> : null}
            {text(c.narration) ? <TenantIntroduction narration={text(c.narration)} musicUrl={text(c.musicUrl)} /> : null}
            {text(c.buttonText) || text(c.secondaryButtonText) ? <div className={`tenant-hero-actions mt-8 flex flex-wrap gap-4 ${centered || !image ? 'justify-center' : ''}`}>{text(c.buttonText) ? <ActionLink href={text(c.buttonHref) || '/contact'} primary={primary} basePath={basePath}>{text(c.buttonText)}</ActionLink> : null}{text(c.secondaryButtonText) ? <ActionLink href={text(c.secondaryButtonHref) || '/services'} primary={secondary} basePath={basePath}>{text(c.secondaryButtonText)}</ActionLink> : null}</div> : null}
            {highlights.length ? <div className="tenant-hero-highlights">{highlights.slice(0, 3).map((item, index) => { const Icon = highlightIcons[index] || Sprout; return <div key={index}><Icon aria-hidden="true" /><strong>{text(item.title)}</strong><span>{text(item.text)}</span></div>; })}</div> : null}
          </div>
          {image ? <figure className="tenant-hero-media"><div data-image-strip={imageSegment !== null} className="tenant-hero-image-frame overflow-hidden rounded-[2rem] bg-slate-100 shadow-2xl ring-1 ring-black/5"><img src={image} alt={text(c.imageAlt) || text(c.title)} style={imageSegment !== null ? { width: '400%', maxWidth: 'none', height: 'auto', minHeight: 0, position: 'absolute', top: '50%', left: 0, transform: `translate(-${imageSegment * 25}%, -50%)` } : text(c.imageMask).startsWith('/images/legacy83/') ? { maskImage: `url("${text(c.imageMask)}")`, maskSize: '100% 100%', maskRepeat: 'no-repeat' } : undefined} className={section.settings?.imageFit === 'contain' ? 'h-full min-h-80 w-full object-contain' : 'h-full min-h-80 w-full object-cover'} /></div>{text(c.imageCaption) ? <figcaption className="mt-6 text-center text-sm">{text(c.imageCaption)}</figcaption> : null}</figure> : null}
        </div>
      </section>
    );
  }

  if (section.type === 'rich_text') {
    return <section data-section-id={section.id} className="mx-auto max-w-4xl px-5 py-14 sm:px-6"><h2 className="text-3xl font-black">{text(c.title)}</h2><div className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-600">{text(c.text)}</div>{text(c.email) ? <p className="mt-4 font-bold"><a href={`mailto:${text(c.email)}`} style={{ color: primary }}>{text(c.email)}</a></p> : null}{text(c.phone) ? <p className="mt-2 font-bold"><a href={`tel:${text(c.phone)}`} style={{ color: primary }}>{text(c.phone)}</a></p> : null}</section>;
  }

  if (section.type === 'features' || section.type === 'services' || section.type === 'pricing' || section.type === 'team') {
    const items = list(c.items);
    return (
      <section className="tenant-cards mx-auto max-w-7xl px-5 py-14 sm:px-6" data-variant={variant} data-section-id={section.id}>
        <div className="tenant-section-intro">
        {text(c.eyebrow) ? <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: secondary }}>{text(c.eyebrow)}</p> : null}
        {text(c.title) ? <h2 className="mt-2 text-3xl font-black">{text(c.title)}</h2> : null}
        {text(c.text) ? <p className="mt-3 max-w-3xl leading-7 text-slate-600">{text(c.text)}</p> : null}
        {text(c.buttonText) ? <div className="mt-8"><ActionLink href={text(c.buttonHref) || '/contact'} primary={primary} basePath={basePath}>{text(c.buttonText)}</ActionLink></div> : null}
        </div>
        {!items.length && text(c.emptyText) ? <p className="mt-8 rounded-lg border border-black/10 bg-white p-6 leading-8 text-slate-600">{text(c.emptyText)}</p> : null}
        <div className="tenant-card-grid mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => <article key={`${text(item.title) || text(item.name)}-${index}`} className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">{text(item.image) ? typeof item.imageSegment === 'number' && item.imageSegment >= 0 && item.imageSegment <= 3 ? <div className="tenant-card-image-strip"><img src={text(item.image)} alt={text(item.imageAlt) || text(item.title)} style={{ transform: `translate(-${item.imageSegment * 25}%, -50%)` }} /></div> : <img src={text(item.image)} alt={text(item.imageAlt) || text(item.title) || text(item.name)} className="aspect-[16/10] w-full object-cover" /> : null}<div className="tenant-card-body p-6">{text(item.marker) || section.settings?.numbered === true ? <span className="tenant-card-marker" aria-hidden="true">{text(item.marker) || String(index + 1).padStart(2, '0')}</span> : null}<div className="tenant-card-copy"><h3 className="text-xl font-black">{text(item.title) || text(item.name)}</h3>{text(item.role) ? <p className="mt-1 text-sm font-bold" style={{ color: primary }}>{text(item.role)}</p> : null}{text(item.price) ? <p className="mt-2 text-2xl font-black" style={{ color: primary }}>{text(item.price)}</p> : null}<p className="mt-3 leading-7 text-slate-600">{text(item.description) || text(item.text)}</p>{text(item.href) ? <div className="mt-5"><ActionLink href={text(item.href)} primary={primary} basePath={basePath}>{text(item.buttonText) || 'Learn more'}</ActionLink></div> : null}</div></div></article>)}
        </div>
      </section>
    );
  }

  if (section.type === 'products') {
    const items = list(c.items);
    return <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6">{text(c.title) ? <h2 className="text-3xl font-black">{text(c.title)}</h2> : null}<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((item, index) => <article key={`${text(item.name)}-${index}`} className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">{text(item.image) ? <img src={text(item.image)} alt={text(item.imageAlt) || text(item.name)} className="aspect-square w-full object-contain" /> : null}<div className="p-5"><h3 className="text-lg font-black">{text(item.name)}</h3>{text(item.description) ? <p className="mt-2 text-sm leading-6 text-slate-600">{text(item.description)}</p> : null}{text(item.price) ? <p className="mt-3 text-lg font-black" style={{ color: primary }}>{text(item.price)}</p> : null}{text(item.href) ? <div className="mt-4"><ActionLink href={text(item.href)} primary={primary} basePath={basePath} eventName="product_click">{text(item.buttonText) || 'View product'}</ActionLink></div> : null}</div></article>)}</div></section>;
  }

  if (section.type === 'testimonial') {
    return <section className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-6"><blockquote className="text-2xl font-bold leading-10">“{text(c.quote)}”</blockquote>{text(c.author) ? <p className="mt-4 font-black" style={{ color: primary }}>{text(c.author)}</p> : null}</section>;
  }

  if (section.type === 'stats') {
    const items = list(c.items);
    const stats = items.length
      ? items.map((item, index) => ({ key: text(item.label) || `stat-${index}`, label: text(item.label), value: item.value }))
      : Object.entries(c).filter(([key]) => !['claimKey', 'title', 'text', 'items'].includes(key)).map(([key, value]) => ({ key, label: key.replace(/([A-Z])/g, ' $1'), value }));
    return <section className="mx-auto grid max-w-6xl gap-4 px-5 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">{stats.slice(0, 8).map((stat) => <div key={stat.key} className="rounded-2xl border border-black/10 bg-white p-6 text-center"><p className="text-3xl font-black" style={{ color: primary }}>{String(stat.value ?? '')}</p><p className="mt-2 text-sm font-bold capitalize text-slate-500">{stat.label}</p></div>)}</section>;
  }

  if (section.type === 'gallery') {
    const items = list(c.items);
    return <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6">{text(c.title) ? <h2 className="mb-8 text-3xl font-black">{text(c.title)}</h2> : null}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => text(item.image) ? <img key={`${text(item.image)}-${index}`} src={text(item.image)} alt={text(item.alt) || text(item.title) || `Gallery image ${index + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover" /> : null)}</div></section>;
  }

  if (section.type === 'image') {
    return <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">{text(c.image) ? <img src={text(c.image)} alt={text(c.alt) || text(c.title)} className="max-h-[680px] w-full rounded-3xl object-cover" /> : null}{text(c.caption) ? <p className="mt-3 text-center text-sm text-slate-500">{text(c.caption)}</p> : null}</section>;
  }

  if (section.type === 'video') {
    const url = text(c.url);
    return <section className="mx-auto max-w-5xl px-5 py-14 sm:px-6">{text(c.title) ? <h2 className="mb-6 text-3xl font-black">{text(c.title)}</h2> : null}{url ? <div className="aspect-video overflow-hidden rounded-3xl bg-black">{url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') ? <iframe src={url} className="h-full w-full" title={text(c.title) || 'Video'} allowFullScreen /> : <video src={url} controls className="h-full w-full" />}</div> : null}</section>;
  }

  if (section.type === 'faq') {
    const items = list(c.items);
    return <section className="mx-auto max-w-4xl px-5 py-14 sm:px-6">{text(c.title) ? <h2 className="mb-6 text-3xl font-black">{text(c.title)}</h2> : null}<div className="space-y-3">{items.map((item, index) => <details key={`${text(item.question)}-${index}`} className="rounded-2xl border border-black/10 bg-white p-5"><summary className="cursor-pointer font-black">{text(item.question)}</summary><p className="mt-3 leading-7 text-slate-600">{text(item.answer)}</p></details>)}</div></section>;
  }

  if (section.type === 'cta') {
    return <section className={`tenant-cta mx-auto max-w-6xl px-5 py-14 sm:px-6 ${text(c.image) ? 'relative isolate overflow-hidden' : ''}`} data-variant={variant} data-has-background={Boolean(text(c.image))}>{text(c.image) ? <img className="tenant-cta-background absolute inset-0 -z-10 h-full w-full object-cover" src={text(c.image)} alt={text(c.imageAlt)} /> : null}<div className="rounded-[2rem] px-8 py-14 text-center text-white shadow-xl" style={{ backgroundColor: text(c.image) ? 'rgba(0,0,0,0.65)' : primary }}>{text(c.eyebrow) ? <p className="tenant-cta-eyebrow text-xs font-bold uppercase tracking-[.3em]">{text(c.eyebrow)}</p> : null}<h2 className="mt-4 text-3xl font-black">{text(c.title)}</h2>{text(c.text) ? <p className="mx-auto mt-4 max-w-2xl text-white/85">{text(c.text)}</p> : null}{text(c.buttonText) ? <div className="mt-7"><ActionLink href={text(c.buttonHref) || '/contact'} primary={secondary} basePath={basePath}>{text(c.buttonText)}</ActionLink></div> : null}</div></section>;
  }

  if (section.type === 'booking') {
    const href = text(c.url) || text(c.bookingUrl);
    return <section className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-6"><h2 className="text-3xl font-black">{text(c.title) || 'Book an appointment'}</h2>{text(c.text) ? <p className="mt-4 text-slate-600">{text(c.text)}</p> : null}{href ? <div className="mt-7"><ActionLink href={href} primary={primary} basePath={basePath} eventName="booking_click">{text(c.buttonText) || 'Book now'}</ActionLink></div> : null}</section>;
  }

  if (section.type === 'assessment') return <TenantAssessment content={c} accent={primary} basePath={basePath} />;
  if (section.type === 'journal') return <TenantJournal content={c} accent={primary} basePath={basePath} />;
  if (section.type === 'events') return <TenantEvents content={c} accent={primary} basePath={basePath} />;

  if (section.type === 'contact_form') {
    const fields = customFields(c.fields);
    return (
      <section data-section-id={section.id} className="mx-auto max-w-4xl px-5 py-14 sm:px-6">
        {fields.length
          ? <TenantCustomLeadForm accent={primary} title={text(c.title) || 'Send a message'} fields={fields} />
          : <><h2 className="mb-6 text-3xl font-black">{text(c.title) || 'Contact us'}</h2><TenantLeadForm accent={primary} /></>}
      </section>
    );
  }

  return null;
}

export function PublicTenantComposableSite({ site, pathname = '/', basePath = '', onNavigate }: { site: PublishedTenantSite; pathname?: string; basePath?: string; onNavigate?: (pathname: string) => void }) {
  const config = ensureComposableSiteConfig(site.config);
  const path = normalizePageSlug(pathname);
  const page = config.pages?.find((candidate) => candidate.slug === path);
  if (!page) return <section role="status" className="p-8"><h1>Page not found</h1><p>This page is not available.</p><a href={hrefFor('/', basePath)}>Return to Home</a></section>;
  const primary = config.branding.primaryColor || '#7c3f58';
  const secondary = config.branding.secondaryColor || '#475569';
  const background = config.branding.backgroundColor || '#ffffff';
  const textColor = config.branding.textColor || '#0f172a';
  const navigation = (config.pages || []).filter((item) => item.showInNavigation !== false);
  const isLegacy83 = config.template.id === 'legacy83-premium';
  function navigateDraft(event: MouseEvent<HTMLDivElement>) {
    if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest('a');
    const href = anchor?.getAttribute('href');
    const target = (config.pages || []).find((item) => hrefFor(item.slug, basePath) === href);
    if (!target) return;
    event.preventDefault();
    onNavigate(target.slug);
  }

  return (
    <div data-page={page.slug} onClickCapture={onNavigate ? navigateDraft : undefined} className={`min-h-screen antialiased ${isLegacy83 ? "legacy83-premium" : ""}`} style={{ backgroundColor: background, color: textColor }}>
      {config.homepage.announcement ? <div className="px-4 py-2 text-center text-sm font-black text-white" style={{ backgroundColor: primary }}>{config.homepage.announcement}</div> : null}
      {/* Real document links remain usable when client routing cannot complete. */}
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-4 sm:px-6">
          <a href={hrefFor('/', basePath)} className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">{config.branding.logoImage ? <img src={config.branding.logoImage} alt={`${config.branding.logoText} logo`} className="h-12 w-auto max-w-44 object-contain" /> : null}<span className="truncate text-lg font-black" style={{ color: primary }}>{config.branding.logoText || site.siteName}</span></a>
          <nav aria-label="Main navigation" className="order-last flex w-full flex-wrap items-center gap-5 text-sm font-bold md:order-none md:w-auto">{navigation.filter((item) => item.slug !== '/contact').map((item) => <a key={item.id} href={hrefFor(item.slug, basePath)} className={item.slug === page.slug ? 'font-black' : 'text-slate-600 hover:text-slate-950'} style={item.slug === page.slug ? { color: primary } : undefined}>{item.navLabel || item.title}</a>)}</nav>
          {navigation.some((item) => item.slug === '/contact') ? <a href={hrefFor('/contact', basePath)} className="rounded-full px-5 py-2.5 text-sm font-black text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: primary }}>{text(config.meta?.headerCtaText) || 'Contact'}</a> : null}
        </div>
      </header>
      {isLegacy83 ? <div className="legacy83-mobile-menu"><details><summary>Menu <span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation">{navigation.map((item) => <a key={item.id} href={hrefFor(item.slug, basePath)}>{item.navLabel || item.title}</a>)}</nav></details></div> : null}
      <main>{page.sections.map((section, index) => <Section key={section.id} section={section} websiteId={site.id} businessName={site.siteName} isPageHeading={index === page.sections.findIndex((item) => item.type === 'hero' && item.visible !== false)} primary={primary} secondary={secondary} basePath={basePath} />)}</main>
      {site.parisEnabled ? <TenantParis key={site.id} business={site.siteName} accent={primary} basePath={basePath} /> : null}
      <footer className="border-t border-black/10 px-5 py-10 sm:px-6"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-5"><div><p className="font-black">{config.branding.logoText || site.siteName}</p><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{config.footer.description}</p></div>{config.footer.contactEmail ? <a href={`mailto:${config.footer.contactEmail}`} className="font-bold" style={{ color: primary }}>{config.footer.contactEmail}</a> : null}<nav aria-label="Footer navigation" className="flex w-full flex-wrap gap-5 text-sm font-bold">{navigation.map((item) => <a key={item.id} href={hrefFor(item.slug, basePath)}>{item.navLabel || item.title}</a>)}</nav></div></footer>
    </div>
  );
}
