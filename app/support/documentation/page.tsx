import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation | Elevate for Humanity',
  description: 'Platform documentation and help resources.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/help',
  },
};

// Redirect to help page
export default function DocumentationPage() {
  redirect('/help/articles');
}
