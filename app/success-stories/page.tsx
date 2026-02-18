import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Success Stories',
  description: 'Read how Elevate for Humanity graduates transformed their careers.',
};


export default function SuccessStoriesPage() {
  redirect('/testimonials');
}
