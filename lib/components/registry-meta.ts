// Client-safe registry metadata — no component imports, no next/headers.
// Import this in Client Components (admin builder UI).
// Import registry.ts only in Server Components or PageRenderer.

export type RegisteredComponent =
  | 'Hero'
  | 'RichText'
  | 'EventFeed'
  | 'JobFeed'
  | 'FormBlock';

export const ComponentLabels: Record<RegisteredComponent, string> = {
  Hero: 'Hero Banner',
  RichText: 'Rich Text',
  EventFeed: 'Event Feed',
  JobFeed: 'Job Feed',
  FormBlock: 'Form',
};

export const ComponentDefaults: Record<RegisteredComponent, Record<string, unknown>> = {
  Hero: { title: 'Page Title', subtitle: '', cta: '/apply', cta_label: 'Get Started' },
  RichText: { content: '<p>Enter your content here.</p>' },
  EventFeed: { heading: 'Upcoming Events', limit: 6 },
  JobFeed: { heading: 'Open Positions', limit: 6 },
  FormBlock: { formId: '', heading: 'Contact Us', submit_label: 'Submit', fields: [] },
};
