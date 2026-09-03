import type { TenantSiteConfig, TenantSitePage, TenantSiteSection } from '@/lib/tenant/site-types';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';

function page(config: TenantSiteConfig, slug: string): TenantSitePage | undefined {
  return config.pages?.find((item) => item.slug === slug);
}

function section(target: TenantSitePage | undefined, type: TenantSiteSection['type']): TenantSiteSection | undefined {
  return target?.sections.find((item) => item.type === type);
}

function upsertSection(target: TenantSitePage | undefined, next: TenantSiteSection) {
  if (!target) return;
  const index = target.sections.findIndex((item) => item.type === next.type);
  if (index >= 0) target.sections[index] = next;
  else target.sections.push(next);
}

export function bridgeLegacyPatchIntoComposition(config: TenantSiteConfig, patch: Partial<TenantSiteConfig>): TenantSiteConfig {
  const next = ensureComposableSiteConfig(config);
  const pages = structuredClone(next.pages || []);
  const working: TenantSiteConfig = { ...next, pages };

  if (patch.homepage) {
    const home = page(working, '/');
    const hero = section(home, 'hero');
    if (hero) {
      hero.content = {
        ...hero.content,
        ...(patch.homepage.heroTitle !== undefined ? { title: patch.homepage.heroTitle } : {}),
        ...(patch.homepage.heroSubtitle !== undefined ? { text: patch.homepage.heroSubtitle } : {}),
        ...(patch.homepage.heroCtaText !== undefined ? { buttonText: patch.homepage.heroCtaText } : {}),
        ...(patch.homepage.heroCtaHref !== undefined ? { buttonHref: patch.homepage.heroCtaHref } : {}),
        ...(patch.homepage.heroImage !== undefined ? { image: patch.homepage.heroImage } : {}),
        ...(patch.homepage.heroImageAlt !== undefined ? { imageAlt: patch.homepage.heroImageAlt } : {}),
      };
    }
    if (patch.homepage.features) {
      const features = section(home, 'features');
      if (features) features.content = { ...features.content, items: patch.homepage.features };
      else if (home) upsertSection(home, { id: 'home_features', type: 'features', visible: true, content: { items: patch.homepage.features }, settings: {} });
    }
  }

  if (patch.programs) {
    const programsPage = page(working, '/programs') || page(working, '/services');
    const services = section(programsPage, 'services');
    if (services) services.content = { ...services.content, items: patch.programs };
  }

  if (patch.products) {
    const shop = page(working, '/shop') || page(working, '/products');
    const products = section(shop, 'products');
    if (products) products.content = { ...products.content, items: patch.products };
  }

  if (patch.contact) {
    const contactPage = page(working, '/contact');
    const details = section(contactPage, 'rich_text');
    if (details) {
      details.content = {
        ...details.content,
        ...(patch.contact.address !== undefined ? { text: patch.contact.address } : {}),
        ...(patch.contact.email !== undefined ? { email: patch.contact.email } : {}),
        ...(patch.contact.phone !== undefined ? { phone: patch.contact.phone } : {}),
        ...(patch.contact.hours !== undefined ? { hours: patch.contact.hours } : {}),
      };
    }
    if (patch.contact.bookingUrl) {
      const booking = section(contactPage, 'booking');
      const nextBooking: TenantSiteSection = booking || { id: 'contact_booking', type: 'booking', visible: true, content: {}, settings: {} };
      nextBooking.content = { ...nextBooking.content, title: nextBooking.content.title || 'Book an appointment', bookingUrl: patch.contact.bookingUrl };
      if (!booking) upsertSection(contactPage, nextBooking);
    }
  }

  if (patch.testimonial) {
    const about = page(working, '/about') || page(working, '/');
    const testimonial = section(about, 'testimonial');
    const nextTestimonial: TenantSiteSection = testimonial || { id: 'site_testimonial', type: 'testimonial', visible: true, content: {}, settings: {} };
    nextTestimonial.content = { quote: patch.testimonial.quote, author: patch.testimonial.author };
    if (!testimonial) upsertSection(about, nextTestimonial);
  }

  return ensureComposableSiteConfig(working);
}
