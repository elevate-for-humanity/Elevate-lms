import { NextResponse } from 'next/server';

export async function GET() {
  // Bing Webmaster Tools verification
  // Replace with your actual verification code from Bing Webmaster Tools
  const verificationCode = process.env.BING_SITE_VERIFICATION || 'your-bing-verification-code';

  const xml = `<?xml version="1.0"?>
<users>
  <user>${verificationCode}</user>
</users>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
