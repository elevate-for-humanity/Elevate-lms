'use client';

import dynamicImport from 'next/dynamic';

const NewsletterSignup = dynamicImport(() => import('@/components/NewsletterSignup'), {
  ssr: false,
});

const SocialMediaHighlight = dynamicImport(() => import('@/components/SocialMediaHighlight'), {
  ssr: false,
});

export default function HomeClientShell() {
  return (
    <>
      <SocialMediaHighlight />
      <NewsletterSignup />
    </>
  );
}
