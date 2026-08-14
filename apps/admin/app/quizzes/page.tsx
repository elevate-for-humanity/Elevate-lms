import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

// Quiz management is part of the canonical Course Builder.
export default function QuizzesPage() {
  redirect('/course-builder');
}
