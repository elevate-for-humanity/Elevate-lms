import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Partners',
  description: 'Organizations and employers partnering with Elevate for Humanity.',
};


export default function PartnersRedirect() {
  redirect('/platform/partners');
}
