'use client';

import Link from 'next/link';
import type { PublishedTenantSite, TenantSiteProduct } from '@/lib/tenant/site-types';

type PageKey = 'home' | 'catalog' | 'about' | 'contact';

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function resolveInternalHref(href: string, basePath: string) {
  if (!basePath || isExternalHref(href) || !href.startsWith('/')) return href;
  if (href === '/') return basePath;
  return `${basePath}${href}`;
}

function resolvePage(pathname: string): PageKey {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/programs' || p === '/shop' || p === '/products') return 'catalog';
  if (p === '/about') return 'about';
  if (p === '/contact') return 'contact';
  return 'home';
}

function money(value?: string) {
  if (!value) return '';
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parsed);
}

function canonicalImageKey(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname)
      .replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|original|master|\d+x\d*|x\d+)(?=\.[a-z0-9]+$)/i, '')
      .toLowerCase();
    return `${url.hostname.toLowerCase()}${pathname}`;
  } catch {
    return value.split('?')[0].split('#')[0].trim().toLowerCase() || undefined;
  }
}

function uniqueProductImages(products: TenantSiteProduct[], reservedImages: Array<string | undefined>) {
  const used = new Set<string>();
  for (const image of reservedImages) {
    const key = canonicalImageKey(image);
    if (key) used.add(key);
  }

  return products.map((product) => {
    const key = canonicalImageKey(product.image);
    if (!key || !used.has(key)) {
      if (key) used.add(key);
      return product;
    }
    return { ...product, image: undefined };
  });
}

function ProductCard({ product, accent, textColor, basePath }: { product: TenantSiteProduct; accent: string; textColor: string; basePath: string }) {
  const content = (
    <article className="group h-full overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-square overflow-hidden bg-slate-100">
        {product.image ? (
          // Remote source images are intentionally preserved during migration.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.imageAlt || product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold text-slate-500">
            {product.name}
          </div>
        )}
      </div>
      <div className="p-5">
        {product.badge ? (
          <span className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: `${accent}18`, color: accent }}>
            {product.badge}
          </span>
        ) : null}
        <h3 className="text-lg font-black leading-snug" style={{ color: textColor }}>{product.name}</h3>
        {product.description ? <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{product.description}</p> : null}
        <div className="mt-4 flex items-baseline gap-2">
          {product.price ? <span className="text-lg font-black" style={{ color: accent }}>{money(product.price)}</span> : null}
          {product.compareAtPrice && product.compareAtPrice !== product.price ? (
            <span className="text-sm font-semibold text-slate-400 line-through">{money(product.compareAtPrice)}</span>
          ) : null}
        </div>
        {product.href ? <p className="mt-4 text-sm font-black" style={{ color: accent }}>View product →</p> : null}
      </div>
    </article>
  );

  if (!product.href) return content;
  if (isExternalHref(product.href)) {
    return <a href={product.href} target="_blank" rel="noreferrer" className="block h-full">{content}</a>;
  }
  return <Link href={resolveInternalHref(product.href, basePath)} className="block h-full">{content}</Link>;
}

