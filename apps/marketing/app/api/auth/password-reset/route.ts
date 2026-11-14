import {passwordResetHandler} from '@/lib/auth/password-recovery-route';
import {getPublicRuntimeService} from '@/lib/health/public-runtime-service';
import {siteUrls} from '@/lib/utils/site-urls';
import type {NextRequest} from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request:NextRequest) {
 const store=getPublicRuntimeService()==='store';
 return passwordResetHandler(store?'https://store.elevateforhumanity.org':siteUrls.app,store)(request);
}
