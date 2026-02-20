import { redirect } from 'next/navigation';

export default function MentorshipApplyRedirect() {
  redirect('/apply/student?program=mentorship');
}
