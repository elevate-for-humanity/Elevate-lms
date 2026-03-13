import { redirect } from 'next/navigation';

// /selfish-inc → /rise-foundation
// Selfish Inc. is the legal entity (501(c)(3)) operating The Rise Foundation.
export default function SelishIncRedirect() {
  redirect('/rise-foundation');
}
