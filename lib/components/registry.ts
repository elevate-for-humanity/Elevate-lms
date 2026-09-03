// Component registry for the page builder engine.
// Only components listed here can be rendered via PageRenderer.
// This prevents arbitrary code execution from admin-entered data.
//
// To add a new block: import it and add it to the map.
//
// NOTE: This file imports Server Components (e.g. JobFeed uses next/headers).
// Do NOT import this file from Client Components — use registry-meta.ts instead.

import type { ComponentType } from 'react';

import Hero from '@/components/blocks/Hero';
import RichText from '@/components/blocks/RichText';
import EventFeed from '@/components/blocks/EventFeed';
import JobFeed from '@/components/blocks/JobFeed';
import FormBlock from '@/components/blocks/FormBlock';

export const ComponentRegistry: Record<string, ComponentType<any>> = {
  Hero,
  RichText,
  EventFeed,
  JobFeed,
  FormBlock,
};

// Re-export client-safe metadata so server-side code can import from one place.
export type { RegisteredComponent } from './registry-meta';
export { ComponentLabels, ComponentDefaults } from './registry-meta';
