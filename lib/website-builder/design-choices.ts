import type { TenantSiteConfig } from '@/lib/tenant/site-types';

export const WEBSITE_TEMPLATES = [
  { id: 'retail', name: 'Retail Marketplace', description: 'Bright merchandising, compact products and clear shopping actions.', colors: ['#184b78', '#e5ad25', '#ffffff'] },
  { id: 'botanical', name: 'Botanical Boutique', description: 'Warm spa photography, editorial stories and refined product displays.', colors: ['#24392c', '#a8752e', '#fffdf8'] },
  { id: 'executive', name: 'Executive Luxury', description: 'An editorial business presence with green and gold accents.', colors: ['#123729', '#9d783a', '#fffdf7'] },
  { id: 'modern', name: 'Modern Corporate', description: 'Crisp service grids, strong navigation and professional typography.', colors: ['#173e5a', '#375f78', '#ffffff'] },
  { id: 'creative', name: 'Bold Creative', description: 'Expressive headings, generous photography and a distinctive accent.', colors: ['#442080', '#a44869', '#fffaff'] },
  { id: 'minimal', name: 'Elegant Minimalist', description: 'Quiet typography, clean lines and a continuous light canvas.', colors: ['#242424', '#796544', '#faf9f6'] },
] as const;
export const WEBSITE_LAYOUTS = [
  { id: 'split', name: 'Split hero', description: 'A headline and photograph side by side.' },
  { id: 'cover', name: 'Full-width banner', description: 'A wide photographic banner above the content.' },
  { id: 'editorial', name: 'Editorial', description: 'Centered typography with a wide image beneath.' },
] as const;
export const WEBSITE_SPEAKERS = [
  { id: 'warm', name: 'Warm', description: 'Welcoming, conversational narration.', providerVoice: 'en-US-Neural2-F' },
  { id: 'clear', name: 'Clear', description: 'A clear, direct presentation.', providerVoice: 'en-US-Neural2-J' },
  { id: 'deep', name: 'Deep', description: 'A lower-register narrator.', providerVoice: 'en-US-Neural2-D' },
] as const;
export type WebsiteDesignChoices = {
  template: typeof WEBSITE_TEMPLATES[number]['id'];
  layout: typeof WEBSITE_LAYOUTS[number]['id'];
  density: 'comfortable' | 'compact';
  speaker: typeof WEBSITE_SPEAKERS[number]['id'];
  narration: boolean;
  imageStyle: 'customer' | 'editorial' | 'product';
};
export const DEFAULT_WEBSITE_DESIGN: WebsiteDesignChoices = { template: 'executive', layout: 'split', density: 'comfortable', speaker: 'warm', narration: true, imageStyle: 'customer' };
const obj = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
export function readWebsiteDesign(value: unknown): WebsiteDesignChoices {
  const v = obj(value);
  return {
    template: WEBSITE_TEMPLATES.some(t => t.id === v.template) ? v.template as WebsiteDesignChoices['template'] : DEFAULT_WEBSITE_DESIGN.template,
    layout: WEBSITE_LAYOUTS.some(t => t.id === v.layout) ? v.layout as WebsiteDesignChoices['layout'] : 'split',
    density: v.density === 'compact' ? 'compact' : 'comfortable',
    speaker: WEBSITE_SPEAKERS.some(t => t.id === v.speaker) ? v.speaker as WebsiteDesignChoices['speaker'] : 'warm',
    narration: v.narration !== false && v.narration !== 'false',
    imageStyle: v.imageStyle === 'editorial' || v.imageStyle === 'product' ? v.imageStyle : 'customer',
  };
}
export function interviewWebsiteDesign(answers: Record<string, string>) {
  return readWebsiteDesign({ template: answers.templateId, layout: answers.heroLayout, density: answers.productDensity, speaker: answers.speaker, narration: answers.narration, imageStyle: answers.imageStyle });
}
export function applyWebsiteDesign(config: TenantSiteConfig, raw: unknown, options: { applyPalette?: boolean } = {}): TenantSiteConfig {
  const choices = readWebsiteDesign(raw);
  const template = WEBSITE_TEMPLATES.find(t => t.id === choices.template)!;
  const [primary, accent, background] = template.colors;
  const result = structuredClone(config);
  result.meta = { ...result.meta, designPreferences: choices, designDirection: choices.template };
  result.template = { ...result.template, name: template.name, style: { ...result.template.style, heroStyle: choices.layout, productDensity: choices.density, headingStyle: ['botanical', 'executive', 'minimal'].includes(choices.template) ? 'serif' : 'sans' } };
  if (options.applyPalette) result.branding = { ...result.branding, primaryColor: primary, secondaryColor: accent, accentColor: accent, backgroundColor: background, textColor: '#17251c' };
  for (const page of result.pages || []) for (const section of page.sections) {
    if (section.type === 'hero') {
      section.settings = { ...section.settings, layout: choices.layout };
      if (choices.narration && !section.content.narration) section.content.narration = [section.content.title, section.content.text].filter(v => typeof v === 'string').join('. ').slice(0, 1800);
      if (choices.narration) section.content.narrator = choices.speaker;
      else delete section.content.narration;
    }
    if (section.type === 'products') section.settings = { ...section.settings, density: choices.density };
  }
  return result;
}
/** Only explicitly configured product prices are shoppable; unknown prices stay quote-only. */
export function websiteCatalog(config: TenantSiteConfig) {
  const result = new Map<string, NonNullable<TenantSiteConfig['products']>[number]>();
  for (const p of config.products || []) if (p.href) result.set(p.href, p);
  for (const page of config.pages || []) for (const section of page.sections) {
    if (section.type !== 'products' || !Array.isArray(section.content.items)) continue;
    for (const value of section.content.items) {
      const p = obj(value);
      if (typeof p.name !== 'string' || typeof p.href !== 'string' || result.has(p.href) || [...result.values()].some(existing => existing.name.toLowerCase() === (p.name as string).toLowerCase())) continue;
      result.set(p.href, { name: p.name, href: p.href, price: typeof p.price === 'string' ? p.price : undefined, description: typeof p.description === 'string' ? p.description : undefined, image: typeof p.image === 'string' ? p.image : undefined });
    }
  }
  return [...result.values()];
}
