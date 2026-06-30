import { NextResponse } from 'next/server';

export async function GET() {
  // Google Search Console verification
  // Replace with your actual verification code from Google Search Console
  const verificationCode = process.env.GOOGLE_SITE_VERIFICATION || 'your-google-verification-code';

  return new NextResponse(verificationCode, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
