/** Apply the October 16 visual reference without replacing the customer project. */
export function restoreLegacy83ApprovedReference(input) {
  const config = structuredClone(input);
  const slugs = ['/', '/about', '/services', '/resources', '/academy', '/growth-iq', '/journal', '/events', '/contact'];
  if (config.template?.id !== 'legacy83-premium' || slugs.some(slug => !config.pages?.some(page => page.slug === slug))) {
    throw new Error('Expected the existing nine-page Legacy 83 premium project');
  }
  const page = slug => config.pages.find(item => item.slug === slug);
  const sheet = '/images/legacy83/service-photography.webp';
  const portrait = '/images/legacy83/icy-williams-original.webp';
  const mask = '/images/legacy83/founder-mask.webp';
  config.branding.logoImage = '/images/legacy83/original-logo.webp';
  config.meta = { ...config.meta, headerCtaText: 'Book a Consultation →', approvedVisualReference: { libraryFileId: 'libfile_1af23697679881919bd23c406d92457c', date: '2026-10-16' } };
  config.homepage.announcement = 'Private design review · Legacy 83 Business';
  config.homepage.heroImage = portrait;
  const homeHero = page('/').sections.find(item => item.type === 'hero');
  homeHero.settings = { ...homeHero.settings, variant: 'reference' };
  homeHero.content = { ...homeHero.content,
    eyebrow: 'People | Strategy | Profits | Legacy',
    title: 'Build Today. Leave a Legacy Tomorrow.',
    titleLines: ['Build Today.', 'Leave a Legacy', 'Tomorrow.'], titleHighlight: 'Legacy',
    text: 'Strategic business solutions for entrepreneurs, leaders, and organizations ready to grow, scale, and create generational wealth.',
    image: portrait, imageMask: mask,
    imageAlt: 'Icy Williams, founder of Legacy 83 Business',
    imageCaption: 'Icy Williams · Founder, Legacy 83 Business',
    buttonText: 'Book a Consultation →', buttonHref: '/contact',
    secondaryButtonText: 'Explore Our Services', secondaryButtonHref: '/services',
    highlights: [
      { title: 'Strategy', text: 'Plan with Purpose' },
      { title: 'Growth', text: 'Scale with Systems' },
      { title: 'Legacy', text: 'Impact for Generations' },
    ],
  };
  const images = [0, 1, 3, 2];
  const imageAlts = ['Illustration of strategic thinking with chess pieces', 'Illustrative business leadership conversation', 'Notebook representing business systems and operations', 'Seedling representing continuity and long-term growth'];
  for (const slug of ['/', '/services']) {
    const services = page(slug).sections.find(item => item.type === 'services');
    if (services) {
      services.settings = { ...services.settings, variant: 'photographic', numbered: false };
      services.content.items = (services.content.items || []).map((item, index) => ({ ...item, image: sheet, imageSegment: images[index % 4], imageAlt: imageAlts[index % 4] }));
      if (slug === '/') services.content = { ...services.content, eyebrow: 'Our Services', title: 'Comprehensive Solutions for Sustainable Success', text: 'We partner with entrepreneurs, business owners, and leaders to build stronger businesses, develop high-performing teams, and create lasting legacies.' };
    }
  }
  const framework = page('/').sections.find(item => item.id === 'framework');
  if (framework) framework.settings = { ...framework.settings, variant: 'reference-framework' };
  const aboutHero = page('/about').sections.find(item => item.type === 'hero');
  aboutHero.settings = { ...aboutHero.settings, variant: 'reference' };
  aboutHero.content = { ...aboutHero.content, image: portrait, imageMask: mask, imageAlt: homeHero.content.imageAlt, imageCaption: homeHero.content.imageCaption };
  for (const [slug, segment, alt] of [
    ['/services', 0, imageAlts[0]], ['/resources', 2, imageAlts[3]],
    ['/academy', 3, 'Notebook representing business learning'], ['/growth-iq', 0, imageAlts[0]],
    ['/journal', 3, 'Notebook representing business insights'], ['/events', 1, 'Illustrative business conversation; no event is depicted'],
  ]) {
    const hero = page(slug).sections.find(item => item.type === 'hero');
    hero.settings = { ...hero.settings, variant: 'editorial' };
    hero.content = { ...hero.content, image: sheet, imageSegment: segment, imageAlt: alt, imageCaption: 'Legacy 83 Business · Strategy, Leadership & Legacy' };
  }
  const journal = page('/journal').sections.find(item => item.type === 'journal');
  if (journal) journal.content = { ...journal.content, previewLabel: 'Article preview', items: (journal.content.items || []).map((item, index) => ({ ...item, image: sheet, imageSegment: images[index % 4], imageAlt: imageAlts[index % 4] })) };
  return config;
}
