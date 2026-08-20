import { permanentRedirect } from 'next/navigation';

/**
 * Historical student-resource landing page. The canonical student application
 * and program catalog own enrollment, funding, credential, and career-service
 * disclosures. Consolidating this route prevents a second universal six-step
 * journey from implying funding, credential, or placement outcomes.
 */
export default function ForStudentsPage() {
  permanentRedirect('/apply/student');
}
