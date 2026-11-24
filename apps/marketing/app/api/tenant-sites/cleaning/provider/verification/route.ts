import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cleaningContext, cleaningHandler, reply, sameOrigin } from '@/lib/cleaning/server';
import {
  providerVerificationCookie, requestProviderEmailVerification, requireProviderVerificationOrigin,
} from '@/lib/cleaning/provider-email-verification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return cleaningHandler(async () => {
    sameOrigin(request);
    requireProviderVerificationOrigin(request);
    z.object({}).strict().parse(await request.json());
    const { db, user, session } = await cleaningContext(request, false, 'provider-onboarding');
    const { browserNonce } = await requestProviderEmailVerification({ db, user, session });
    const response = reply({ sent: true });
    const cookie = providerVerificationCookie();
    response.cookies.set(cookie.name, browserNonce, cookie.options);
    return response;
  });
}
