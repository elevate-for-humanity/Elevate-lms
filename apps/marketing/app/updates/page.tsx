import { permanentRedirect } from 'next/navigation';

/**
 * Historical announcements page. Current public updates are maintained through
 * the canonical blog/content workflow, which is subject to the public claim gate.
 */
export default function UpdatesPage() {
  permanentRedirect('/blog');
}
