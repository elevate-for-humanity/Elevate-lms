import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Microclasses',
};

export default function MicroclassesPage() {
  redirect('/programs');
}
