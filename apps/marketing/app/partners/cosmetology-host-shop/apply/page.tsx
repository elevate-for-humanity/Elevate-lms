import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function CosmetologyHostShopApplyRedirect() {
  redirect('/partners/host-shop/apply');
}
