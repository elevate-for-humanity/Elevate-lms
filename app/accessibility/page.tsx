import { redirect } from 'next/navigation';

export const revalidate = 3600;

export default function AccessibilityPage() {
  // Redirect to canonical nested route to avoid duplicate content
  redirect('/accessibility/accessibility');
}
