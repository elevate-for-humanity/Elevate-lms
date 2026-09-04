import { redirect } from 'next/navigation';

/**
 * Compatibility route for bookmarks and older dashboard links.
 * Apprentices upload and track required evidence in the canonical document center.
 */
export default function LegacyStudentDocumentsPage() {
  redirect('/apprentice/documents');
}
