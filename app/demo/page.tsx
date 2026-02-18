import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Demo',
  description: 'See how the Elevate for Humanity learning platform works.',
};


export default function DemoRedirect() {
  redirect('/demo/admin');
}
