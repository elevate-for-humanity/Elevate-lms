import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Forms & Documents | Elevate for Humanity',
  description: 'Review your assigned documents, agreements, and submitted records.',
};

// Use the authenticated, learner-owned records view instead of a fabricated
// list of universally required forms with inactive download/signing buttons.
export { default } from '../lms/(app)/documents/page';
