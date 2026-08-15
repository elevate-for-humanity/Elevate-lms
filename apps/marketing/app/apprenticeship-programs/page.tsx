import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Apprenticeship Programs',
  description: 'Explore current apprenticeship and career training programs.',
  robots: { index: false, follow: true },
};

export default function ApprenticeshipProgramsPage() {
  redirect('/programs');
}
