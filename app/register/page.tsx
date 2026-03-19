import { redirect } from 'next/navigation';

// /register is not the canonical signup route — redirect to /signup
export default function RegisterPage() {
  redirect('/signup');
}
