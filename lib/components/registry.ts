// Component registry for the page builder engine.
// Only components listed here can be rendered via PageRenderer.
// This prevents arbitrary code execution from admin-entered data.
//
// To add a new block: import it and add it to the map.

import type { ComponentType } from 'react';

import Hero from '@/components/blocks/Hero';
import RichText from '@/components/blocks/RichText';
import EventFeed from '@/components/blocks/EventFeed';
import JobFeed from '@/components/blocks/JobFeed';
import FormBlock from '@/components/blocks/FormBlock';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ComponentRegistry: Record<string, ComponentType<any>> = {
  Hero,
  RichText,
  EventFeed,
  JobFeed,
  FormBlock,
};

export type RegisteredComponent = keyof typeof ComponentRegistry;

// Human-readable labels for the admin builder UI
export const ComponentLabels: Record<RegisteredComponent, string> = {
  Hero: 'Hero Banner',
  RichText: 'Rich Text',
  EventFeed: 'Event Feed',
  JobFeed: 'Job Feed',
  FormBlock: 'Form',
};

// Default props shown when a component is first added in the builder
export const ComponentDefaults: Record<RegisteredComponent, Record<string, unknown>> = {
  Hero: { title: 'Page Title', subtitle: '', cta: '/apply', cta_label: 'Get Started' },
  RichText: { content: '<p>Enter your content here.</p>' },
  EventFeed: { heading: 'Upcoming Events', limit: 6 },
  JobFeed: { heading: 'Open Positions', limit: 6 },
  FormBlock: { formId: '', heading: 'Contact Us', submit_label: 'Submit', fields: [] },
};
