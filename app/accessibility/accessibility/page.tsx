/**
 * /accessibility/accessibility - Legacy route redirecting to canonical /accessibility
 */
import { redirect } from 'next/navigation';

export default function AccessibilityLegacyRedirect() {
  redirect('/accessibility');
}
