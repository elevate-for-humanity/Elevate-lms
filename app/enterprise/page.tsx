import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enterprise Solutions',
  description: 'Workforce training solutions for organizations and employers.',
};


export default function EnterprisePage() {
  redirect('/platform/enterprise');
}