export function PublicTenantSite({
  site,
  pathname = '/',
  basePath = '',
}: {
  site: PublishedTenantSite;
  pathname?: string;
  basePath?: string;
}) {
  const { config } = site;
  const page = resolvePage(pathname);
  const normalizedBasePath = basePath.replace(/\/$/, '');
  const primary = config.branding.primaryColor || '#7c3f58';
  const secondary = config.branding.secondaryColor || '#475569';
  const accent = config.branding.accentColor || primary;
  const background = config.branding.backgroundColor || config.template.colors?.background || '#ffffff';
  const textColor = config.branding.textColor || config.template.colors?.text || '#0f172a';
  const headingFont = config.template.fonts?.heading || 'inherit';
  const bodyFont = config.template.fonts?.body || 'inherit';
  const isStore = config.meta?.siteKind === 'store' || Boolean(config.products?.length);
  const products = uniqueProductImages(config.products || [], [config.branding.logoImage, config.homepage.heroImage]);
  const catalogHref = isStore ? '/shop' : '/programs';
  const ctaHref = config.homepage.heroCtaHref || catalogHref;
  const storeName = config.branding.logoText || site.siteName || 'Store';

  return (
    <div className="min-h-screen" style={{ backgroundColor: background, color: textColor, fontFamily: bodyFont }}>
      {config.homepage.announcement ? (
        <div className="px-4 py-2 text-center text-sm font-black text-white" style={{ backgroundColor: primary }}>
          {config.homepage.announcement}
        </div>
      ) : null}

      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6">
          <Link href={resolveInternalHref('/', normalizedBasePath)} className="flex min-w-0 items-center gap-3">
            {config.branding.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.branding.logoImage} alt={`${config.branding.logoText} logo`} className="h-10 w-auto max-w-36 object-contain" />
            ) : null}
            <span className="truncate text-lg font-black" style={{ color: primary, fontFamily: headingFont }}>
              {config.branding.logoText}
            </span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-bold md:flex">
            {config.navigation.slice(0, 7).map((item) => {
              const active = !isExternalHref(item.href) && resolvePage(item.href) === page;
              const className = active ? 'font-black' : 'text-slate-600 hover:text-slate-950';
              if (isExternalHref(item.href)) {
                return <a key={`${item.label}-${item.href}`} href={item.href} target="_blank" rel="noreferrer" className={className}>{item.label}</a>;
              }
              return <Link key={`${item.label}-${item.href}`} href={resolveInternalHref(item.href, normalizedBasePath)} className={className} style={active ? { color: primary } : undefined}>{item.label}</Link>;
            })}
          </nav>
          <Link href={resolveInternalHref(catalogHref, normalizedBasePath)} className="shrink-0 rounded-full px-4 py-2 text-sm font-black text-white" style={{ backgroundColor: primary }}>
            {isStore ? 'Shop now' : 'Explore'}
          </Link>
        </div>
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="overflow-hidden border-b border-black/5">
              <div className={`mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 md:py-20 ${config.homepage.heroImage ? 'lg:grid-cols-[0.95fr_1.05fr]' : ''}`}>
                <div className={config.homepage.heroImage ? '' : 'mx-auto max-w-4xl text-center'}>
                  {config.branding.tagline ? (
                    <p className="mb-4 text-sm font-black uppercase tracking-[0.18em]" style={{ color: secondary }}>{config.branding.tagline}</p>
                  ) : null}
                  <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: headingFont }}>
                    {config.homepage.heroTitle}
                  </h1>
                  <p className={`mt-5 text-lg font-medium leading-8 text-slate-600 ${config.homepage.heroImage ? 'max-w-2xl' : 'mx-auto max-w-3xl'}`}>
                    {config.homepage.heroSubtitle}
                  </p>
                  <div className={`mt-8 flex flex-wrap gap-3 ${config.homepage.heroImage ? '' : 'justify-center'}`}>
                    {isExternalHref(ctaHref) ? (
                      <a href={ctaHref} target="_blank" rel="noreferrer" className="rounded-full px-7 py-3.5 font-black text-white shadow-lg" style={{ backgroundColor: primary }}>
                        {config.homepage.heroCtaText}
                      </a>
                    ) : (
                      <Link href={resolveInternalHref(ctaHref, normalizedBasePath)} className="rounded-full px-7 py-3.5 font-black text-white shadow-lg" style={{ backgroundColor: primary }}>
                        {config.homepage.heroCtaText}
                      </Link>
                    )}
                    {config.contact?.bookingUrl ? (
                      <a href={config.contact.bookingUrl} target="_blank" rel="noreferrer" className="rounded-full border-2 bg-white px-7 py-3.5 font-black" style={{ borderColor: primary, color: primary }}>
                        Book a consultation
                      </a>
                    ) : null}
                  </div>
                </div>

                {config.homepage.heroImage ? (
                  <div className="relative min-h-[360px] max-h-[520px] overflow-hidden rounded-[2rem] bg-slate-100 shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.homepage.heroImage}
                      alt={config.homepage.heroImageAlt || config.homepage.heroTitle}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-6 pt-24 text-white">
                      <p className="text-sm font-black uppercase tracking-[0.16em]">{isStore ? `Shop ${storeName}` : config.branding.logoText}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {config.homepage.features.length ? (
              <section className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
                {config.homepage.features.slice(0, 8).map((feature) => (
                  <article key={feature.title} className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
                    {feature.image ? (
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={feature.image} alt={feature.title} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : null}
                    <div className="p-6">
                      <h2 className="text-lg font-black" style={{ fontFamily: headingFont }}>{feature.title}</h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{feature.description}</p>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            {isStore && products.length ? (
              <section className="border-y border-black/5 bg-white/60 py-14">
                <div className="mx-auto max-w-7xl px-5 sm:px-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: accent }}>Featured products</p>
                      <h2 className="mt-2 text-3xl font-black" style={{ fontFamily: headingFont }}>Shop {storeName}</h2>
                    </div>
                    <Link href={resolveInternalHref('/shop', normalizedBasePath)} className="font-black" style={{ color: primary }}>View all products →</Link>
                  </div>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.slice(0, 8).map((product) => <ProductCard key={`${product.name}-${product.href || ''}`} product={product} accent={accent} textColor={textColor} basePath={normalizedBasePath} />)}
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}

        {page === 'catalog' && (
          <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: accent }}>{isStore ? `${storeName} shop` : 'Programs'}</p>
              <h1 className="mt-2 text-4xl font-black" style={{ fontFamily: headingFont }}>{isStore ? 'Shop products' : 'Training programs'}</h1>
              <p className="mt-3 text-base font-medium leading-7 text-slate-600">
                {isStore ? 'Browse available products, review the details, and continue to the original product page when you are ready to purchase.' : 'Explore available programs and services.'}
              </p>
            </div>
            {isStore ? (
              <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => <ProductCard key={`${product.name}-${product.href || ''}`} product={product} accent={accent} textColor={textColor} basePath={normalizedBasePath} />)}
              </div>
            ) : (
              <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {config.programs.map((prog) => (
                  <article key={prog.name} className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
                    {prog.image ? (
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={prog.image} alt={prog.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ) : null}
                    <div className="p-6">
                      <h2 className="text-xl font-black" style={{ fontFamily: headingFont }}>{prog.name}</h2>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{prog.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {page === 'about' && (
          <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6">
            <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: accent }}>About</p>
            <h1 className="mt-2 text-4xl font-black" style={{ fontFamily: headingFont }}>About {config.branding.logoText}</h1>
            <p className="mt-6 text-lg font-medium leading-8 text-slate-600">{config.footer.description}</p>
          </section>
        )}

        {page === 'contact' && (
          <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6">
            <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: accent }}>Contact</p>
            <h1 className="mt-2 text-4xl font-black" style={{ fontFamily: headingFont }}>Connect with {config.branding.logoText}</h1>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {(config.contact?.email || config.footer.contactEmail) ? (
                <a href={`mailto:${config.contact?.email || config.footer.contactEmail}`} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Email</p>
                  <p className="mt-2 font-black" style={{ color: primary }}>{config.contact?.email || config.footer.contactEmail}</p>
                </a>
              ) : null}
              {config.contact?.phone ? (
                <a href={`tel:${config.contact.phone}`} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Phone</p>
                  <p className="mt-2 font-black" style={{ color: primary }}>{config.contact.phone}</p>
                </a>
              ) : null}
              {config.contact?.bookingUrl ? (
                <a href={config.contact.bookingUrl} target="_blank" rel="noreferrer" className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:col-span-2">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Appointments</p>
                  <p className="mt-2 text-lg font-black" style={{ color: primary }}>Book consultation services →</p>
                </a>
              ) : null}
              {config.contact?.hours?.length ? (
                <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:col-span-2">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Hours</p>
                  <div className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
                    {config.contact.hours.map((line) => <p key={line}>{line}</p>)}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-12 border-t border-black/10 bg-white/80 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black" style={{ color: primary, fontFamily: headingFont }}>{config.branding.logoText}</p>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600">{config.footer.description}</p>
          </div>
          <Link href={resolveInternalHref(catalogHref, normalizedBasePath)} className="font-black" style={{ color: primary }}>{isStore ? 'Shop products →' : 'Explore programs →'}</Link>
        </div>
      </footer>
    </div>
  );
}
