import { redirect } from 'next/navigation';

// Redirect to the main schedule page — no standalone schedule UI exists per-learner.
// The case manager can book a meeting via Calendly from the main schedule page.
export default function LearnerSchedulePage({ params }: { params: { id: string } }) {
  redirect(`/schedule?learner=${params.id}`);
}
