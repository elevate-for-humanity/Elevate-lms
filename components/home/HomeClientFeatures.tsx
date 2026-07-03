'use client';

/**
 * Client-only components for the home page.
 * next/dynamic with ssr:false must live in a Client Component.
 */

import dynamic from 'next/dynamic';

const NewsletterSignup = dynamic(
  () => import('@/components/NewsletterSignup').then((m) => m.default || m),
  { ssr: false }
);
const SocialMediaHighlight = dynamic(
  () => import('@/components/SocialMediaHighlight').then((m) => m.default || m),
  { ssr: false }
);

export default function HomeClientFeatures() {
  return (
    <>
      <NewsletterSignup />
      <SocialMediaHighlight />
    </>
  );
}
