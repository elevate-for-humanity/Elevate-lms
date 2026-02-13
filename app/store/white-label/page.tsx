import { redirect } from 'next/navigation';

// White-label is not a separate product - redirect to licensing
export default function WhiteLabelRedirect() {
  redirect('/store/licenses');
}
