export type WebsiteInterviewAnswers = Record<string, string>;

export type WebsiteInterviewQuestion = {
  key: string;
  label: string;
  question: string;
  placeholder: string;
  required?: boolean;
  when?: (answers: WebsiteInterviewAnswers) => boolean;
};

const mentions = (answers: WebsiteInterviewAnswers, pattern: RegExp) =>
  pattern.test(Object.values(answers).join(' '));

export const WEBSITE_INTERVIEW_QUESTIONS: WebsiteInterviewQuestion[] = [
  { key: 'businessName', label: 'Identity', question: "What's the legal or public-facing name of the business?", placeholder: 'Business or organization name', required: true },
  { key: 'industry', label: 'Industry', question: 'What industry are you in, and what makes this business different?', placeholder: 'Industry, specialty, and differentiator', required: true },
  { key: 'audience', label: 'Audience', question: 'Who are the primary customers or visitors this website must serve?', placeholder: 'Customer groups, needs, and geography', required: true },
  { key: 'goal', label: 'Goals', question: 'What business result should the website produce first?', placeholder: 'Sales, bookings, applications, leads, calls…', required: true },
  { key: 'services', label: 'Services', question: 'Which services, programs, or packages must the website explain or sell?', placeholder: 'List each service and the essential details', required: true },
  { key: 'products', label: 'Products', question: 'Will the website sell physical or digital products? If so, describe them.', placeholder: 'Products, variants, or “No products”' },
  { key: 'pricing', label: 'Pricing', question: 'Which verified prices, deposits, plans, or quote rules may be displayed?', placeholder: 'Exact prices and source, quote-only, or owner input required' },
  { key: 'inventory', label: 'Inventory', question: 'Do products require inventory, variants, shipping, delivery, or pickup rules?', placeholder: 'Stock, variants, fulfillment, or not applicable', when: (a) => mentions(a, /product|retail|shop|store|sell|shipping|pickup/i) },
  { key: 'payments', label: 'Payments', question: 'How should customers pay, and which payment account should receive the money?', placeholder: 'One-time checkout, invoice, deposit, in person…' },
  { key: 'subscriptions', label: 'Subscriptions', question: 'Do you offer memberships, subscriptions, retainers, or recurring billing?', placeholder: 'Billing interval and offer, or no recurring billing' },
  { key: 'booking', label: 'Booking', question: 'Should customers book appointments, consultations, classes, or events online?', placeholder: 'Booking types, duration, capacity, or no booking' },
  { key: 'scheduling', label: 'Scheduling', question: 'What availability, buffers, cancellation rules, and calendar connections apply?', placeholder: 'Hours and scheduling rules', when: (a) => mentions(a, /book|appointment|class|event|consult/i) },
  { key: 'locations', label: 'Locations', question: 'Where does the business operate, and which locations may be published?', placeholder: 'Verified service areas or addresses' },
  { key: 'staff', label: 'Staff', question: 'Which verified staff members, roles, or providers should appear?', placeholder: 'Names and roles, or owner input required' },
  { key: 'pages', label: 'Pages', question: 'Which pages and customer journeys are required?', placeholder: 'Home, services, shop, booking, about, contact…' },
  { key: 'brand', label: 'Brand', question: 'How should the site look and feel, including colors and typography?', placeholder: 'Brand personality, colors, and visual references' },
  { key: 'assets', label: 'Assets', question: 'Do you have an existing logo, photos, videos, or brand files to use?', placeholder: 'Asset locations and usage instructions' },
  { key: 'policies', label: 'Policies', question: 'Which customer policies must be visible?', placeholder: 'Returns, cancellation, shipping, privacy, terms…' },
  { key: 'compliance', label: 'Compliance', question: 'Are there industry licenses, disclosures, accessibility, privacy, or regulatory requirements?', placeholder: 'Requirements and supporting evidence' },
  { key: 'contacts', label: 'Contact', question: 'Which verified contact channels may be published?', placeholder: 'Email, phone, messaging, social profiles' },
  { key: 'domain', label: 'Domain', question: 'Do you own a domain or need help choosing one?', placeholder: 'Domain name, registrar, or domain needed' },
  { key: 'existingWebsite', label: 'Existing site', question: 'Is there an existing public website to import or replace?', placeholder: 'Public URL or no existing website' },
  { key: 'importScope', label: 'Import', question: 'What should be preserved from the existing site?', placeholder: 'Pages, assets, SEO, products, redirects…', when: (a) => /^https?:\/\//i.test(a.existingWebsite || '') },
  { key: 'analytics', label: 'Analytics', question: 'Which analytics, advertising pixels, CRM, or consent tools are required?', placeholder: 'Tools and account ownership' },
  { key: 'seo', label: 'SEO', question: 'Which locations, services, topics, and search goals should SEO prioritize?', placeholder: 'Search goals and known keywords' },
  { key: 'accessibility', label: 'Accessibility', question: 'Are there audience-specific accessibility or language needs beyond WCAG-ready defaults?', placeholder: 'Languages, accommodations, reduced motion…' },
  { key: 'conversion', label: 'Conversion', question: 'What is the primary call to action, and what happens after someone completes it?', placeholder: 'CTA and follow-up workflow', required: true },
  { key: 'upsell', label: 'Recommendations', question: 'Which related offers may PARIS recommend or cross-sell transparently?', placeholder: 'Related offers, boundaries, or no recommendations' },
  { key: 'declinedCapabilities', label: 'Decisions', question: 'Which recommended capabilities do you explicitly want to decline?', placeholder: 'Anything the website should not include' },
];

export function getWebsiteInterviewQuestions(answers: WebsiteInterviewAnswers) {
  return WEBSITE_INTERVIEW_QUESTIONS.filter((question) => !question.when || question.when(answers));
}
export function missingRequiredWebsiteAnswers(answers: WebsiteInterviewAnswers) {
  return getWebsiteInterviewQuestions(answers)
    .filter((question) => question.required && !answers[question.key]?.trim())
    .map((question) => question.key);
}
