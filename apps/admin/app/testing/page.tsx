import { redirect } from 'next/navigation';

/**
 * Legacy route retained for saved links. Testing Center operations are owned
 * by the governed /testing-center workspace; do not build a second client or
 * query testing tables directly from this route.
 */
export default function LegacyTestingPage() {
  redirect('/testing-center');
}
