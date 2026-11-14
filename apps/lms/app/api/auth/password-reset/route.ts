import {passwordResetHandler} from '@/lib/auth/password-recovery-route';
import {siteUrls} from '@/lib/utils/site-urls';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = passwordResetHandler(siteUrls.app);
