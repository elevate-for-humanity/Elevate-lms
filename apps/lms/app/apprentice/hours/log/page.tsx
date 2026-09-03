import { redirect } from 'next/navigation';

/**
 * Manual hour logging previously duplicated the competency form and could not
 * produce a valid hour_entries record. Apprentices should use the supervised
 * timeclock for OJL. Keep this legacy route as a canonical redirect so existing
 * bookmarks and dashboard links fail safely instead of rendering the wrong form.
 */
export default function ApprenticeHoursLogPage() {
  redirect('/apprentice/timeclock');
}
