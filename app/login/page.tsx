// Marketing login redirects to the canonical LMS login
// The LMS application owns the authentication flow

import { redirect } from 'next/navigation';

const LMS_LOGIN_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
  : 'https://app.elevateforhumanity.org/login';

export default function LoginRedirect() {
  redirect(LMS_LOGIN_URL);
}
