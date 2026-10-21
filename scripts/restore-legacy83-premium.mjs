import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const designSource = '26d5559c2cfb5d52232fcb770679f7d99a1ba9b9';
const paths = ['/', '/about', '/services', '/academy', '/resources', '/growth-iq', '/journal', '/events', '/contact'];

/** Reconcile the approved repository homepage into the existing editable site. */
export function restoreLegacy83Premium(input) {
  const config = structuredClone(input);
  if (config.template?.id !== 'legacy83-premium' || paths.some(path => !config.pages?.some(page => page.slug === path))) {
    throw new Error('Expected the existing Legacy 83 premium nine-page project. No replacement project is generated.');
  }
  const home = config.pages.find(page => page.slug === '/');
  const about = config.pages.find(page => page.slug === '/about');
  const original = new Map(home.sections.map(section => [section.id, section]));
  const hero = original.get('hero');
  if (!hero?.content.image) throw new Error('The authentic saved founder photograph is required.');
  const section = (id, type, content, settings = {}) => ({ ...original.get(id), id, type, visible: true, content, settings });
  const services = [
    ['Strategic Planning', 'Connect your vision to actionable priorities and measurable business goals.'],
    ['Leadership Coaching', 'Develop confident leaders, accountable teams, and a culture of execution.'],
    ['Operational Excellence', 'Strengthen the processes and systems that support sustainable growth.'],
    ['Legacy Transition', 'Prepare your business for continuity, succession, and long-term value.'],
  ];
  const foundations = [
    ['G', 'Goals', 'Clear priorities and measurable direction'],
    ['R', 'Revenue', 'Sustainable growth and stronger decisions'],
    ['O', 'Operations', 'Systems that support consistency'],
    ['W', 'Workforce', 'Leadership and team readiness'],
    ['S', 'Succession', 'Continuity beyond the founder'],
  ];
  const founder = original.get('founder');
  if (founder && !about.sections.some(item => item.id === 'home-founder-story')) {
    about.sections.push({ ...founder, id: 'home-founder-story', type: 'rich_text', content: { title: founder.content.title, text: founder.content.text }, settings: {} });
  }
  home.sections = [
    section('hero', 'hero', {
      ...hero.content,
      eyebrow: 'Business strategy · Leadership · Legacy',
      title: 'Build Today. Leave a Legacy Tomorrow.', titleHighlight: 'Leave a Legacy',
      text: 'Strategic guidance for business owners ready to grow with purpose, lead with confidence, and create something that lasts.',
      imageCaption: 'Icy Williams · Founder, Legacy 83 Business',
      buttonText: 'Schedule a Conversation →', buttonHref: '/contact',
      secondaryButtonText: 'Explore Our Services', secondaryButtonHref: '/services',
    }),
    section('services', 'services', {
      eyebrow: 'What we do', title: 'Business Solutions Built Around Your Future',
      text: 'Your business is unique. Your path to sustainable success should be too.',
      items: services.map(([title, description]) => ({ title, description, href: '/services', buttonText: 'Learn more →' })),
    }, { variant: 'pathways', numbered: true }),
    section('framework', 'features', {
      eyebrow: 'The Legacy 83 approach', title: 'Five Foundations for a Business That Lasts.',
      text: 'The G.R.O.W.S. framework helps business owners focus on the essentials of resilient growth and long-term continuity.',
      buttonText: 'Explore Growth IQ →', buttonHref: '/growth-iq',
      items: foundations.map(([marker, title, description]) => ({ marker, title, description })),
    }, { variant: 'framework' }),
    ...['process', 'assessment', 'faq'].flatMap(id => original.has(id) ? [original.get(id)] : []),
    section('academy', 'cta', {
      eyebrow: 'Learning and development', title: 'Build Your Legacy Through Learning.',
      text: 'Explore leadership, strategy, operational excellence, and succession readiness through the Legacy 83 Academy.',
      buttonText: 'Explore the Academy →', buttonHref: '/academy',
    }, { variant: 'academy' }),
    section('final-cta', 'cta', {
      eyebrow: 'Your next chapter', title: "Let's Build Your Legacy Together.",
      text: 'Start with a conversation about your vision and what your business needs next.',
      buttonText: 'Start a Conversation →', buttonHref: '/contact',
    }, { variant: 'final' }),
  ];
  // Preserve any additional customer sections instead of discarding newer work.
  const retained = new Set([...home.sections.map(item => item.id), 'founder']);
  for (const item of original.values()) if (!retained.has(item.id)) home.sections.splice(-1, 0, item);
  const process = home.sections.find(item => item.id === 'process');
  if (process) process.settings = { ...process.settings, variant: 'pathways' };
  config.branding = { ...config.branding, primaryColor: '#123327', accentColor: '#d7b46a', secondaryColor: '#9a743d', backgroundColor: '#faf7f0', textColor: '#19372b' };
  config.homepage = { ...config.homepage, heroTitle: home.sections[0].content.title, heroSubtitle: home.sections[0].content.text, heroCtaText: 'Schedule a Conversation →', heroCtaHref: '/contact', heroImage: hero.content.image };
  config.meta = { ...config.meta, premiumDesignSource: designSource };
  for (const page of config.pages) {
    if (page.slug === '/') continue;
    for (const item of page.sections) {
      if (item.type === 'features' || item.type === 'services') item.settings = { ...item.settings, numbered: true };
      if (item.id === 'about-pillars') item.settings = { ...item.settings, variant: 'pathways' };
    }
    const lastCta = page.sections.findLast(item => item.type === 'cta');
    if (lastCta) lastCta.settings = { ...lastCta.settings, variant: 'final' };
    const pageHero = page.sections.find(item => item.type === 'hero');
    const approvedHeroes = {
      '/about': ['Meet the founder', 'Build something that outlasts you.', 'Legacy 83 Business works alongside entrepreneurs and business leaders to connect purpose with practical strategy, stronger teams, operational discipline, and long-term continuity.'],
      '/services': ['Strategy · Leadership · Legacy', 'Your business. Your vision. A stronger future.', 'Four interconnected pathways support entrepreneurs as they clarify priorities, build accountable teams, improve operations, and plan for what comes next.'],
      '/academy': ['Learn · Lead · Leave a legacy', 'Legacy 83 Academy', 'Practical learning for business owners and leaders focused on strategy, operational excellence, and long-term continuity.'],
      '/contact': ['Legacy 83 Business', "Let's Build Your Legacy Together.", "Tell us about your business and the future you're working toward."],
    };
    if (pageHero && approvedHeroes[page.slug]) {
      const [eyebrow, title, text] = approvedHeroes[page.slug];
      pageHero.content = { ...pageHero.content, eyebrow, title, text };
    }
    if (page.slug === '/services') {
      const pathways = page.sections.find(item => item.id === 'services-grid');
      if (pathways) { pathways.settings = { ...pathways.settings, variant: 'pathways', numbered: true }; pathways.content.items = services.map(([title, description]) => ({ title, description, href: '/contact', buttonText: 'Discuss this pathway →' })); pathways.content.title = 'Four Advisory Pathways'; }
      const duplicate = page.sections.find(item => item.id === 'service-detail');
      if (duplicate) duplicate.visible = false;
    }
    if (page.slug === '/academy') {
      const duplicate = page.sections.find(item => item.id === 'academy-grid');
      if (duplicate) duplicate.visible = false;
      const programs = page.sections.find(item => item.id === 'academy-programs');
      if (programs) programs.content.title = 'Build the Skills Behind a Lasting Business.';
    }
    if (page.slug === '/academy' && !page.sections.some(item => item.id === 'academy-published-courses')) {
      page.sections.splice(-1, 0, { id: 'academy-published-courses', type: 'services', visible: true, content: { title: 'Available Courses', items: [], emptyText: 'Contact Legacy 83 for current learning opportunities and enrollment availability.' }, settings: { source: 'published-courses', numbered: true } });
    }
    if (page.slug === '/events') {
      for (const item of page.sections) {
        if (item.id === 'events-note') item.visible = false;
        if (item.type === 'events') { item.settings = { ...item.settings, source: 'published-events' }; item.content.emptyText = 'No events are currently scheduled. Contact Legacy 83 for updates.'; }
      }
    }
  }
  // The existing pages, forms, assessment answers, backend config and billing state remain authoritative.
  return config;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , source, destination] = process.argv;
  if (!source || !destination) throw new Error('Usage: node scripts/restore-legacy83-premium.mjs existing.json restored.json');
  const restored = restoreLegacy83Premium(JSON.parse(await fs.readFile(source, 'utf8')));
  await fs.writeFile(destination, JSON.stringify(restored, null, 2));
  console.log(JSON.stringify({ pages: restored.pages.length, designSource, destination }));
}
