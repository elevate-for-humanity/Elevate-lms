import {redirect} from 'next/navigation';
import {getPublicRuntimeService} from '@/lib/health/public-runtime-service';
import {StoreResetPassword} from '@/components/store/StoreResetPassword';
import {siteUrls} from '@/lib/utils/site-urls';
export const dynamic='force-dynamic';
export const metadata={title:'Reset Password | Elevate Store',robots:{index:false,follow:false}};
export default function ResetPasswordPage() {
 if(getPublicRuntimeService()!=='store')redirect(new URL('/reset-password',siteUrls.app).toString());
 return <StoreResetPassword/>;
}
